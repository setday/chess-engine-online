# chess-engine-online

Web implementation of a this [chess engine](https://github.com/Skripkon/chess-engine)

You can try this game [here](https://setday.github.io/chess-engine-online/)

## Setup:

To run this project you should make this steps:

1. Clone this repository
2. Add your models (`.pth` files of PyTorch models) to the `models` folder
3. Install all requirements with `pip install -r requirements.txt` in utils folder
4. Run the script `python convertTrch2Onnx.py` to convert the models to `.onnx` format (which is essential for running model in the web) 

## Running the project:

1. Install all dependencies with `npm install`
2. Run the project with `npm start`
3. You are ready to go! Use `AutoPlay` button to make engine play for you and `flip board` button to change the board orientation. At the end of the game you can copy pgn of your game to then analyze it.
