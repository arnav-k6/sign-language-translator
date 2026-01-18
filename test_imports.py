import sys
print("1 - Script started", flush=True)

try:
    import cv2
    print("2 - cv2 OK", flush=True)
except Exception as e:
    print(f"2 - cv2 FAILED: {e}", flush=True)
    sys.exit(1)

try:
    import mediapipe
    print("3 - mediapipe OK", flush=True)
except Exception as e:
    print(f"3 - mediapipe FAILED: {e}", flush=True)
    sys.exit(1)

try:
    import torch
    print("4 - torch OK", flush=True)
except Exception as e:
    print(f"4 - torch FAILED: {e}", flush=True)
    sys.exit(1)

try:
    from flask import Flask
    print("5 - flask OK", flush=True)
except Exception as e:
    print(f"5 - flask FAILED: {e}", flush=True)
    sys.exit(1)

try:
    from video_transcriber import transcribe_video_file
    print("6 - video_transcriber OK", flush=True)
except Exception as e:
    print(f"6 - video_transcriber FAILED: {e}", flush=True)
    sys.exit(1)

print("ALL IMPORTS OK!", flush=True)
