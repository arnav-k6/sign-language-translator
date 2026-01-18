import torch.nn as nn

class GestureNet(nn.Module):

    def __init__(self, num_classes=5):
        super().__init__()

        self.net = nn.Sequential(
            nn.Linear(25200, 512),
            nn.ReLU(),
            nn.Dropout(0.3),

            nn.Linear(512, 128),
            nn.ReLU(),

            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        return self.net(x)
