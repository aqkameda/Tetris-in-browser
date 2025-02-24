'use strict';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 300;
canvas.height = 600; ``

const ROWS = 20;        // Число строк игрового поля
const COLS = 10;        // Число столбцов игрового поля
const BLOCK_SIZE = canvas.width / COLS; // Размер одного блока, рассчитывается исходя из ширины канваса

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
// let nextPiece = getRandomTetromino(); // Следующая фигура, которую увидит игрок в предпросмотре

let score = 0;
let level = 1;
let clearedLines = 0;
const linesPerLevel = 5; // Сколько линий нужно очистить для повышения уровня
let gameSpeed = 500;     // Интервал (в мс) между автоматическим падениями фигур
let lastTime = 0;
let dropCounter = 0;
const dropInterval = gameSpeed; // gameSpeed в мс, например, 500



function getRandomTetromino() {
    const keys = Object.keys(tetrominoes);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { matrix: tetrominoes[key].shape, color: tetrominoes[key].color };
}

function resetPlayer() {
    player = getRandomTetromino();
    player.position = { x: Math.floor(COLS / 2) - 1, y: 0 };

    // let nextPiece = getRandomTetromino();
    // drawPreview(); // Обновляем предпросмотр следующей фигуры

    // Если фигура появляется и сразу сталкивается с заполненной областью – игра заканчивается
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
                // Если значение -1, значит это мигающий блок при очистке строки
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
    // Рисуем арену (статичные фигуры)
    drawMatrix(arena, { x: 0, y: 0 }, "gray");
    // Рисуем текущую фигуру игрока
    drawMatrix(player.matrix, player.position, player.color);
    // Обновляем интерфейс
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
        player.position.y--; // Возвращаем на шаг назад, если столкновение обнаружено
        merge(arena, player);
        clearLines();  // После слияния пытаемся удалить заполненные линии
        resetPlayer(); // Сбрасываем фигуру
    }
}

function clearLines() {
    let linesToRemove = [];

    // Ищем полные линии (каждая ячейка не равна 0)
    for (let y = arena.length - 1; y >= 0; y--) {
        if (arena[y].every(cell => cell !== 0)) {
            linesToRemove.push(y);
        }
    }

    // if (linesToRemove.length > 0) {
    //     playSound("clear"); // Воспроизводим звук очистки
    //     // Для визуального эффекта: меняем цвет строки (например, на белый)
    //     linesToRemove.forEach(y => {
    //         arena[y] = arena[y].map(() => -1);
    //     });

    // Через небольшую задержку удаляем строки
    setTimeout(() => {
        linesToRemove.forEach(y => {
            arena.splice(y, 1);
            arena.unshift(Array(COLS).fill(0));
        });
        // Обновляем очки
        score += [0, 40, 100, 300, 1200][linesToRemove.length] * level;
        clearedLines += linesToRemove.length;
        updateLevel();
    }, 200);
}


function updateLevel() {
    if (clearedLines >= linesPerLevel) {
        level++;
        clearedLines = 0;
        gameSpeed *= 0.9; // С каждым уровнем фигуры падают быстрее (уменьшение интервала)
    }
}

function rotate(matrix) {
    // Поворот на 90° по часовой стрелке: транспонирование и разворот строк
    return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function playerRotate() {
    const rotated = rotate(player.matrix);
    if (!collides(arena, { position: player.position, matrix: rotated })) {
        player.matrix = rotated;
        // playSound("rotate");
    }
}

function hardDrop() {
    while (!collides(arena, player)) {
        player.position.y++;
    }
    player.position.y--; // Откатываем последний шаг, где произошло столкновение
    merge(arena, player);
    clearLines();
    resetPlayer();
    // playSound("drop");
}

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
        player.position.x--;
        // playSound("move");
    }
    if (event.key === "ArrowRight") {
        player.position.x++;
        // playSound("move");
    }
    if (event.key === "ArrowDown") {
        moveDown();
        // playSound("drop");
    }
    if (event.key === "ArrowUp") {
        playerRotate();
    }
    if (event.code === "Space") {
        hardDrop();
    }
});

// const previewCanvas = document.getElementById("previewCanvas");
// const previewCtx = previewCanvas.getContext("2d");
// previewCtx.scale(20, 20); // Масштабируем, чтобы фигура отображалась в миниатюре

// function drawPreview() {
//     previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
//     drawMatrix(nextPiece.matrix, { x: 1, y: 1 }, nextPiece.color, previewCtx);
// }

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


