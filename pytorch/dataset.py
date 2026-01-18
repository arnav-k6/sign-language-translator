import torch
from torch.utils.data import Dataset
import pandas as pd

class GestureDataset(Dataset):

    def __init__(self, csv_file):
        df = pd.read_csv(csv_file)

        # Last column should be label if you save it
        self.labels = torch.tensor(df.iloc[:, -1].values)

        # Everything else = landmarks
        self.data = torch.tensor(df.iloc[:, :-1].values).float()

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return self.data[idx], self.labels[idx]
