"use client";
import React, { useRef } from "react";
import { canPlaceShape, getClearCoords } from "../utils";


export default function GameBoard({
board,
setBoard,
setScore,
score,
BOARD_SIZE,
EMPTY,
placingAnim,
setPlacingAnim,
clearingAnim,
setClearingAnim,
pieces,
usePieceAt,
}) {
const boardRef = useRef(null);


// sound elements
const placeAudio = typeof window !== "undefined" ? new Audio("/sounds/place.mp3") : null;
const clearAudio = typeof window !== "undefined" ? new Audio("/sounds/clear.mp3") : null;

function handleDrop(e, r, c) {
e.preventDefault();
const dt = e.dataTransfer.getData("text/plain");
const idx = dt ? Number(dt) : null;
if (idx === null || typeof idx !== "number") return;
const shape = pieces[idx];
if (!shape) return;


// Try place at top-left; if fail, attempt align to nearest filled cell
if (tryPlace(shape, r, c, idx)) return;


// try align
for (let sr = 0; sr < shape.length; sr++) {
for (let sc = 0; sc < shape[0].length; sc++) {
if (shape[sr][sc] === 1) {
if (tryPlace(shape, r - sr, c - sc, idx)) return;
}
}
}
// else failure sound
playBeep(220, 0.06);
}

function playBeep(freq = 440, dur = 0.08) {
try {
const a = new AudioContext();
const o = a.createOscillator();
const g = a.createGain();
o.type = "sine";
o.frequency.value = freq;
o.connect(g);
g.connect(a.destination);
g.gain.value = 0.03;
o.start();
g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
setTimeout(() => { o.stop(); a.close(); }, dur * 1000 + 50);
} catch (e) {}
}


function tryPlace(shape, row, col, idx) {
if (!canPlaceShape(board, shape, row, col, BOARD_SIZE, EMPTY)) return false;


// mark placing cells for animation
const placingKeys = [];
for (let rr = 0; rr < shape.length; rr++) {
for (let cc = 0; cc < shape[0].length; cc++) {
if (shape[rr][cc] === 1) placingKeys.push(`${row + rr}-${col + cc}`);
}
}

const placingCopy = { ...placingAnim };
placingKeys.forEach((k) => (placingCopy[k] = true));
setPlacingAnim(placingCopy);


// small delay to let css animate
setTimeout(() => {
const b2 = board.map((r) => [...r]);
placingKeys.forEach((k) => {
const [rr, cc] = k.split("-").map(Number);
b2[rr][cc] = 1;
});
setBoard(b2);
// remove placing flags
const cleaned = { ...placingCopy };
placingKeys.forEach((k) => delete cleaned[k]);
setPlacingAnim(cleaned);


// play place sound
placeAudio?.play();


// find clears (rows/cols/3x3)
const clears = getClearCoords(b2);
if (clears.coords.length > 0) {
// animate clears
const clearCopy = { ...clearingAnim };
clears.coords.forEach((k) => (clearCopy[k] = true));
setClearingAnim(clearCopy);
clearAudio?.play();

setTimeout(() => {
// remove the cleared coords
const b3 = b2.map((r) => [...r]);
clears.coords.forEach((k) => {
const [rr, cc] = k.split("-").map(Number);
b3[rr][cc] = EMPTY;
});
setBoard(b3);
// cleanup
const cleaned2 = { ...clearingAnim };
clears.coords.forEach((k) => delete cleaned2[k]);
setClearingAnim(cleaned2);


// compute score increment
const placedCount = placingKeys.length;
const gained = placedCount + clears.rows * 10 + clears.cols * 10 + clears.squares * 15;
const combo = Math.max(1, (clears.rows + clears.cols + clears.squares) * 0.2 + 1);
setScore((s) => s + Math.round(gained * combo));
}, 350);
} else {
// no clears: add just placed count
setScore((s) => s + placingKeys.length);
}


// mark piece used
usePieceAt(idx);


}, 140);


return true;
}

function handleDragOver(e) {
e.preventDefault();
}


return (
<div className="board-wrap">
<div
className="board"
ref={boardRef}
onDragOver={handleDragOver}
style={{
gridTemplateColumns: `repeat(${BOARD_SIZE}, 40px)`,
gridTemplateRows: `repeat(${BOARD_SIZE}, 40px)`,
}}
>
{board.map((row, r) =>
row.map((cell, c) => {
const key = `${r}-${c}`;
const isPlacing = Boolean(placingAnim[key]);
const isClearing = Boolean(clearingAnim[key]);
return (
<div
key={key}
className={`cell ${cell === 1 ? "filled" : "empty"} ${isPlacing ? "placing" : ""} ${isClearing ? "clearing" : ""}`}
onDrop={(e) => handleDrop(e, r, c)}
onClick={() => {
// mobile tap: if global selected piece exists, emulate drop
const sel = typeof window !== "undefined" ? window.__bb_selected : null;
if (sel !== null && sel !== undefined) {
const shape = pieces[sel];
if (!shape) return;
// try place same as drop
tryPlace(shape, r, c, sel) || playBeep(220, 0.06);
window.__bb_selected = null;
document.body.style.cursor = "";
}
}}

/>
);
})
)}
</div>
</div>
);
}