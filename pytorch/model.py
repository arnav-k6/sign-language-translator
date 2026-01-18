import torch
import torch.nn as nn

class SignModel(nn.Module):
    def __init__(self, num_classes=8):
        super().__init__()

        self.lstm = nn.LSTM(
            input_size=126,
            hidden_size=128,
            num_layers=2,
            batch_first=True
        )

        self.fc = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, num_classes)
        )

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        return self.fc(out)
