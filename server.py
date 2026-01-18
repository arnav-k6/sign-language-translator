"""
Flask server for Sign Language Translator GUI
Provides video streaming, AI predictions, and API endpoints for the React frontend
"""

import cv2
import mediapipe as mp
import numpy as np
import time
import threading
import torch
import joblib
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from collections import deque
from dataparser import append_frame
from detect import get_os
from video_transcriber import transcribe_video_file
import tempfile
import os as os_module

app = Flask(__name__)
CORS(app)

# ================= CONFIG =================
BUFFER_SIZE = 200
gesture_buffer = deque(maxlen=BUFFER_SIZE)
capture_count = 0
is_running = True

model_path = 'hand_landmarker.task'
MODEL_FILE = 'gesture_model_pytorch.pth'
SCALER_FILE = 'gesture_scaler.pkl'

# Current settings (configurable via API)
current_settings = {
    'num_hands': 2,
    'min_tracking_confidence': 0.4,
    'min_hand_detection_confidence': 0.4,
    'min_hand_presence_confidence': 0.6,
    'prediction_mode': 'both',  # 'letters', 'numbers', or 'both'
    'min_stable_duration': 0.25, # seconds
    'transcription_confidence': 0.75,
}

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
HandLandmarkerResult = mp.tasks.vision.HandLandmarkerResult
VisionRunningMode = mp.tasks.vision.RunningMode

# Hand skeleton topology
HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (17, 18), (18, 19), (19, 20),
    (0, 17)
]

TIP_IDS = [4, 8, 12, 16, 20]
NUM_LANDMARKS = 21
NUM_COORDS = 3

latest_result = None
current_landmarks = []  # For API access
current_prediction = {"letter": "", "confidence": 0.0}  # Store latest prediction
lock = threading.Lock()
landmarker = None
settings_changed = False


# =============== NEURAL NETWORK =================
class SignLanguageClassifier(torch.nn.Module):
    def __init__(self, input_size, hidden1, hidden2, num_classes):
        super(SignLanguageClassifier, self).__init__()
        self.layer1 = torch.nn.Linear(input_size, hidden1)
        self.layer2 = torch.nn.Linear(hidden1, hidden2)
        self.layer3 = torch.nn.Linear(hidden2, num_classes)
        self.relu = torch.nn.ReLU()
        self.dropout = torch.nn.Dropout(0.3)
        self.bn1 = torch.nn.BatchNorm1d(hidden1)
        self.bn2 = torch.nn.BatchNorm1d(hidden2)
    
    def forward(self, x):
        x = self.layer1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.layer2(x)
        x = self.bn2(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.layer3(x)
        return x


# =============== MODEL LOADING =================
ml_model = None
scaler = None
classes = None
model_loaded = False

def load_ml_model():
    """Load the trained PyTorch model and scaler"""
    global ml_model, scaler, classes, model_loaded
    
    try:
        print("🧠 Loading AI model...")
        
        # Load model checkpoint
        checkpoint = torch.load(MODEL_FILE, map_location='cpu', weights_only=False)
        
        # Recreate the model architecture
        ml_model = SignLanguageClassifier(
            checkpoint['input_size'],
            checkpoint['hidden1'],
            checkpoint['hidden2'],
            checkpoint['num_classes']
        )
        ml_model.load_state_dict(checkpoint['model_state_dict'])
        ml_model.eval()  # Set to evaluation mode
        
        # Get class labels
        classes = checkpoint['label_encoder_classes']
        
        # Load scaler
        scaler = joblib.load(SCALER_FILE)
        
        model_loaded = True
        print(f"  ✅ Model loaded successfully")
        print(f"  📚 Classes: {list(classes)}")
        
    except Exception as e:
        print(f"  ❌ Failed to load model: {e}")
        model_loaded = False


def predict_gesture(left_features, right_features):
    """Make a prediction from landmark features"""
    global current_prediction
    
    if not model_loaded:
        return "", 0.0
    
    try:
        mode = current_settings.get('prediction_mode', 'both')
        
        # Combine features (left hand first, then right - matching training order)
        features = np.array(left_features + right_features).reshape(1, -1)
        
        # Scale features (same as during training)
        features_scaled = scaler.transform(features)
        
        # Convert to tensor
        features_tensor = torch.FloatTensor(features_scaled)
        
        # Predict
        with torch.no_grad():
            outputs = ml_model(features_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            
            # Filter by mode
            if mode == 'letters':
                valid_indices = [i for i, c in enumerate(classes) if c.isalpha()]
            elif mode == 'numbers':
                valid_indices = [i for i, c in enumerate(classes) if c.isdigit()]
            else:
                valid_indices = list(range(len(classes)))
            
            if not valid_indices:
                return "", 0.0
            
            # Get best prediction among valid classes
            filtered_probs = probabilities[0, valid_indices]
            best_idx = filtered_probs.argmax().item()
            confidence_value = filtered_probs[best_idx].item()
            predicted_class = classes[valid_indices[best_idx]]
        
        # Update current prediction
        with lock:
            current_prediction = {
                "letter": str(predicted_class),
                "confidence": float(confidence_value)
            }
        
        return predicted_class, confidence_value
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return "", 0.0


def get_empty_hand():
    """Return zeros for undetected hand"""
    return [0.0] * (NUM_LANDMARKS * NUM_COORDS)


# =============== CALLBACK =================
def result_callback(result: HandLandmarkerResult, output_image: mp.Image, timestamp_ms: int):
    global latest_result
    latest_result = result


def create_landmarker():
    """Create a new HandLandmarker with current settings"""
    global landmarker
    
    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model_path),
        running_mode=VisionRunningMode.LIVE_STREAM,
        num_hands=current_settings['num_hands'],
        result_callback=result_callback,
        min_tracking_confidence=current_settings['min_tracking_confidence'],
        min_hand_detection_confidence=current_settings['min_hand_detection_confidence'],
        min_hand_presence_confidence=current_settings['min_hand_presence_confidence']
    )
    
    return HandLandmarker.create_from_options(options)


