"""import numpy as np
import torch
from torch import nn
from model import SignModel

SIGNS = ["hello"] 

#"father","mother","no","me","thankyou","help","what"

X, Y = [], []

for i, s in enumerate(SIGNS):
    data = np.load(f"dataset/{s}.npy")   # shape: (samples, 20, 126)
    X.append(data)
    Y += [i] * len(data)

X = np.concatenate(X, axis=0)   # (N, 20, 126)
Y = np.array(Y)

tensor_x = torch.tensor(X, dtype=torch.float32)
tensor_y = torch.tensor(Y, dtype=torch.long)

model = SignModel()
opt = torch.optim.Adam(model.parameters(), lr=0.001)
loss_fn = nn.CrossEntropyLoss()

# ===== MINI BATCH TRAINING =====
for epoch in range(60):

    perm = torch.randperm(len(tensor_x))

    total = 0

    for i in range(0, len(tensor_x), 8):
        idx = perm[i:i+8]

        batch_x = tensor_x[idx]   # (8, 20, 126)
        batch_y = tensor_y[idx]

        opt.zero_grad()

        pred = model(batch_x)
        loss = loss_fn(pred, batch_y)

        loss.backward()
        opt.step()

        total += loss.item()

    print("epoch", epoch, "loss:", round(total, 4))

torch.save(model.state_dict(), "sign_model.pth")
print("MODEL SAVED")
"""
import numpy as np
import torch
from torch import nn
from model import SignModel
import glob

# ===== CONFIG =====
SIGNS = ["hello", "me", "thankyou", "no", "yes"]   # later you can add more signs here

X, Y = [], []

# ===== LOAD DATA FROM SUBFOLDERS =====
for i, s in enumerate(SIGNS):

    # Load all .npy files inside dataset/hello/
    files = glob.glob(f"dataset/{s}/*.npy")

    if len(files) == 0:
        raise Exception(f"No .npy files found in dataset/{s}/")


    samples = [np.load(f) for f in files]

    data = np.array(samples)   # (samples, 20, 126)

    X.append(data)
    Y += [i] * len(data)

# Combine all classes
X = np.concatenate(X, axis=0)   # (N, 20, 126)
Y = np.array(Y)

print("Training samples:", X.shape)


# ===== TO TENSORS =====
tensor_x = torch.tensor(X, dtype=torch.float32)
tensor_y = torch.tensor(Y, dtype=torch.long)

model = SignModel(len(SIGNS))
opt = torch.optim.Adam(model.parameters(), lr=0.001)
loss_fn = nn.CrossEntropyLoss()

# ===== MINI BATCH TRAINING =====
for epoch in range(60):

    perm = torch.randperm(len(tensor_x))

    total = 0

    for i in range(0, len(tensor_x), 8):
        idx = perm[i:i+8]

        batch_x = tensor_x[idx]   # (8, 20, 126)
        batch_y = tensor_y[idx]

        opt.zero_grad()

        pred = model(batch_x)
        loss = loss_fn(pred, batch_y)

        loss.backward()
        opt.step()

        total += loss.item()

    print("epoch", epoch, "loss:", round(total, 4))

# ===== SAVE MODEL =====
torch.save(model.state_dict(), "sign_model.pth")
print("MODEL SAVED")
