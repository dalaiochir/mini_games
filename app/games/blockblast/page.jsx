"use client";
import React, { useEffect, useState } from "react";
import GameBoard from "./components/GameBoard";
import PiecesArea from "./components/PiecesArea";
import {
  generatePieces,
  createEmptyBoard,
  hasAnyValidMove,
} from "./utils/gameLogic";
import "./styles.css";

export default function BlockBlastPage() {
  const SIZE = 9;
  const [board, setBoard] = useState(() => createEmptyBoard(SIZE));
  const [pieces, setPieces] = useState(() => generatePieces(3));
  const [score, setScore] = useState(0);

  const [highScore, setHighScore] = useState(0);
  const [highName, setHighName] = useState("");

  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bb_high") || "{}");
      if (saved.score) {
        setHighScore(saved.score);
        setHighName(saved.name || "");
      }
    } catch (e) {}
  }, []);

  // when pieces all used, auto generate new 3
  function consumePieceById(id) {
    const newPieces = pieces.map((p) => (p && p.id === id ? null : p));
    if (newPieces.every((p) => p === null)) {
      setPieces(generatePieces(3));
    } else {
      setPieces(newPieces);
    }
  }

  // handle place result from GameBoard
  // result = { ok, newBoard, placedCount, clearedCounts: {rows,cols,squares}, usedPieceId, gainedScore }
  function handlePlaceResult(result) {
    if (!result || !result.ok) return;
    setBoard(result.newBoard);
    setScore((s) => s + result.gainedScore);

    // mark piece used (will auto-generate when all used)
    consumePieceById(result.usedPieceId);

    // After placing, check if any move remains; if not -> game over
    setTimeout(() => {
      const any = hasAnyValidMove(result.newBoard, pieces, SIZE);
      if (!any) {
        // game over
        setGameOver(true);
        // save high score if broken
        setTimeout(() => {
          if (result && result.gainedScore + score > highScore) {
            const name = prompt("New High Score! Enter your name:") || "Player";
            const total = result.gainedScore + score;
            localStorage.setItem("bb_high", JSON.stringify({ score: total, name }));
            setHighScore(total);
            setHighName(name);
          }
        }, 50);
      } else {
        // recalc because consumePieceById updated pieces; need to check again with newest pieces
        // nothing else needed
      }
    }, 200); // let clears finish visually
  }

  function restart() {
    setBoard(createEmptyBoard(SIZE));
    setPieces(generatePieces(3));
    setScore(0);
    setGameOver(false);
  }

  return (
    <div className="bb-root">
      <header className="bb-header">
        <h1>Block Blast (9×9)</h1>
        <div className="bb-info">
          <div>Score: <strong>{score}</strong></div>
          <div>High: <strong>{highScore}</strong>{highName ? ` — ${highName}` : ""}</div>
          <div className="bb-controls">
            <button onClick={restart}>Restart</button>
          </div>
        </div>
      </header>

      <main className="bb-main">
        <GameBoard
          board={board}
          setBoard={setBoard}
          onPlaceResult={handlePlaceResult}
          pieces={pieces}
          setScore={setScore}
        />

        <PiecesArea pieces={pieces} />
      </main>

      {gameOver && (
        <div className="bb-gameover">
          <div className="bb-gameover-card">
            <h2>Game Over</h2>
            <p>Your score: {score}</p>
            <button onClick={restart}>Play Again</button>
          </div>
        </div>
      )}

      <footer className="bb-footer">No canvas — DOM grid only 🎯</footer>
    </div>
  );
}
