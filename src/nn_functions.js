// import * as ort from 'onnxruntime-web';

import movesToInts from '../models/heavy_move_to_int.json';

export async function loadModel(path) {
    const session = new onnx.InferenceSession();
    await session.loadModel(path);
    return session;
}

function str2Pos(str) {
    return [str[1] - 1, str.charCodeAt(0) - 97];
}

function board2Matrix(board, legalMoves) {
    let matrix = new Array(13).fill([]).map(() =>
        new Array(8).fill([]).map(() =>
            new Array(8).fill(0.0)
        )
    );

    for (const row of board) {
        for (const cell of row) {
            if (cell === null) {
                continue;
            }

            const { type, color, square } = cell;
            const [row, col] = str2Pos(square);
            const piece_type = ['p', 'n', 'b', 'r', 'q', 'k'].indexOf(type);
            const piece_color = ['w', 'b'].indexOf(color) * 6;
    
            matrix[piece_type + piece_color][row][col] = 1.0;    
        }
    }

    for (const move of legalMoves) {
        const { to } = move;
        const [row, col] = str2Pos(to);
        matrix[12][row][col] = 1.0;
    }

    return matrix;
}

let indexes_to_move = null;

function initializeIndexesToMove() {
    indexes_to_move = {};

    for (const move in movesToInts) {
        indexes_to_move[movesToInts[move]] = move;
    }
}

export async function predictMoves(game, model) {
    const board = game.board();
    const legalMoves = game.moves({ verbose: true });
    const matrix = board2Matrix(board, legalMoves);
    const tensor = new onnx.Tensor(matrix.flat(2), 'float32', [1, 13, 8, 8]);

    // Make the prediction
    const prediction = await model.run([tensor]);
    
    // Unpack the propabilities of the moves
    const moveProps = prediction.values().next().value.data;
    const movePropsD = Array.from(moveProps);
    
    // Apply softmax to the propabilities
    const softmax = movePropsD.map((x) => Math.exp(x));
    const sum = softmax.reduce((a, b) => a + b, 0);
    const softmaxed = softmax.map((x) => x / sum);

    if (!indexes_to_move) {
        initializeIndexesToMove();
    }

    // Sort the indexes of the moves by the propabilities
    const sortedMoves = softmaxed
        .map((x, i) => [x, i])
        .sort((a, b) => b[0] - a[0])
        .map((x) => indexes_to_move[x[1]]);

    return sortedMoves;
}
