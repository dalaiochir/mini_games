"use client";
import React from "react";


export default function Piece({ shape }) {
return (
<div className="piece-grid" style={{ gridTemplateColumns: `repeat(${shape[0].length}, 20px)`, gridAutoRows: `20px` }}>
{shape.flatMap((row, ri) => row.map((v, ci) => (
<div key={`${ri}-${ci}`} className={v === 1 ? "pfilled" : "pempty"} />
)))}
</div>
);
}