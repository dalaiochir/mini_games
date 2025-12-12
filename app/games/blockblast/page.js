"use client";
import { useEffect, useState } from "react";
import "./styles.css";

export default function BlockBlast() {
  const BOARD_SIZE = 10;
  const EMPTY = 0;

  const shapes = [
    [[1, 1]], // 2-block
    [[1], [1]], // vertical 2-block
    [[1, 1, 1]], // 3 horizontal
    [[1], [1], [1]], // 3 vertical
    [[1, 1], [1, 1]], // square
    [[1, 1, 1], [0, 1, 0]], // T shape
    [[1, 0], [1, 1]], // L
    [[0, 1], [1, 1]], // reverse L
  ];

  const [board, setBoard] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    resetGame();
  }, []);

  function resetGame() {
    setBoard(Array(BOARD_SIZE).fill(null).map(() =>
      Array(BOARD_SIZE).fill(EMPTY)
    ));
    generatePieces();
    setScore(0);
  }

  function generatePieces() {
    let newPieces = [];
    for (let i = 0; i < 3; i++) {
      let s = shapes[Math.floor(Math.random() * shapes.length)];
      newPieces.push(s);
    }
    setPieces(newPieces);
  }

  function canPlace(boardCopy, shape, row, col) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c] === 1) {
          if (
            row + r >= BOARD_SIZE ||
            col + c >= BOARD_SIZE ||
            boardCopy[row + r][col + c] !== EMPTY
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  function placePiece(shape, row, col, index) {
    let newBoard = board.map((r) => [...r]);

    if (!canPlace(newBoard, shape, row, col)) return;

    // Place blocks
    shape.forEach((r, i) =>
      r.forEach((val, j) => {
        if (val === 1) newBoard[row + i][col + j] = 1;
      })
    );

    let cleared = clearLines(newBoard);

    setBoard(newBoard);
    setScore(score + shape.flat().filter((x) => x === 1).length + cleared * 10);

    let newPieces = [...pieces];
    newPieces[index] = null;

    if (newPieces.every((p) => p === null)) {
      generatePieces();
    } else {
      setPieces(newPieces);
    }

    if (!hasAnyMoves(newBoard, newPieces)) {
      alert("Game Over!");
      resetGame();
    }
  }

  function clearLines(boardCopy) {
    let cleared = 0;

    // Clear rows
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (boardCopy[r].every((cell) => cell === 1)) {
        cleared++;
        boardCopy[r] = Array(BOARD_SIZE).fill(EMPTY);
      }
    }

    // Clear columns
    for (let c = 0; c < BOARD_SIZE; c++) {
      let colFull = true;
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (boardCopy[r][c] === EMPTY) colFull = false;
      }
      if (colFull) {
        cleared++;
        for (let r = 0; r < BOARD_SIZE; r++) boardCopy[r][c] = EMPTY;
      }
    }

    return cleared;
  }

  function hasAnyMoves(boardCopy, piecesList) {
    for (let p of piecesList) {
      if (!p) continue;
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (canPlace(boardCopy, p, r, c)) return true;
        }
      }
    }
    return false;
  }

  return (
    <div className="bb-container">
      <h1>Block Blast</h1>
      <h3>Score: {score}</h3>

      {/* Game board */}
      <div className="board">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div key={r + "-" + c} className={cell === 1 ? "filled" : "empty"} />
          ))
        )}
      </div>

      {/* Pieces */}
      <h2>Pieces</h2>
      <div className="pieces-container">
        {pieces.map((shape, index) =>
          shape ? (
            <div
              key={index}
              className="piece"
              onClick={() => {
                window.selectedPiece = { shape, index };
                alert("Now click on board to place the piece.");
              }}
            >
              {shape.map((r, i) =>
                r.map((v, j) => (
                  <div
                    key={i + "-" + j}
                    className={v === 1 ? "p-filled" : "p-empty"}
                  />
                ))
              )}
            </div>
          ) : (
            <div key={index} className="piece empty-piece">Used</div>
          )
        )}
      </div>

      {/* Board click placement */}
      <div
        className="click-overlay"
        onClick={(e) => {
          if (!window.selectedPiece) return;

          const rect = e.target.getBoundingClientRect();
          const x = Math.floor((e.clientX - rect.left) / 40);
          const y = Math.floor((e.clientY - rect.top) / 40);

          placePiece(
            window.selectedPiece.shape,
            y,
            x,
            window.selectedPiece.index
          );

          window.selectedPiece = null;
        }}
      />

    </div>
  );
}
