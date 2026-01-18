import torch
from model import GestureNet

model = GestureNet(num_classes=5)
model.load_state_dict(torch.load("gesture_model.pt"))
model.eval()

def predict_gesture(flattened):

    x = torch.tensor(flattened).float().unsqueeze(0)

    with torch.no_grad():
        out = model(x)

    return out.argmax().item()