# Load AI model at startup
load_ml_model()

# Create initial landmarker
landmarker = create_landmarker()

# Camera setup
if get_os() == "mac":
    cap = cv2.VideoCapture(1)
else:
    cap = cv2.VideoCapture(0)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)


def generate_frames():
    """Generator for MJPEG video stream"""
    global latest_result, current_landmarks, is_running, landmarker, settings_changed, current_prediction
    
    while is_running and cap.isOpened():
        # Check if settings changed and recreate landmarker
        if settings_changed:
            with lock:
                if landmarker:
                    landmarker.close()
                landmarker = create_landmarker()
                settings_changed = False
        
        success, frame = cap.read()
        if not success:
            break
        
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        
        timestamp = int(time.time() * 1000)
        
        try:
            landmarker.detect_async(mp_image, timestamp)
        except Exception as e:
            print(f"Detection error: {e}")
            continue
        
        # Process landmarks
        frame_landmarks = []
        left_features = get_empty_hand()
        right_features = get_empty_hand()
        
        if latest_result and latest_result.hand_landmarks:
            # Use detection order (idx 0 = left, idx 1 = right) to match training data collection
            # This matches data_collector.py which assigned first detected hand to left_features
            for idx, hand_lms in enumerate(latest_result.hand_landmarks):
                features = []
                for lm in hand_lms:
                    features.extend([lm.x, lm.y, lm.z])
                    frame_landmarks.extend([lm.x, lm.y, lm.z])
                
                # Match data_collector.py: idx 0 = left, idx 1 = right
                if idx == 0:
                    left_features = features
                else:
                    right_features = features
            
            # Pad with zeros if only one hand detected
            if len(latest_result.hand_landmarks) == 1:
                frame_landmarks.extend([0.0] * 63)
            
            # Make prediction if model is loaded
            if model_loaded:
                predict_gesture(left_features, right_features)
            
            # Draw on frame
            for hand_landmarks in latest_result.hand_landmarks:
                h, w, _ = frame.shape
                
                # Draw skeleton
                for c in HAND_CONNECTIONS:
                    start = hand_landmarks[c[0]]
                    end = hand_landmarks[c[1]]
                    x1, y1 = int(start.x * w), int(start.y * h)
                    x2, y2 = int(end.x * w), int(end.y * h)
                    cv2.line(frame, (x1, y1), (x2, y2), (0, 200, 255), 2)
                
                # Draw points
                for i, lm in enumerate(hand_landmarks):
                    x, y = int(lm.x * w), int(lm.y * h)
                    color = (0, 255, 100)
                    radius = 5
                    if i in TIP_IDS:
                        color = (255, 100, 100)
                        radius = 8
                    cv2.circle(frame, (x, y), radius, color, -1)
            
            # Draw prediction on frame
            with lock:
                pred = current_prediction.copy()
            
            if pred["letter"] and pred["confidence"] > 0.3:
                # Large letter display
                cv2.putText(frame, pred["letter"], (50, 120), 
                           cv2.FONT_HERSHEY_SIMPLEX, 4, (0, 255, 0), 8)
                
                # Confidence bar
                bar_width = int(pred["confidence"] * 250)
                cv2.rectangle(frame, (50, 150), (50 + bar_width, 175), (0, 255, 0), -1)
                cv2.rectangle(frame, (50, 150), (300, 175), (255, 255, 255), 2)
                cv2.putText(frame, f"{pred['confidence']:.0%}", (310, 170),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        else:
            # No hands - clear prediction
            with lock:
                current_prediction = {"letter": "", "confidence": 0.0}
        
        # Update buffer and current landmarks
        if len(frame_landmarks) == 126:
            with lock:
                gesture_buffer.append(frame_landmarks)
                current_landmarks = frame_landmarks.copy()
        
        # Encode frame
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        time.sleep(0.016)  # ~60fps cap


# =============== API ROUTES =================

@app.route('/video_feed')
def video_feed():
    """MJPEG video stream"""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/prediction')
def prediction():
    """Get current AI prediction"""
    with lock:
        return jsonify({
            "letter": current_prediction["letter"],
            "confidence": current_prediction["confidence"],
            "model_loaded": model_loaded,
            "mode": current_settings.get('prediction_mode', 'both')
        })


@app.route('/capture', methods=['POST'])
def capture():
    """Capture current gesture buffer to CSV"""
    global capture_count
    
    with lock:
        if len(gesture_buffer) == BUFFER_SIZE:
            flattened = []
            for landmark_frame in gesture_buffer:
                flattened.extend(landmark_frame)
            gesture_buffer.clear()
            
            # Save async
            def save_async(data):
                append_frame(data)
            
            threading.Thread(target=save_async, args=(flattened,), daemon=True).start()
            capture_count += 1
            
            return jsonify({
                "success": True,
                "message": "Gesture captured!",
                "capture_count": capture_count
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Buffer not full: {len(gesture_buffer)}/{BUFFER_SIZE}",
                "buffer_level": len(gesture_buffer)
            })


@app.route('/quit', methods=['POST'])
def quit_app():
    """Stop the hand tracker"""
    global is_running
    is_running = False
    
    def shutdown():
        time.sleep(0.5)
        cap.release()
        if landmarker:
            landmarker.close()
    
    threading.Thread(target=shutdown, daemon=True).start()
    
    return jsonify({"success": True, "message": "Shutting down..."})


@app.route('/api/transcribe', methods=['POST'])
def transcribe_video():
    """Transcribe an uploaded sign language video to text"""
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "No video file selected"}), 400
    
    # Save to temp file
    temp_fd, temp_path = tempfile.mkstemp(suffix='.mp4')
    try:
        video_file.save(temp_path)
        
        # Get settings
        mode = current_settings.get('prediction_mode', 'both')
        min_stable_duration = current_settings.get('min_stable_duration', 0.25)
        confidence_threshold = current_settings.get('transcription_confidence', 0.75)
        
        print(f"Using settings: duration={min_stable_duration}s, conf={confidence_threshold}")

        # Transcribe the video
        result_text = transcribe_video_file(
            temp_path, 
            mode=mode,
            confidence_threshold=confidence_threshold,
            min_stable_duration=min_stable_duration
        )
        
        return jsonify({"text": result_text, "success": True})
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Transcription error: {e}")
        return jsonify({"error": str(e), "text": ""}), 500
    finally:
        # Cleanup temp file
        os_module.close(temp_fd)
        if os_module.path.exists(temp_path):
            os_module.unlink(temp_path)


