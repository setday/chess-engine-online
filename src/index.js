import * as chessJS from 'chess.js';
import * as chessboardJS from 'cm-chessboard';
import * as chessboardJSMarks from 'cm-chessboard/src/extensions/markers/Markers';
import * as chessboardJSPromotion from 'cm-chessboard/src/extensions/promotion-dialog/PromotionDialog';
import * as chessboardJSArrows from 'cm-chessboard/src/extensions/arrows/Arrows';

import * as nn from './nn_functions';

const model = await nn.loadModel("./../models/TORCH_100EPOCHS.onnx");

let autoPlay = false;

var chess = new chessJS.Chess()
const board = new chessboardJS.Chessboard(document.getElementById("board"), {
  position: chess.fen(),
  assetsUrl: "./assets/",
  style: {borderType: chessboardJS.BORDER_TYPE.none, pieces: {file: "pieces/standard.svg"}, animationDuration: 300},
  orientation: chessboardJS.COLOR.white,
  extensions: [
      {class: chessboardJSMarks.Markers, props: {autoMarkers: chessboardJSMarks.MARKER_TYPE.square}},
      {class: chessboardJSPromotion.PromotionDialog},
      {class: chessboardJSArrows.Arrows },
  ]
});

const changeOrientationButton = document.getElementById("flipBoardButton");
changeOrientationButton.addEventListener("click", () => {
  board.setOrientation(board.getOrientation() === chessboardJS.COLOR.white ? chessboardJS.COLOR.black : chessboardJS.COLOR.white);
  setTimeout(_ => {
    flipTurn();
  }, 300);
});

const autoPlayButton = document.getElementById("autoPlayButton");
autoPlayButton.addEventListener("click", () => {
  autoPlay = !autoPlay;
  flipTurn();
});

const overlay = document.getElementById("overlay");
const gameOverText = document.getElementById("gameOverText");
const gameCodeButton = document.getElementById("gameCode");
const restartButton = document.getElementById("restartButton");

restartButton.addEventListener("click", () => {
  chess.reset();
  board.setPosition(chess.fen(), true);
  overlay.classList.toggle("hidden", true);
  flipTurn();
});

gameCodeButton.addEventListener("click", () => {
  navigator.clipboard.writeText(chess.pgn() + " *").then(() => {
    alert("Game code copied to clipboard!");
  });
});

function make_move(move) {
  chess.move(move);
  board.setPosition(chess.fen(), true);

  setTimeout(_ => {
    flipTurn();
  }, 100);
}

async function makeEngineMove(chessboard) {
  const possibleMoves = chess.moves({verbose: true});
  const possibleMovesLan = possibleMoves.map((move) => move.lan);

  if (possibleMoves.length > 0) {
    const prediction = await nn.predictMoves(chess, model);
    const predictionPossible = prediction.filter(move => possibleMovesLan.includes(move));
    if (predictionPossible.length > 0) {
      make_move(predictionPossible[0]);
    } else {
      console.log("Bot can't make move so it will make a random move");
      make_move(possibleMoves[Math.floor(Math.random() * possibleMoves.length)]);
    }
  }
}

function flipTurn() {
  // check if the game is over
  if (chess.isCheckmate()) {
    gameOverText.innerText = chess.turn() === board.getOrientation() ? "You got checkmated!" : "You checkmated the opponent!";
    overlay.classList.toggle("hidden", false);
    return;
  }
  if (chess.isDraw()) {
    chess.loadPgn(chess.pgn() + " 1/2-1/2");
    gameOverText.innerText = "It's a draw!";
    overlay.classList.toggle("hidden", false);
    return;
  }

  if (chess.turn() === board.getOrientation() && !autoPlay) {
    board.enableMoveInput(inputHandler, board.getOrientation());
  } else {
    board.disableMoveInput();
    makeEngineMove(board);
  }
}

function inputHandler(event) {
  if(event.type === chessboardJS.INPUT_EVENT_TYPE.movingOverSquare) {
    return
  }

  if(event.type !== chessboardJS.INPUT_EVENT_TYPE.moveInputFinished) {
    event.chessboard.removeLegalMovesMarkers();
  }
  if (event.type === chessboardJS.INPUT_EVENT_TYPE.moveInputStarted) {
    const moves = chess.moves({square: event.squareFrom, verbose: true});
    event.chessboard.addLegalMovesMarkers(moves);
    return moves.length > 0;
  }
  if (event.type === chessboardJS.INPUT_EVENT_TYPE.moveInputFinished) {
    if(event.legalMove) {
      event.chessboard.disableMoveInput();
    }
    return;
  }

  if (event.type === chessboardJS.INPUT_EVENT_TYPE.validateMoveInput) {
    const move = {from: event.squareFrom, to: event.squareTo, promotion: event.promotion};
    let result = false;

    try {
      result = chess.move(move);

      event.chessboard.state.moveInputProcess.then(() => {
        event.chessboard.setPosition(chess.fen(), true).then(() => {
          flipTurn();
        })
      })
    } catch (e) {
      let possibleMoves = chess.moves({square: event.squareFrom, verbose: true});

      for (const possibleMove of possibleMoves) {
        if (!possibleMove.promotion || possibleMove.to !== event.squareTo) {
          continue;
        }

        event.chessboard.showPromotionDialog(event.squareTo, chessboardJS.COLOR.white, (result) => {
          if (result.type === chessboardJSPromotion.PROMOTION_DIALOG_RESULT_TYPE.pieceSelected) {
            const move = {from: event.squareFrom, to: event.squareTo, promotion: result.piece.charAt(1)};
              
            make_move(move);
          } else {
            event.chessboard.enableMoveInput(inputHandler, event.chessboard.getOrientation());
            event.chessboard.setPosition(chess.fen(), true);
          }
        });

        return true;
      }
    }
    return result;
  }
}

board.enableMoveInput(inputHandler, chessboardJS.COLOR.white);
