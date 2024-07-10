# Script that converts a PyTorch model to ONNX format

import pickle
import jsonpickle

import torch
import torch.onnx
import torch.nn as nn


class ChessModel(nn.Module):
    def __init__(self, num_classes):
        super(ChessModel, self).__init__()
        # conv1 -> relu -> conv2 -> relu -> flatten -> fc1 -> relu -> fc2
        self.conv1 = nn.Conv2d(13, 64, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(8 * 8 * 128, 256)
        self.fc2 = nn.Linear(256, num_classes)
        self.relu = nn.ReLU()

        # Initialize weights
        nn.init.kaiming_uniform_(self.conv1.weight, nonlinearity='relu')
        nn.init.kaiming_uniform_(self.conv2.weight, nonlinearity='relu')
        nn.init.xavier_uniform_(self.fc1.weight)
        nn.init.xavier_uniform_(self.fc2.weight)

    def forward(self, x):
        x = self.relu(self.conv1(x))
        x = self.relu(self.conv2(x))
        x = self.flatten(x)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)  # Output raw logits
        return x

    
move_to_int_path = input("Enter the path to the move_to_int dictionary (../models/heavy_move_to_int): ")
model_path = input("Enter the path to the model (../models/TORCH_100EPOCHS.pth): ")
onnx_path = input("Enter the path to save the ONNX model (../models/TORCH_100EPOCHS.onnx): ")

if move_to_int_path == "":
    move_to_int_path = "../models/heavy_move_to_int"
if model_path == "":
    model_path = "../models/TORCH_100EPOCHS.pth"
if onnx_path == "":
    onnx_path = "../models/TORCH_100EPOCHS.onnx"

# Load the move_to_int dictionary
with open(move_to_int_path, 'rb') as f:
    move_to_int = pickle.load(f)

# Save moves to jsonpickle
with open(move_to_int_path + ".json", 'w') as f:
    f.write(jsonpickle.encode(move_to_int))

# Load the model
model = ChessModel(num_classes=len(move_to_int))
state_dict = torch.load(model_path, map_location=torch.device('cpu'))
model.load_state_dict(state_dict)
model.eval()

# Export the model to ONNX
torch.onnx.export(model, torch.randn(13, 8, 8, dtype=torch.float32).unsqueeze(0), onnx_path)
