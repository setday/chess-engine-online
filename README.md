# chess-engine-online

Web implementation of this [chess engine](https://github.com/Skripkon/chess-engine)

This project uses ONNX model instead of PyTorch model to make possible running the engine on the web. Although the model operates on the CPU since utilizeing CUDA cores for acceleration on the web is not feasible the performance remains sufficiently high to ensure an enjoyable gaming experience.

You can try this game [here](https://setday.github.io/chess-engine-online/)

## Setup:

To run this project you should make this steps:

1. Clone this repository
2. Add your models (`.pth` files of PyTorch models) to the `models` folder
3. Install all requirements with `pip install -r requirements.txt` in utils folder
4. Run the script `python convertTrch2Onnx.py` to convert the models to `.onnx` format

## Running the project:

1. Install all dependencies with `npm install`
2. Run the project with `npm start`
3. You are ready to go! Use `AutoPlay` button to make engine play for you and `flip board` button to change the board orientation. At the end of the game you can copy pgn of your game to then analyze it.