@app.route('/status')
def status():
    """Get current status"""
    with lock:
        return jsonify({
            "buffer_level": len(gesture_buffer),
            "buffer_size": BUFFER_SIZE,
            "capture_count": capture_count,
            "is_running": is_running,
            "has_hands": len(current_landmarks) == 126,
            "model_loaded": model_loaded
        })


@app.route('/landmarks')
def landmarks():
    """Get current landmark data for visualization"""
    with lock:
        if len(current_landmarks) == 126:
            # Extract fingertip positions (indices 4, 8, 12, 16, 20 for right hand)
            fingertips = {
                "thumb": {"x": current_landmarks[4*3], "y": current_landmarks[4*3+1]},
                "index": {"x": current_landmarks[8*3], "y": current_landmarks[8*3+1]},
                "middle": {"x": current_landmarks[12*3], "y": current_landmarks[12*3+1]},
                "ring": {"x": current_landmarks[16*3], "y": current_landmarks[16*3+1]},
                "pinky": {"x": current_landmarks[20*3], "y": current_landmarks[20*3+1]},
            }
            return jsonify({
                "has_data": True,
                "fingertips": fingertips,
                "all_landmarks": current_landmarks
            })
        else:
            return jsonify({"has_data": False})


@app.route('/settings', methods=['GET'])
def get_settings():
    """Get current HandLandmarker settings"""
    return jsonify(current_settings)


