"use client";
import { useState } from "react";

export default function Puzzle() {
  const [pos, setPos] = useState([1, 2, 3, 4, 5, 6, 7, 8, null]);

  const move = (i) => {
    const empty = pos.indexOf(null);
    const diff = Math.abs(empty - i);
    if (diff === 1 || diff === 3) {
      const newPos = [...pos];
      newPos[empty] = pos[i];
      newPos[i] = null;
      setPos(newPos);
    }
  };

  return (
    <div>
      <h1>Puzzle Game</h1>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 80px)",
        gap: "10px"
      }}>
        {pos.map((n, i) => (
          <button
            key={i}
            onClick={() => move(i)}
            style={{
              width: "80px",
              height: "80px",
              fontSize: "20px",
              background: n ? "#ddd" : "black",
              color: n ? "#000" : "transparent",
            }}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
