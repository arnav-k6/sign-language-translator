import torch
from torch.utils.data import DataLoader
from dataset import GestureDataset
from model import GestureNet

def train():

    dataset = GestureDataset("gestures.csv")
    loader = DataLoader(dataset, batch_size=8, shuffle=True)

    model = GestureNet(num_classes=5)

    loss_fn = torch.nn.CrossEntropyLoss()
    opt = torch.optim.Adam(model.parameters(), lr=0.001)

    for epoch in range(20):

        for x, y in loader:

            pred = model(x)
            loss = loss_fn(pred, y)

            opt.zero_grad()
            loss.backward()
            opt.step()

        print("epoch", epoch, "loss", loss.item())

    torch.save(model.state_dict(), "gesture_model.pt")
