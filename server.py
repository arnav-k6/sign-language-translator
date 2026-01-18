"""
Flask server for Sign Language Translator GUI
Provides video streaming and API endpoints for the React frontend
"""

import cv2
import mediapipe as mp
import numpy as np
import time
import threading
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from collections import deque
from dataparser import append_frame
from detect import get_os

app = Flask(__name__)
CORS(app)

# ================= CONFIG =================
BUFFER_SIZE = 200
gesture_buffer = deque(maxlen=BUFFER_SIZE)
capture_count = 0
is_running = True

model_path = 'hand_landmarker.task'
numberOfHands = 2

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
latest_result = None
current_landmarks = []  # For API access
lock = threading.Lock()


# =============== CALLBACK =================
def result_callback(result: HandLandmarkerResult, output_image: mp.Image, timestamp_ms: int):
    global latest_result
    latest_result = result


# =============== OPTIONS ==================
options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model_path),
    running_mode=VisionRunningMode.LIVE_STREAM,
    num_hands=numberOfHands,
    result_callback=result_callback,
    min_tracking_confidence=0.4,
    min_hand_detection_confidence=0.4,
    min_hand_presence_confidence=0.6
)

# Create landmarker
landmarker = HandLandmarker.create_from_options(options)

# Camera setup
if get_os() == "mac":
    cap = cv2.VideoCapture(1)
else:
    cap = cv2.VideoCapture(0)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)


def generate_frames():
    """Generator for MJPEG video stream"""
    global latest_result, current_landmarks, is_running
    
    while is_running and cap.isOpened():
        success, frame = cap.read()
        if not success:
            break
        
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        
        timestamp = int(time.time() * 1000)
        landmarker.detect_async(mp_image, timestamp)
        
        # Process landmarks
        frame_landmarks = []
        
        if latest_result and latest_result.hand_landmarks:
            hands_found = {"Right": None, "Left": None}
            
            for idx, hand_lms in enumerate(latest_result.hand_landmarks):
                label = latest_result.handedness[idx][0].category_name
                hands_found[label] = hand_lms
            
            # Build fixed-order landmark array
            for side in ["Right", "Left"]:
                if hands_found[side]:
                    for lm in hands_found[side]:
                        frame_landmarks.extend([lm.x, lm.y, lm.z])
                else:
                    frame_landmarks.extend([0.0] * 63)
            
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
        landmarker.close()
    
    threading.Thread(target=shutdown, daemon=True).start()
    
    return jsonify({"success": True, "message": "Shutting down..."})


@app.route('/status')
def status():
    """Get current status"""
    with lock:
        return jsonify({
            "buffer_level": len(gesture_buffer),
            "buffer_size": BUFFER_SIZE,
            "capture_count": capture_count,
            "is_running": is_running,
            "has_hands": len(current_landmarks) == 126
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


if __name__ == '__main__':
    print("🚀 Starting Sign Language Translator Server...")
    print("📹 Video feed: http://localhost:5000/video_feed")
    print("🎮 API endpoints: /capture, /quit, /status, /landmarks")
    app.run(host='0.0.0.0', port=5000, threaded=True)
