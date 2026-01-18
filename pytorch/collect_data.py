"""import cv2
import numpy as np
import os
from collections import deque

from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import mediapipe as mp

SIGNS = ["hello","father","mother","no","me","thankyou","help","what"]

os.makedirs("dataset", exist_ok=True)

# ----- NEW MEDIAPIPE TASKS API -----
options = vision.HandLandmarkerOptions(
    base_options=python.BaseOptions(model_asset_path='hand_landmarker.task'),
    num_hands=2,
    running_mode=vision.RunningMode.IMAGE
)

landmarker = vision.HandLandmarker.create_from_options(options)


def landmarks_to_vector(result):
    left = np.zeros(63)
    right = np.zeros(63)

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


cap = cv2.VideoCapture(1)

for sign in SIGNS:
    print(f"\nCollecting for: {sign}")
    input("Press ENTER to start")

    seq = deque(maxlen=20)
    samples = []

    while len(samples) < 40:
        ret, frame = cap.read()
        if not ret:
            continue

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb
        )

        result = landmarker.detect(mp_image)

        vec = landmarks_to_vector(result)
        seq.append(vec)

        if len(seq) == 20:
            samples.append(np.array(seq))

        cv2.putText(frame,
            f"{sign}: {len(samples)}/80",
            (10,40), cv2.FONT_HERSHEY_SIMPLEX,
            1,(0,255,0),2)

        cv2.imshow("collect", frame)

        if cv2.waitKey(1) == 27:
            break

    np.save(f"dataset/{sign}.npy", np.array(samples))
    print(f"Saved dataset/{sign}.npy")

cap.release()
cv2.destroyAllWindows()
"""
import cv2
import numpy as np
import os
from collections import deque
import glob

# ===== CORRECT MEDIAPIPE IMPORTS =====
from mediapipe import Image, ImageFormat
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

SIGNS = ["thankyou"]

os.makedirs("dataset", exist_ok=True)

# --------------------------------------------------
# 1) Create Hand Detector (IMAGE MODE IS FINE HERE)
# --------------------------------------------------
options = vision.HandLandmarkerOptions(
    base_options=python.BaseOptions(
        model_asset_path='hand_landmarker.task'
    ),
    num_hands=2
)

landmarker = vision.HandLandmarker.create_from_options(options)


# --------------------------------------------------
# 2) Convert landmarks → 126-dim vector
# --------------------------------------------------
def landmarks_to_vector(result):
    # 21 points × 3 coords = 63 per hand
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


# --------------------------------------------------
# 3) START CAMERA
# --------------------------------------------------
cap = cv2.VideoCapture(1)   # <-- MOST MACS NEED 0

if not cap.isOpened():
    print("❌ Camera not found!")
    exit()


for sign in SIGNS:
    print(f"\n===== Collecting for: {sign} =====")
    input("Press ENTER to start recording...")


    for count in range(40):
        # Allow user to get ready
        while True:
            ret, frame = cap.read()
            if not ret: continue
            frame = cv2.flip(frame, 1)
            cv2.putText(frame, f"Ready? Press SPACE for sample {count+1}/40", (20,40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,255), 2)
            cv2.putText(frame, f"Collecting: {sign}", (20,80),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)
            cv2.imshow("collect", frame)
            
            if cv2.waitKey(1) == 32: # SPACE
                break
            if cv2.waitKey(1) == 27: # ESC
                cap.release()
                cv2.destroyAllWindows()
                exit()

        # Record 20 frames
        seq = []
        while len(seq) < 20:
            ret, frame = cap.read()
            if not ret: continue
            
            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = Image(image_format=ImageFormat.SRGB, data=rgb)
            
            result = landmarker.detect(mp_image)
            vec = landmarks_to_vector(result)
            seq.append(vec)
            
            cv2.putText(frame, f"Recording {len(seq)}/20", (20,40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
            cv2.imshow("collect", frame)
            cv2.waitKey(1)

        # Save this distinct sample
        save_path = f"dataset/{sign}/{sign}_{count}.npy"
        np.save(save_path, np.array(seq))
        print(f"Saved {save_path}")



cap.release()
cv2.destroyAllWindows()
