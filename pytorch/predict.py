import cv2
import numpy as np
import torch
from collections import deque

from mediapipe import Image, ImageFormat
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from model import SignModel


SIGNS = ["hello","father","mother","no",
         "me","thankyou","help","what"]


# ===== MediaPipe =====
options = vision.HandLandmarkerOptions(
    base_options=python.BaseOptions(model_asset_path='hand_landmarker.task'),
    num_hands=2
)

detector = vision.HandLandmarker.create_from_options(options)


# ===== Load YOUR model =====
model = SignModel()
model.load_state_dict(torch.load("sign_model.pth", map_location="cpu"))
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


seq = deque(maxlen=20)

cap = cv2.VideoCapture(0)

print("Press Q to quit")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    mp_image = Image(ImageFormat.SRGB, rgb)

    result = detector.detect(mp_image)

    vec = to_vec(result)
    seq.append(vec)

    text = "..."

    if len(seq) == 20:
        x = torch.tensor(np.array(seq),
                         dtype=torch.float32).unsqueeze(0)

        with torch.no_grad():
            pred = model(x)
            idx = pred.argmax(1).item()

        text = SIGNS[idx]

    cv2.putText(frame, text,
                (40, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.5, (0,255,0), 3)

    cv2.imshow("ASL", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break


cap.release()
cv2.destroyAllWindows()
