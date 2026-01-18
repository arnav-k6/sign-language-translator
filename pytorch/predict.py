import cv2
import numpy as np
import torch
from collections import deque

from mediapipe import Image, ImageFormat
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from model import SignModel



SIGNS = ["hello", "me", "thankyou", "no", "yes"]


# ===== MediaPipe =====


# ===== MediaPipe Hand & Face =====
hand_options = vision.HandLandmarkerOptions(
    base_options=python.BaseOptions(model_asset_path='hand_landmarker.task'),
    num_hands=2
)
hand_detector = vision.HandLandmarker.create_from_options(hand_options)

face_options = vision.FaceLandmarkerOptions(
    base_options=python.BaseOptions(model_asset_path='face_landmarker.task'),
    num_faces=1
)
face_detector = vision.FaceLandmarker.create_from_options(face_options)


# ===== Load YOUR model =====
model = SignModel(len(SIGNS))
if torch.cuda.is_available():
    map_location = None # default
else:
    map_location = "cpu"
    
try:
    model.load_state_dict(torch.load("sign_model.pth", map_location=map_location))
except:
    print("Warning: sign_model.pth not found or incompatible. Proceeding for HELLO check only.")
    
model.eval()


# ----- convert landmarks -----
def to_vec(result):
    left = np.zeros(63)
    right = np.zeros(63)

    if not result.hand_landmarks:
        return np.concatenate([left, right])

    for i, hand in enumerate(result.hand_landmarks):
        arr = []
        for p in hand:
            arr += [p.x, p.y, p.z]

        handed = result.handedness[i][0].category_name

        if handed == "Left":
            left = np.array(arr)
        else:
            right = np.array(arr)

    return np.concatenate([left, right])

def are_fingers_extended(hand_landmarks):
    # simple check: finger tip y < finger dip y (for upright hand)
    # or just distance from wrist logic?
    # Let's use vector extension check from wrist
    # Thumb: 4, Index: 8, Middle: 12, Ring: 16, Pinky: 20
    # Wrist: 0
    # This is a heuristic. A robust Way is looking at joint angles.
    # For now, let's assume 'upright' hand, tip.y < pip.y
    extended_count = 0
    tips = [8, 12, 16, 20]
    pips = [6, 10, 14, 18]
    
    # Thumb slightly differs, tip x/y vs ip x/y depending on hand side
    # Lets ignore thumb strictness for simple 'hello' wave
    

    for t_idx, p_idx in zip(tips, pips):
        if hand_landmarks[t_idx].y < hand_landmarks[p_idx].y:
            extended_count += 1
            
    return extended_count >= 2 # User feedback: "using 2 fingers is fine"

def get_dist(p1, p2):
    return np.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)


seq = deque(maxlen=20)

cap = cv2.VideoCapture(1)



print("Press Q to quit")

prev_dist = None
hello_counter = 0
hello_cooldown = 0
current_text = "..."

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    mp_image = Image(ImageFormat.SRGB, rgb)

    hand_result = hand_detector.detect(mp_image)
    face_result = face_detector.detect(mp_image)
    
    # 1. Prediction (Model)
    vec = to_vec(hand_result)
    seq.append(vec)

    # Use a persistent variable for text to support cooldown
    if hello_cooldown > 0:
        current_text = "HELLO"
        hello_cooldown -= 1
    else:
        current_text = "..."


    if len(seq) == 20:
        # Only predict if the sequence has actual data (not just zeros)
        # ... (Same model logic, output goes to predicted_sign, ignores 'hello')
        arr = np.array(seq)
        if np.sum(np.abs(arr)) < 1.0:
            pass # No hands
        else:
            x = torch.tensor(arr, dtype=torch.float32).unsqueeze(0)
            with torch.no_grad():
                try:
                    pred = model(x)
                    probs = torch.softmax(pred, dim=1)
                    if probs.max() > 0.7:
                        idx = pred.argmax(1).item()
                        predicted_sign = SIGNS[idx]
                        if predicted_sign.lower() != "hello" and hello_cooldown == 0:
                            current_text = predicted_sign
                except:
                    pass

    # 2. Strict HELLO Check
    is_hello_frame = False
    
    if hand_result.hand_landmarks and face_result.face_landmarks:
        # Check first found hand/face
        hand_lm = hand_result.hand_landmarks[0]
        face_lm = face_result.face_landmarks[0]
        
        index_tip = hand_lm[8]
        nose = face_lm[1]
        
        dist = get_dist(index_tip, nose)
        
        is_moving_away = False
        if prev_dist is not None:
             # Reduced threshold slightly to catch slower movements
             if dist > prev_dist + 0.002: 
                 is_moving_away = True
        
        is_above = index_tip.y < nose.y 
        is_side = abs(index_tip.x - nose.x) > 0.05 
        is_close_range = dist < 1.0 

        if is_above and is_side and is_close_range and is_moving_away: 
            if are_fingers_extended(hand_lm):
                is_hello_frame = True
        
        prev_dist = dist
    
    # Stability Check
    if is_hello_frame:
        hello_counter += 1
    else:
        hello_counter = 0
        
    # Trigger HELLO after 5 consistent frames (approx 0.15s) -> "a little bit late"
    if hello_counter >= 5:
        current_text = "HELLO"
        # Reset counter to avoid rapid re-triggering if we want pulse, keeps it on if held
        # but here we want to EXTEND it.
        hello_cooldown = 10 # Hold for ~1.3 seconds -> "output the hello longer"


    cv2.putText(frame, current_text,
                (40, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.5, (0,255,0), 3)

    cv2.imshow("ASL", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break


cap.release()
cv2.destroyAllWindows()