@app.route('/settings', methods=['POST'])
def update_settings():
    """Update HandLandmarker settings"""
    global current_settings, settings_changed
    
    try:
        data = request.get_json()
        
        # Validate and update settings
        if 'num_hands' in data:
            num_hands = int(data['num_hands'])
            if num_hands in [1, 2]:
                current_settings['num_hands'] = num_hands
        
        if 'min_tracking_confidence' in data:
            val = float(data['min_tracking_confidence'])
            if 0 <= val <= 1:
                current_settings['min_tracking_confidence'] = val
        
        if 'min_hand_detection_confidence' in data:
            val = float(data['min_hand_detection_confidence'])
            if 0 <= val <= 1:
                current_settings['min_hand_detection_confidence'] = val
        
        if 'min_hand_presence_confidence' in data:
            val = float(data['min_hand_presence_confidence'])
            if 0 <= val <= 1:
                current_settings['min_hand_presence_confidence'] = val
        
        if 'prediction_mode' in data:
            mode = data['prediction_mode']
            if mode in ['letters', 'numbers', 'both']:
                current_settings['prediction_mode'] = mode

        if 'min_stable_duration' in data:
            val = float(data['min_stable_duration'])
            if 0.1 <= val <= 3.0: # Sensible limits
                current_settings['min_stable_duration'] = val
        
        if 'transcription_confidence' in data:
            val = float(data['transcription_confidence'])
            if 0 <= val <= 1.0:
                current_settings['transcription_confidence'] = val
        
        # Flag for landmarker recreation
        settings_changed = True
        
        return jsonify({
            "success": True,
            "message": "Settings updated",
            "settings": current_settings
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error updating settings: {str(e)}"
        }), 400


if __name__ == '__main__':
    print("🚀 Starting Sign Language Translator Server...")
    print("📹 Video feed: http://localhost:5000/video_feed")
    print("🎮 API endpoints: /capture, /quit, /status, /landmarks, /settings, /prediction")
    app.run(host='0.0.0.0', port=5001, threaded=True)
