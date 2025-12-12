"use client";
import React, { useRef, useState } from "react";
import {
  canPlaceShape,
  applyPieceToBoard,
  findClearsAndClearWithAnimation,
  getColorForPiece,
  hasAnyValidMove,
} from "../utils/gameLogic";

/**
 * Props:
 * - board (2D array)
 * - setBoard(newBoard)
 * - onPlaceResult(result)   // receives result object when a piece placed
 * - pieces (array of piece or null)
 */
export default function GameBoard({ board, setBoard, onPlaceResult, pieces }) {
  const SIZE = board.length;
  const boardRef = useRef(null);
  const [placingMap, setPlacingMap] = useState({}); // "r-c": true for placing anim
  const [clearingMap, setClearingMap] = useState({}); // "r-c": true for clearing anim

  // dragstart handled in Piece component with dataTransfer 'piece' JSON (includes id, cells, w, h, color)
  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      return;
    }
    const { piece, offsetX = 0, offsetY = 0 } = parsed;
    const rect = boardRef.current.getBoundingClientRect();
    // compute grid position (top-left) adjusted by offset
    const cellSize = rect.width / SIZE;
    const dropX = Math.floor((e.clientX - rect.left) / cellSize) - offsetX;
    const dropY = Math.floor((e.clientY - rect.top) / cellSize) - offsetY;

    attemptPlace(piece, dropX, dropY);
  }

  // mobile tap fallback: if window.__bb_selected exists (piece id index), use that
  function handleCellClick(r, c) {
    const sel = typeof window !== "undefined" ? window.__bb_selected : null;
    if (sel === null || sel === undefined) return;
    // piece object stored on window.__bb_selected_piece
    const piece = window.__bb_selected_piece;
    const selId = window.__bb_selected;
    if (!piece || piece.id !== selId) return;
    // try align by clicked cell as top-left then try snapping to filled cell inside piece
    if (!attemptPlace(piece, c, r)) {
      let placed = false;
      for (let pr = 0; pr < piece.h && !placed; pr++) {
        for (let pc = 0; pc < piece.w && !placed; pc++) {
          // find if piece has filled at (pc,pr)
          if (piece.cells.some(([x,y]) => x === pc && y === pr)) {
            const tryX = c - pc;
            const tryY = r - pr;
            if (attemptPlace(piece, tryX, tryY)) placed = true;
          }
        }
      }
      if (!placed) {
        // small beep via simple oscillator
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          g.gain.value = 0.02; o.frequency.value = 220; o.start();
          setTimeout(()=>{ o.stop(); ctx.close(); }, 80);
        } catch(e){}
      }
    }
    // clear selection
    window.__bb_selected = null;
    window.__bb_selected_piece = null;
    document.body.style.cursor = "";
  }

  function attemptPlace(piece, x, y) {
    // test can place
    if (!canPlaceShape(board, piece, x, y)) return false;

    // mark placing cells for small pop animation
    const placingKeys = piece.cells.map(([px, py]) => `${y + py}-${x + px}`);
    const pm = { ...placingMap };
    placingKeys.forEach((k) => (pm[k] = true));
    setPlacingMap(pm);

    // small delay to show placing animation then actually apply
    setTimeout(() => {
      // apply to board with color (piece.color)
      const newBoard = applyPieceToBoard(board, piece, x, y);
      setBoard(newBoard);

      // remove placing flags
      const cleanedPm = { ...pm };
      placingKeys.forEach((k) => delete cleanedPm[k]);
      setPlacingMap(cleanedPm);

      // find clears (rows and cols ONLY as requested), mark clearing anim
      const { boardAfterClear, clearCoords, counts } = findClearsAndClearWithAnimation(newBoard);

      if (clearCoords.length > 0) {
        // mark clearing cells for animation
        const cm = { ...clearingMap };
        clearCoords.forEach((k) => (cm[k] = true));
        setClearingMap(cm);

        // play simple sound
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine"; o.frequency.value = 440; g.gain.value = 0.03; o.start();
          setTimeout(()=>{ o.stop(); ctx.close(); }, 160);
        } catch(e){}

        setTimeout(() => {
          // commit cleared board
          setBoard(boardAfterClear);
          // cleanup clearing flags
          const cleaned = { ...cm };
          clearCoords.forEach((k) => delete cleaned[k]);
          setClearingMap(cleaned);

          // compute gained score
          const placedCount = piece.cells.length;
          const gained = placedCount + (counts.rows * 10) + (counts.cols * 10);
          // report result to parent
          onPlaceResult({
            ok: true,
            newBoard: boardAfterClear,
            placedCount,
            clearedCounts: counts,
            usedPieceId: piece.id,
            gainedScore: gained,
          });
        }, 380); // match CSS clearing animation
      } else {
        // no clears: just report immediate result
        const placedCount = piece.cells.length;
        const gained = placedCount;
        onPlaceResult({
          ok: true,
          newBoard,
          placedCount,
          clearedCounts: { rows: 0, cols: 0 },
          usedPieceId: piece.id,
          gainedScore: gained,
        });
      }
    }, 140);

    return true;
  }

  return (
    <div className="board-wrap">
      <div
        className="board"
        ref={boardRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${SIZE}, 1fr)`,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;
            const isPlacing = Boolean(placingMap[key]);
            const isClearing = Boolean(clearingMap[key]);
            const cellStyle = cell && cell.color ? { background: cell.color } : {};
            return (
              <div
                key={key}
                className={
                  "cell " +
                  (cell && cell.occupied ? "filled " : "empty ") +
                  (isPlacing ? "placing " : "") +
                  (isClearing ? "clearing " : "")
                }
                style={cellStyle}
                onClick={() => handleCellClick(r, c)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
