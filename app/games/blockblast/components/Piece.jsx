"use client";
import React from "react";

/**
 * Piece renders visual grid for piece and sets drag data:
 * dataTransfer contains JSON { piece, offsetX, offsetY }
 * offsetX/offsetY are 0..(w-1)/0..(h-1) — top-left by default.
 *
 * Also adds click-to-select for mobile.
 */
export default function Piece({ piece }) {
  const { w, h, cells, id, color } = piece;

  function handleDragStart(e) {
    // default offset top-left = 0,0
    const payload = { piece, offsetX: 0, offsetY: 0 };
    e.dataTransfer.setData("text/plain", JSON.stringify(payload));
    // small transparent drag image so default ghost not large
    const c = document.createElement("canvas"); c.width = 1; c.height = 1;
    e.dataTransfer.setDragImage(c, 0, 0);
  }

  function handleClick() {
    // mobile selection: set global selected and store piece object
    window.__bb_selected = id;
    window.__bb_selected_piece = piece;
    document.body.style.cursor = "crosshair";
  }

  // create grid of w x h with filled cells where coordinates present
  const grid = Array.from({ length: h }, (_, yy) =>
    Array.from({ length: w }, (_, xx) =>
      cells.some(([x, y]) => x === xx && y === yy)
    )
  );

  return (
    <div
      className="piece-box"
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      role="button"
      title="Drag to board or tap to select"
    >
      <div
        className="piece-grid"
        style={{
          gridTemplateColumns: `repeat(${w}, 20px)`,
          gridTemplateRows: `repeat(${h}, 20px)`,
        }}
      >
        {grid.flatMap((row, ry) =>
          row.map((filled, rx) => (
            <div
              key={`${ry}-${rx}`}
              className={filled ? "pfilled" : "pempty"}
              style={filled ? { background: color } : {}}
            />
          ))
        )}
      </div>
    </div>
  );
}
