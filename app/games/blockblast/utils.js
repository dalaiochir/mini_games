export const SHAPES = [
[[1]],
[[1,1]],
[[1],[1]],
[[1,1,1]],
[[1],[1],[1]],
[[1,1],[1,1]],
[[1,1,1],[0,1,0]],
[[1,0],[1,0],[1,1]],
[[0,1],[0,1],[1,1]],
[[1,1,0],[0,1,1]],
[[0,1,1],[1,1,0]],
[[1,0,1],[1,1,1]]
];


export function createEmptyBoard(size = 9) {
return Array.from({ length: size }, () => Array(size).fill(0));
}


export function randomPieces(shapes = SHAPES, count = 3) {
const out = [];
for (let i = 0; i < count; i++) {
out.push(shapes[Math.floor(Math.random() * shapes.length)].map(row => [...row]));
}
return out;
}


export function canPlaceShape(board, shape, row, col, BOARD_SIZE, EMPTY) {
for (let r = 0; r < shape.length; r++) {
for (let c = 0; c < shape[0].length; c++) {
if (shape[r][c] === 1) {
const rr = row + r, cc = col + c;
if (rr < 0 || cc < 0 || rr >= BOARD_SIZE || cc >= BOARD_SIZE) return false;
if (board[rr][cc] !== EMPTY) return false;
}
}
}
return true;
}

// returns {coords: ["r-c"], rows: n, cols: n, squares: n}
export function getClearCoords(board) {
const n = board.length;
const coordsSet = new Set();
const rows = [];
const cols = [];
const squares = [];


// rows
for (let r = 0; r < n; r++) {
if (board[r].every((cell) => cell === 1)) rows.push(r);
}
rows.forEach((r) => { for (let c = 0; c < n; c++) coordsSet.add(`${r}-${c}`); });


// cols
for (let c = 0; c < n; c++) {
let full = true;
for (let r = 0; r < n; r++) if (board[r][c] !== 1) full = false;
if (full) cols.push(c);
}
cols.forEach((c) => { for (let r = 0; r < n; r++) coordsSet.add(`${r}-${c}`); });

// 3x3 squares top-left 0..n-3
for (let r = 0; r <= n - 3; r++) {
for (let c = 0; c <= n - 3; c++) {
let full = true;
for (let rr = 0; rr < 3; rr++) for (let cc = 0; cc < 3; cc++) if (board[r+rr][c+cc] !== 1) full = false;
if (full) squares.push([r,c]);
}
}
squares.forEach(([r,c]) => { for (let rr = 0; rr < 3; rr++) for (let cc = 0; cc < 3; cc++) coordsSet.add(`${r+rr}-${c+cc}`); });


return { coords: Array.from(coordsSet), rows: rows.length, cols: cols.length, squares: squares.length };
}