"use client";
import { useEffect, useState, useRef } from "react";
import "./styles.css";

/**
 * Block Blast - improved:
 * - Drag & Drop (desktop) + Tap-to-place fallback (mobile)
 * - More shapes
 * - Place / Clear animations (fade/slide)
 * - Sound effects via Web Audio API
 */

export default function BlockBlast() {
  const BOARD_SIZE = 10;
  const EMPTY = 0;
  const CELL_SIZE = 40; // css uses 40px grid cells
  const audioCtxRef = useRef(null);

  // Larger palette of shapes (matrices with 1)
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
    [[1, 0], [1, 0], [1, 1]], // L (3x2)
    [[0, 1], [0, 1], [1, 1]], // reverse L
    [[1, 1, 0], [0, 1, 1]], // Z
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 0, 1], [1, 1, 1]], // weird plus-ish
  ];

  const [board, setBoard] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [score, setScore] = useState(0);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [placingAnimCells, setPlacingAnimCells] = useState({}); // { "r-c": true }
  const [clearingCells, setClearingCells] = useState({}); // for clear animation

  useEffect(() => {
    resetGame();
    // init AudioContext lazily on first user interaction
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
      try {
        o.stop();
      } catch (e) {}
    }, duration * 1000);
  }

  function playPlaceSound() {
    playBeep(880, 0.06, "triangle", 0.06);
  }
  function playClearSound() {
    playBeep(440, 0.12, "sine", 0.09);
    setTimeout(() => playBeep(660, 0.05, "sine", 0.05), 80);
  }
  function playGameOverSound() {
    playBeep(160, 0.2, "sawtooth", 0.12);
  }

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

  // Check placement possibility
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

  // Place with animations/sound
  function placePiece(shape, row, col, pieceIndex) {
    if (!shape) return false;
    const boardCopy = board.map((r) => [...r]);
    if (!canPlace(boardCopy, shape, row, col)) return false;

    // Temporary mark placing cells for animation
    const newPlacing = { ...placingAnimCells };
    const toPlaceCoords = [];
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[0].length; c++) {
        if (shape[r][c] === 1) {
          const key = `${row + r}-${col + c}`;
          newPlacing[key] = true;
          toPlaceCoords.push([row + r, col + c]);
        }
      }
    }
    setPlacingAnimCells(newPlacing);
    playPlaceSound();

    // After a short delay, actually fill cells (to allow CSS place animation)
    setTimeout(() => {
      const b2 = boardCopy.map((r) => [...r]);
      toPlaceCoords.forEach(([rr, cc]) => (b2[rr][cc] = 1));
      setBoard(b2);

      // remove placing flags
      const cleaned = { ...placingAnimCells };
      toPlaceCoords.forEach(([rr, cc]) => delete cleaned[`${rr}-${cc}`]);
      setPlacingAnimCells(cleaned);

      // Clear full rows/cols with animation
      const cleared = performClearWithAnimation(b2);
      // update score: tiles placed count + cleared*10
      setScore((s) => s + toPlaceCoords.length + cleared * 10);

      // mark piece used
      const newPieces = [...pieces];
      newPieces[pieceIndex] = null;
      if (newPieces.every((p) => p === null)) {
        generatePieces();
      } else {
        setPieces(newPieces);
      }

      // After all, check gameover
      if (!hasAnyMoves(b2, newPieces)) {
        playGameOverSound();
        setTimeout(() => {
          alert("Game Over!");
          resetGame();
        }, 150);
      }
    }, 140); // sync with css animation duration
    return true;
  }

  // Clear full rows and columns with animation and then actually clear
  function performClearWithAnimation(boardCopy) {
    const rowsToClear = [];
    const colsToClear = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      if (boardCopy[r].every((cell) => cell === 1)) rowsToClear.push(r);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      let colFull = true;
      for (let r = 0; r < BOARD_SIZE; r++) if (boardCopy[r][c] !== 1) colFull = false;
      if (colFull) colsToClear.push(c);
    }

    const clearCoords = [];
    rowsToClear.forEach((r) => {
      for (let c = 0; c < BOARD_SIZE; c++) clearCoords.push([r, c]);
    });
    colsToClear.forEach((c) => {
      for (let r = 0; r < BOARD_SIZE; r++) clearCoords.push([r, c]);
    });

    if (clearCoords.length === 0) return 0;

    // mark clearing cells for animation
    const newClearing = { ...clearingCells };
    clearCoords.forEach(([r, c]) => (newClearing[`${r}-${c}`] = true));
    setClearingCells(newClearing);
    playClearSound();

    // after animation, remove them
    setTimeout(() => {
      const b2 = boardCopy.map((r) => [...r]);
      clearCoords.forEach(([r, c]) => (b2[r][c] = EMPTY));
      setBoard(b2);
      // cleanup clearing flags
      const cleaned = { ...clearingCells };
      clearCoords.forEach(([r, c]) => delete cleaned[`${r}-${c}`]);
      setClearingCells(cleaned);
    }, 340); // match CSS animation timing

    return rowsToClear.length + colsToClear.length;
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

  // Drag & Drop handlers (HTML5)
  function handleDragStart(e, pieceIndex) {
    // ensure audio context on user gesture
    ensureAudioContext();

    setDraggingIndex(pieceIndex);
    e.dataTransfer.setData("text/plain", String(pieceIndex));
    // set a tiny drag image so visuals OK
    const crt = document.createElement("canvas");
    crt.width = 1; crt.height = 1;
    e.dataTransfer.setDragImage(crt, 0, 0);
  }

  function handleDragOverCell(e) {
    e.preventDefault(); // allow drop
  }

  function handleDropOnCell(e, row, col) {
    e.preventDefault();
    const dt = e.dataTransfer.getData("text/plain");
    const idx = dt ? Number(dt) : draggingIndex;
    if (typeof idx !== "number") return;
    const shape = pieces[idx];
    if (!shape) return;

    // We interpret drop coordinate as top-left of the shape (so user should drag to desired top-left)
    if (placePiece(shape, row, col, idx)) {
      // success
    } else {
      // try to snap: if not fit at top-left, attempt to place with shape offset so user's drop cell becomes nearest filled cell
      // find nearest filled cell in shape relative to its top-left
      let found = false;
      for (let sr = 0; sr < shape.length && !found; sr++) {
        for (let sc = 0; sc < shape[0].length && !found; sc++) {
          if (shape[sr][sc] === 1) {
            // try align shape so this cell lands on drop cell
            const tryRow = row - sr;
            const tryCol = col - sc;
            if (placePiece(shape, tryRow, tryCol, idx)) {
              found = true;
            }
          }
        }
      }
      // if still not placed, give small feedback beep
      if (!found) playBeep(220, 0.06, "sine", 0.04);
    }
    setDraggingIndex(null);
  }

  // Fallback: tap-select then click board cell (mobile)
  function handlePieceTap(index) {
    if (!pieces[index]) return;
    // toggle selected
    if (window.__selectedPieceIndex === index) {
      window.__selectedPieceIndex = null;
      document.body.style.cursor = "";
    } else {
      window.__selectedPieceIndex = index;
      document.body.style.cursor = "crosshair";
      ensureAudioContext();
    }
  }

  // When user taps a board cell, if a piece is selected, try to place
  function handleCellTap(row, col) {
    const sel = typeof window !== "undefined" ? window.__selectedPieceIndex : null;
    if (sel === null || sel === undefined) return;
    const shape = pieces[sel];
    if (!shape) return;
    // attempt same heuristic as drop
    if (!placePiece(shape, row, col, sel)) {
      // try align by shape filled cell
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
    // clear selection
    window.__selectedPieceIndex = null;
    document.body.style.cursor = "";
  }

  // Helper for rendering piece visual grid
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
      <h1>Block Blast (Improved)</h1>
      <div className="top-row">
        <div className="score">Score: <strong>{score}</strong></div>
        <div className="controls">
          <button onClick={resetGame}>Restart</button>
          <button onClick={() => { setBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY))); setScore(0); generatePieces(); }}>Clear Board</button>
        </div>
      </div>

      <div className="game-area">
        {/* board */}
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

        {/* pieces column */}
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
                  onPointerDown={() => { /* ensure audio context when touching */ ensureAudioContext(); }}
                  onClick={() => handlePieceTap(idx)}
                  title="Drag to board or tap then tap board to place"
                >
                  {renderPieceBlocks(shape)}
                </div>
              ) : (
                <div key={idx} className="piece-box used">Used</div>
              )
            )}
          </div>

          <div className="hint">
            <small>Drag a piece to the board (desktop). <br/>On mobile: tap a piece, then tap a board cell to place.</small>
          </div>
        </div>
      </div>

      <div className="legend">
        <div><span className="dot used-dot" /> placed block</div>
        <div><span className="dot placing-dot" /> placing (anim)</div>
        <div><span className="dot clearing-dot" /> clearing (anim)</div>
      </div>
    </div>
  );
}
