import torch
import torch.nn as nn
import numpy as np
import glob
import os

class TwoHandNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(126, 256),
            nn.ReLU(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 26)
        )

    def forward(self, x):
        return self.net(x)

X = []
y = []

for i, letter in enumerate("ABCDEFGHIJKLMNOPQRSTUVWXYZ"):
    files = glob.glob(f"dataset/{letter}/*.csv")

    for f in files:
        data = np.loadtxt(f, delimiter=',')
        mean_frame = data.reshape(-1,126).mean(axis=0)

        X.append(mean_frame)
        y.append(i)

X = torch.tensor(X, dtype=torch.float32)
y = torch.tensor(y)

model = TwoHandNet()
opt = torch.optim.Adam(model.parameters(), lr=0.001)
loss_fn = nn.CrossEntropyLoss()

for epoch in range(200):
    out = model(X)
    loss = loss_fn(out, y)

    opt.zero_grad()
    loss.backward()
    opt.step()

    if epoch % 20 == 0:
        print("loss:", loss.item())

torch.save(model.state_dict(), "two_hand_asl.pth")
print("✅ MODEL SAVED")
