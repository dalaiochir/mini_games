"use client";
import { useState, useEffect } from "react";

export default function Puzzle() {
  const [tiles, setTiles] = useState([]);

  useEffect(() => {
    reset();
  }, []);

  function reset() {
    let arr = [1,2,3,4,5,6,7,8,null];
    arr.sort(() => Math.random() - 0.5);
    setTiles(arr);
  }

  function move(index) {
    const empty = tiles.indexOf(null);
    const validMoves = [index - 1, index + 1, index - 3, index + 3];

    if (validMoves.includes(empty)) {
      let newArr = [...tiles];
      newArr[empty] = tiles[index];
      newArr[index] = null;
      setTiles(newArr);

      // Win check
      if (JSON.stringify(newArr) === JSON.stringify([1,2,3,4,5,6,7,8,null])) {
        alert("Congratulations! You solved the puzzle!");
      }
    }
  }

  return (
    <div>
      <h1>Puzzle Game</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 100px)",
          gap: "12px",
          marginTop: "20px"
        }}
      >
        {tiles.map((tile, i) => (
          <button
            key={i}
            onClick={() => tile && move(i)}
            style={{
              width: "100px",
              height: "100px",
              background: tile ? "#fff" : "#333",
              border: "2px solid #000",
              fontSize: "25px",
              cursor: tile ? "pointer" : "default",
              transition: "0.2s",
            }}
          >
            {tile}
          </button>
        ))}
      </div>

      <button
        onClick={reset}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          fontSize: "18px",
          cursor: "pointer"
        }}
      >
        Restart
      </button>
    </div>
  );
}
