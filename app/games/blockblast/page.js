"use client";
import React, { useEffect, useState } from "react";
import GameBoard from "./components/GameBoard";
import PiecesArea from "./components/PiecesArea";
import { SHAPES, createEmptyBoard, randomPieces } from "./utils";
import "./styles.css";


export default function Page() {
const BOARD_SIZE = 9;
const EMPTY = 0;


const [board, setBoard] = useState(() => createEmptyBoard(BOARD_SIZE));
const [pieces, setPieces] = useState(() => randomPieces(SHAPES, 3));
const [score, setScore] = useState(0);
const [placingAnim, setPlacingAnim] = useState({});
const [clearingAnim, setClearingAnim] = useState({});


// High score + player name (localStorage)
const [playerName, setPlayerName] = useState("");
const [savedName, setSavedName] = useState("");
const [highScore, setHighScore] = useState(0);

useEffect(() => {
// load high score
try {
const hs = localStorage.getItem("bb_highscore");
const pn = localStorage.getItem("bb_playername");
if (hs) setHighScore(Number(hs));
if (pn) setSavedName(pn);
} catch (e) {}
}, []);


useEffect(() => {
// if we beat highscore, save it and name
try {
if (score > highScore) {
setHighScore(score);
localStorage.setItem("bb_highscore", String(score));
if (playerName.trim().length > 0) {
localStorage.setItem("bb_playername", playerName.trim());
setSavedName(playerName.trim());
}
}
} catch (e) {}
}, [score]);

function resetGame() {
setBoard(createEmptyBoard(BOARD_SIZE));
setPieces(randomPieces(SHAPES, 3));
setScore(0);
}


// helpers forwarded to components
function updateBoard(newBoard) {
setBoard(newBoard);
}


function usePieceAt(index) {
const newPieces = [...pieces];
newPieces[index] = null;
if (newPieces.every((p) => p === null)) {
setPieces(randomPieces(SHAPES, 3));
} else setPieces(newPieces);
}

return (
<div className="bb-root">
<header className="bb-header">
<h1>Block Blast (9×9)</h1>
<div className="bb-top">
<div className="score">Score: <strong>{score}</strong></div>
<div className="high">High: <strong>{highScore}</strong>{savedName ? ` — ${savedName}` : ""}</div>
<div className="controls">
<input
className="name-input"
placeholder="Your name"
value={playerName}
onChange={(e) => setPlayerName(e.target.value)}
/>
<button onClick={resetGame}>Restart</button>
</div>
</div>
</header>

<main className="bb-main">
<GameBoard
board={board}
setBoard={updateBoard}
setScore={setScore}
score={score}
BOARD_SIZE={BOARD_SIZE}
EMPTY={EMPTY}
placingAnim={placingAnim}
setPlacingAnim={setPlacingAnim}
clearingAnim={clearingAnim}
setClearingAnim={setClearingAnim}
pieces={pieces}
usePieceAt={usePieceAt}
/>


<PiecesArea
pieces={pieces}
setPieces={setPieces}
board={board}
setBoard={updateBoard}
setScore={setScore}
usePieceAt={usePieceAt}
/>
</main>


<footer className="bb-footer">Made with ♥ — Block Blast</footer>
</div>
);
}