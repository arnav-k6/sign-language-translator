import cv2
import mediapipe as mp
import numpy as np
import time
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from detect import get_os


# ================= CONFIG =================
model_path = 'hand_landmarker.task'

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
HandLandmarkerResult = mp.tasks.vision.HandLandmarkerResult
VisionRunningMode = mp.tasks.vision.RunningMode


# ---- Hand skeleton topology (Tasks API compatible) ----
HAND_CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,4),        # thumb
    (0,5),(5,6),(6,7),(7,8),        # index
    (5,9),(9,10),(10,11),(11,12),   # middle
    (9,13),(13,14),(14,15),(15,16), # ring
    (13,17),(17,18),(18,19),(19,20),# pinky
    (0,17)                          # palm base
]

TIP_IDS = [4, 8, 12, 16, 20]
hand_data = []

latest_result = None


# =============== CALLBACK =================
def print_result(result: HandLandmarkerResult, output_image: mp.Image, timestamp_ms: int):
    global latest_result
    latest_result = result


# =============== OPTIONS ==================
options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model_path),
    running_mode=VisionRunningMode.LIVE_STREAM,
    num_hands=2,
    result_callback=print_result,

    min_tracking_confidence=0.4,
    min_hand_detection_confidence=0.4,
    min_hand_presence_confidence=0.6
)


# =============== MAIN LOOP =================
with HandLandmarker.create_from_options(options) as landmarker:

    if(get_os() == "mac"):
        cap = cv2.VideoCapture(1)
    else:
        cap = cv2.VideoCapture(0)
        
    # Optional HD
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    while cap.isOpened():
        success, frame = cap.read()
        if not success: break

        # 1. CAPTURE KEYPRESS ONCE PER LOOP
        key = cv2.waitKey(1) & 0xFF
        
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        
        timestamp = int(time.time() * 1000)
        landmarker.detect_async(mp_image, timestamp)

        # ============ DRAWING ============
        if latest_result and latest_result.hand_landmarks:

            first_hand = latest_result.hand_landmarks[0]
    
            for lm in first_hand:
                hand_data.append(lm.x)
                hand_data.append(lm.y)
                hand_data.append(lm.z)


            if(len(hand_data) == 63):
                if key == ord('d'):
                    with open("dataset.txt", "a") as f:
                        f.write(str(hand_data) + "\n")
                    hand_data = []

            for hand_landmarks in latest_result.hand_landmarks:

                h, w, _ = frame.shape

                # ---- 1. Draw skeleton ----
                for c in HAND_CONNECTIONS:
                    start = hand_landmarks[c[0]]
                    end   = hand_landmarks[c[1]]

                    x1, y1 = int(start.x * w), int(start.y * h)
                    x2, y2 = int(end.x * w),   int(end.y * h)

                    cv2.line(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)

                # ---- 2. Draw points ----
                for i, lm in enumerate(hand_landmarks):
                    x, y = int(lm.x * w), int(lm.y * h)

                    color = (0, 255, 0)
                    radius = 4

                    if i in TIP_IDS:
                        color = (0, 0, 255)   # fingertips red
                        radius = 7

                    cv2.circle(frame, (x, y), radius, color, -1)

        # Show
        cv2.imshow('Hand Tracking - Tasks API', frame)

        if key == ord('q'):
            break


    cap.release()
    cv2.destroyAllWindows()
