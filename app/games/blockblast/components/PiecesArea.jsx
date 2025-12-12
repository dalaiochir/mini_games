"use client";
import React from "react";
import Piece from "./Piece";

/**
 * pieces = [ { id, cells: [[x,y],...], w, h, color } | null ]
 */
export default function PiecesArea({ pieces }) {
  return (
    <div className="pieces-area" aria-hidden={false}>
      <h3>Pieces</h3>
      <div className="pieces-list">
        {pieces.map((p, i) => (
          <div key={i} className="piece-slot">
            {p ? (
              <Piece piece={p} />
            ) : (
              <div className="piece-box used">Used</div>
            )}
          </div>
        ))}
      </div>
      <small className="hint">Drag piece → drop on board. Mobile: tap piece → tap cell.</small>
    </div>
  );
}
