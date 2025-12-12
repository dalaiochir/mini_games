"use client";
import React from "react";
import Piece from "./Piece";
import { randomPieces } from "../utils";
import { SHAPES } from "../utils";


export default function PiecesArea({ pieces, setPieces, board, setBoard, setScore, usePieceAt }) {
function generate() {
setPieces(randomPieces(SHAPES, 3));
}


function handlePieceClick(i) {
// mobile: select for tap-to-place
if (window.__bb_selected === i) {
window.__bb_selected = null;
document.body.style.cursor = "";
} else {
window.__bb_selected = i;
document.body.style.cursor = "crosshair";
}
}

return (
<div className="pieces-area">
<div className="pieces-list">
{pieces.map((shape, i) => (
<div key={i} className="piece-slot">
{shape ? (
<div
draggable
onDragStart={(e) => {
e.dataTransfer.setData("text/plain", String(i));
// tiny drag image
const c = document.createElement("canvas"); c.width = 1; c.height = 1;
e.dataTransfer.setDragImage(c, 0, 0);
}}
onClick={() => handlePieceClick(i)}
className="piece-box"
title="Drag to board or tap to select"
>
<Piece shape={shape} />
</div>
) : (
<div className="piece-box used">Used</div>
)}
</div>
))}
</div>


<div className="pieces-actions">
<button onClick={generate}>New Pieces</button>
</div>
</div>
);
}

