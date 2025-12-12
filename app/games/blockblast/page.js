"use client";
import { useEffect, useState, useRef } from "react";
import "./styles.css";

/**
 * Block Blast (9x9, row/col/3x3 clear)
 * - Board: 9x9
 * - Clear rules: full row, full column, any full 3x3 block
 * - Drag & Drop + Tap-to-place
 * - Animations + sounds
 */

export default function BlockBlast() {
  const BOARD_SIZE = 9;
  const EMPTY = 0;
  const CELL_SIZE = 40; // px; CSS will scale for smaller screens
  const audioCtxRef = useRef(null);

  // shapes palette (same as before, can add more)
  const SHAPES = [
    [[1]], // single
    [[1, 1]], // 2 horiz
    [[1], [1]], // 2 vert
    [[1, 1, 1]], // 3 horiz
    [[1], [1], [1]], // 3 vert
    [[1, 1, 1, 1]], // 4 horiz
    [[1], [1], [1], [1]], // 4 vert
    [[1, 1], [1, 1]], // square 2x2
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 0], [1, 0], [1, 1]], // L
    [[0, 1], [0, 1], [1, 1]], // reverse L
    [[1, 1, 0], [0, 1, 1]], // Z
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 0, 1], [1, 1, 1]], // plus-ish
  ];

  const [board, setBoard] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [score, setScore] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [placingAnimCells, setPlacingAnimCells] = useState({});
  const [clearingCells, setClearingCells] = useState({});

  useEffect(() => {
    resetGame();
    audioCtxRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ensureAudioContext() {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  }

  function playBeep(freq = 440, duration = 0.08, type = "sine", gain = 0.05) {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    setTimeout(() => {
      try { o.stop(); } catch (e) {}
    }, duration * 1000);
  }
  function playPlaceSound() { playBeep(880, 0.06, "triangle", 0.06); }
  function playClearSound() { playBeep(440, 0.12, "sine", 0.09); setTimeout(()=>playBeep(660,0.05,"sine",0.05),80); }
  function playGameOverSound() { playBeep(160, 0.2, "sawtooth", 0.12); }

  function resetGame() {
    setBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY)));
    generatePieces();
    setScore(0);
  }

  function generatePieces() {
    const newPieces = [];
    for (let i = 0; i < 3; i++) {
      const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      newPieces.push(s);
    }
    setPieces(newPieces);
  }

  function canPlace(boardCopy, shape, row, col) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c] === 1) {
          const rr = row + r, cc = col + c;
          if (rr < 0 || cc < 0 || rr >= BOARD_SIZE || cc >= BOARD_SIZE) return false;
          if (boardCopy[rr][cc] !== EMPTY) return false;
        }
      }
    }
    return true;
  }

  // Place piece with animations and then perform clears (rows/cols/3x3)
  function placePiece(shape, row, col, pieceIndex) {
    if (!shape) return false;
    const boardCopy = board.map((r) => [...r]);
    if (!canPlace(boardCopy, shape, row, col)) return false;

    // mark placing cells
    const placingKeys = [];
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c] === 1) placingKeys.push(`${row + r}-${col + c}`);
      }
    }
    const newPlacing = { ...placingAnimCells };
    placingKeys.forEach((k) => (newPlacing[k] = true));
    setPlacingAnimCells(newPlacing);
    playPlaceSound();

    setTimeout(() => {
      // actually put tiles
      const b2 = boardCopy.map((r) => [...r]);
      placingKeys.forEach((k) => {
        const [rr, cc] = k.split("-").map(Number);
        b2[rr][cc] = 1;
      });
      setBoard(b2);

      // remove placing flags
      const cleanedPlacing = { ...placingAnimCells };
      placingKeys.forEach((k) => delete cleanedPlacing[k]);
      setPlacingAnimCells(cleanedPlacing);

      // perform clears (rows, cols, 3x3 blocks)
      const clears = performClearWithAnimation(b2);

      // scoring: base = number placed; + 10 per row/col cleared; + 15 per 3x3 cleared
      const placedCount = placingKeys.length;
      const gained = placedCount + clears.rows * 10 + clears.cols * 10 + clears.squares * 15;
      // combo bonus: if multiple clear types happen at once, small multiplier
      const combo = Math.max(1, (clears.rows + clears.cols + clears.squares) * 0.2 + 1);
      setScore((s) => s + Math.round(gained * combo));

      // mark piece used
      const newPieces = [...pieces];
      newPieces[pieceIndex] = null;
      if (newPieces.every((p) => p === null)) generatePieces();
      else setPieces(newPieces);

      // gameover check
      if (!hasAnyMoves(b2, newPieces)) {
        playGameOverSound();
        setTimeout(() => { alert("Game Over!"); resetGame(); }, 180);
      }
    }, 140);
    return true;
  }

  // Find and animate clears: returns counts {rows, cols, squares}
  function performClearWithAnimation(boardCopy) {
    const rowsToClear = [];
    const colsToClear = [];
    const squaresToClear = []; // each as top-left [r,c] of 3x3

    // rows
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (boardCopy[r].every((cell) => cell === 1)) rowsToClear.push(r);
    }
    // cols
    for (let c = 0; c < BOARD_SIZE; c++) {
      let full = true;
      for (let r = 0; r < BOARD_SIZE; r++) if (boardCopy[r][c] !== 1) full = false;
      if (full) colsToClear.push(c);
    }
    // all possible 3x3 blocks (top-left from 0..6)
    for (let r = 0; r <= BOARD_SIZE - 3; r++) {
      for (let c = 0; c <= BOARD_SIZE - 3; c++) {
        let full = true;
        for (let rr = 0; rr < 3; rr++) for (let cc = 0; cc < 3; cc++) {
          if (boardCopy[r + rr][c + cc] !== 1) full = false;
        }
        if (full) squaresToClear.push([r, c]);
      }
    }

    // collect clear coords (avoid duplicates)
    const coordsSet = new Set();
    rowsToClear.forEach((r) => { for (let c = 0; c < BOARD_SIZE; c++) coordsSet.add(`${r}-${c}`); });
    colsToClear.forEach((c) => { for (let r = 0; r < BOARD_SIZE; r++) coordsSet.add(`${r}-${c}`); });
    squaresToClear.forEach(([r, c]) => { for (let rr = 0; rr < 3; rr++) for (let cc = 0; cc < 3; cc++) coordsSet.add(`${r + rr}-${c + cc}`); });

    if (coordsSet.size === 0) return { rows: 0, cols: 0, squares: 0 };

    // set clearing flags for animation
    const newClearing = { ...clearingCells };
    coordsSet.forEach((k) => (newClearing[k] = true));
    setClearingCells(newClearing);
    playClearSound();

    setTimeout(() => {
      // perform actual clearing
      const b2 = boardCopy.map((r) => [...r]);
      coordsSet.forEach((k) => {
        const [rr, cc] = k.split("-").map(Number);
        b2[rr][cc] = EMPTY;
      });
      setBoard(b2);
      // cleanup flags
      const cleaned = { ...clearingCells };
      coordsSet.forEach((k) => delete cleaned[k]);
      setClearingCells(cleaned);
    }, 360);

    return { rows: rowsToClear.length, cols: colsToClear.length, squares: squaresToClear.length };
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

  // Drag & Drop handlers
  function handleDragStart(e, pieceIndex) {
    ensureAudioContext();
    setDraggingIndex(pieceIndex);
    e.dataTransfer.setData("text/plain", String(pieceIndex));
    const crt = document.createElement("canvas"); crt.width = 1; crt.height = 1;
    e.dataTransfer.setDragImage(crt, 0, 0);
  }
  function handleDragOverCell(e) { e.preventDefault(); }
  function handleDropOnCell(e, row, col) {
    e.preventDefault();
    const dt = e.dataTransfer.getData("text/plain");
    const idx = dt ? Number(dt) : draggingIndex;
    if (typeof idx !== "number") return;
    const shape = pieces[idx];
    if (!shape) return;

    // Try top-left placement; if fails, try snap by aligning each filled cell to drop cell
    if (placePiece(shape, row, col, idx)) { }
    else {
      let placed = false;
      for (let sr = 0; sr < shape.length && !placed; sr++) {
        for (let sc = 0; sc < shape[0].length && !placed; sc++) {
          if (shape[sr][sc] === 1) {
            const tryRow = row - sr;
            const tryCol = col - sc;
            if (placePiece(shape, tryRow, tryCol, idx)) placed = true;
          }
        }
      }
      if (!placed) playBeep(220, 0.06, "sine", 0.04);
    }
    setDraggingIndex(null);
  }

  // Tap-to-place for mobile
  function handlePieceTap(index) {
    if (!pieces[index]) return;
    if (window.__selectedPieceIndex === index) {
      window.__selectedPieceIndex = null;
      document.body.style.cursor = "";
    } else {
      window.__selectedPieceIndex = index;
      document.body.style.cursor = "crosshair";
      ensureAudioContext();
    }
  }
  function handleCellTap(row, col) {
    const sel = typeof window !== "undefined" ? window.__selectedPieceIndex : null;
    if (sel === null || sel === undefined) return;
    const shape = pieces[sel];
    if (!shape) return;
    if (!placePiece(shape, row, col, sel)) {
      let placed = false;
      for (let sr = 0; sr < shape.length && !placed; sr++) {
        for (let sc = 0; sc < shape[0].length && !placed; sc++) {
          if (shape[sr][sc] === 1) {
            const tryRow = row - sr;
            const tryCol = col - sc;
            if (placePiece(shape, tryRow, tryCol, sel)) placed = true;
          }
        }
      }
      if (!placed) playBeep(220, 0.06, "sine", 0.04);
    }
    window.__selectedPieceIndex = null;
    document.body.style.cursor = "";
  }

  function renderPieceBlocks(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    return (
      <div
        className="piece-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 24px)`,
          gridTemplateRows: `repeat(${rows}, 24px)`,
        }}
      >
        {shape.flatMap((r, ri) =>
          r.map((v, ci) => (
            <div key={`${ri}-${ci}`} className={v === 1 ? "pfilled" : "pempty"} />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="bb-container improved">
      <h1>Block Blast (9×9) — Row / Col / 3×3 Clear</h1>

      <div className="top-row">
        <div className="score">Score: <strong>{score}</strong></div>
        <div className="controls">
          <button onClick={resetGame}>Restart</button>
          <button onClick={() => { setBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY))); setScore(0); generatePieces(); }}>Clear Board</button>
        </div>
      </div>

      <div className="game-area">
        <div
          className="board"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
          }}
        >
          {board.map((rowArr, r) =>
            rowArr.map((cell, c) => {
              const key = `${r}-${c}`;
              const isPlacing = Boolean(placingAnimCells[key]);
              const isClearing = Boolean(clearingCells[key]);
              return (
                <div
                  key={key}
                  className={`cell ${cell === 1 ? "filled" : "empty"} ${isPlacing ? "placing" : ""} ${isClearing ? "clearing" : ""}`}
                  onDragOver={handleDragOverCell}
                  onDrop={(e) => handleDropOnCell(e, r, c)}
                  onClick={() => handleCellTap(r, c)}
                  role="button"
                  aria-label={`cell ${r}-${c}`}
                />
              );
            })
          )}
        </div>

        <div className="pieces-panel">
          <h3>Pieces</h3>
          <div className="pieces-list">
            {pieces.map((shape, idx) =>
              shape ? (
                <div
                  key={idx}
                  className={`piece-box ${draggingIndex === idx ? "dragging" : ""}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onPointerDown={() => ensureAudioContext()}
                  onClick={() => handlePieceTap(idx)}
                >
                  {renderPieceBlocks(shape)}
                </div>
              ) : (
                <div key={idx} className="piece-box used">Used</div>
              )
            )}
          </div>

          <div className="hint">
            <small>Drag to board (desktop). Mobile: tap piece → tap board cell.</small>
          </div>

          <div className="legend" style={{ marginTop: 12 }}>
            <div><span className="dot used-dot" /> placed</div>
            <div><span className="dot placing-dot" /> placing</div>
            <div><span className="dot clearing-dot" /> clearing</div>
          </div>
        </div>
      </div>
    </div>
  );
}
