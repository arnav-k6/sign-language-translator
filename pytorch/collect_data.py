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

SIGNS = ["hello"]

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

    seq = deque(maxlen=20)   # 20 frames per sample
    samples = []

    while len(samples) < 40:   # 40 sequences per sign
        ret, frame = cap.read()
        if not ret:
            continue

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # ----- CREATE MEDIAPIPE IMAGE -----
        mp_image = Image(
            image_format=ImageFormat.SRGB,
            data=rgb
        )

        result = landmarker.detect(mp_image)

        vec = landmarks_to_vector(result)
        seq.append(vec)

        # When we have 20 frames → save 1 sample
        if len(seq) == 20:
            samples.append(np.array(seq))

        cv2.putText(
            frame,
            f"{sign}: {len(samples)}/40",
            (10,40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0,255,0),
            2
        )

        cv2.imshow("collect", frame)

        # ESC to cancel sign
        if cv2.waitKey(1) == 27:
            break

    # ----- SAVE -----

    """np.save(f"dataset/{sign}.npy", np.array(samples))
    print(f"✅ Saved dataset/{sign}.npy  shape:",
          np.array(samples).shape)"""
    # create folder per sign
    os.makedirs(f"dataset/{sign}", exist_ok=True)

    # count existing recordings
    count = len(glob.glob(f"dataset/{sign}/*.npy"))

    save_path = f"dataset/{sign}/{sign}_{count}.npy"

    np.save(save_path, np.array(samples))

    print(f"✅ Saved {save_path}  shape:",
        np.array(samples).shape)


cap.release()
cv2.destroyAllWindows()
