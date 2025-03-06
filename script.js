'use strict';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 300;
canvas.height = 600; ``

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = canvas.width / COLS;

let arena = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const tetrominoes = {
    I: { color: "cyan", shape: [[1, 1, 1, 1]] },
    O: { color: "yellow", shape: [[2, 2], [2, 2]] },
    T: { color: "purple", shape: [[0, 3, 0], [3, 3, 3]] },
    S: { color: "green", shape: [[0, 4, 4], [4, 4, 0]] },
    Z: { color: "red", shape: [[5, 5, 0], [0, 5, 5]] },
    J: { color: "blue", shape: [[6, 0, 0], [6, 6, 6]] },
    L: { color: "orange", shape: [[0, 0, 7], [7, 7, 7]] }
};

let player = { position: { x: 4, y: 0 }, matrix: [], color: "" };


let score = 0;
let level = 1;
let clearedLines = 0;
const linesPerLevel = 5;
let gameSpeed = 500;
let lastTime = 0;
let dropCounter = 0;
const dropInterval = gameSpeed;



function getRandomTetromino() {
    const keys = Object.keys(tetrominoes);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { matrix: tetrominoes[key].shape, color: tetrominoes[key].color };
}

function resetPlayer() {
    player = getRandomTetromino();
    player.position = { x: Math.floor(COLS / 2) - 1, y: 0 };





    if (collides(arena, player)) {
        alert("Игра окончена!");
        arena = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        score = 0;
        level = 1;
        clearedLines = 0;
        gameSpeed = 500;
    }
}

function drawMatrix(matrix, offset, color, context = ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {

                context.fillStyle = value === -1 ? "white" : color;
                context.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                context.strokeStyle = "black";
                context.strokeRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 }, "gray");

    drawMatrix(player.matrix, player.position, player.color);

    document.getElementById("score").textContent = score;
    document.getElementById("level").textContent = level;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.position.y][x + player.position.x] = value;
            }
        });
    });
}

function collides(arena, player) {
    return player.matrix.some((row, y) => {
        return row.some((value, x) => {
            return value !== 0 && (arena[y + player.position.y]?.[x + player.position.x] !== 0);
        });
    });
}

function moveDown() {
    player.position.y++;
    if (collides(arena, player)) {
        player.position.y--;
        merge(arena, player);
        clearLines();
        resetPlayer();
    }
}

function clearLines() {
    let linesToRemove = [];


    for (let y = arena.length - 1; y >= 0; y--) {
        if (arena[y].every(cell => cell !== 0)) {
            linesToRemove.push(y);
        }
    }









    setTimeout(() => {
        linesToRemove.forEach(y => {
            arena.splice(y, 1);
            arena.unshift(Array(COLS).fill(0));
        });

        score += [0, 40, 100, 300, 1200][linesToRemove.length] * level;
        clearedLines += linesToRemove.length;
        updateLevel();
    }, 200);
}


function updateLevel() {
    if (clearedLines >= linesPerLevel) {
        level++;
        clearedLines = 0;
        gameSpeed *= 0.9;
    }
}

function rotate(matrix) {

    return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function playerRotate() {
    const rotated = rotate(player.matrix);
    if (!collides(arena, { position: player.position, matrix: rotated })) {
        player.matrix = rotated;

    }
}

function hardDrop() {
    while (!collides(arena, player)) {
        player.position.y++;
    }
    player.position.y--;
    merge(arena, player);
    clearLines();
    resetPlayer();

}

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
        player.position.x--;

    }
    if (event.key === "ArrowRight") {
        player.position.x++;

    }
    if (event.key === "ArrowDown") {
        moveDown();

    }
    if (event.key === "ArrowUp") {
        playerRotate();
    }
    if (event.code === "Space") {
        hardDrop();
    }
});










function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        moveDown();
        dropCounter = 0;
    }

    draw();
    requestAnimationFrame(update);
}


resetPlayer();
requestAnimationFrame(update);


