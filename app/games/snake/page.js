"use client";
import { useEffect, useRef } from "react";

export default function SnakeGame() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let box = 20;
    let snake = [{ x: 9 * box, y: 9 * box }];
    let dir = "RIGHT";

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && dir !== "DOWN") dir = "UP";
      if (e.key === "ArrowDown" && dir !== "UP") dir = "DOWN";
      if (e.key === "ArrowLeft" && dir !== "RIGHT") dir = "LEFT";
      if (e.key === "ArrowRight" && dir !== "LEFT") dir = "RIGHT";
    });

    function draw() {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 400, 400);

      for (let s of snake) {
        ctx.fillStyle = "lime";
        ctx.fillRect(s.x, s.y, box, box);
      }

      let head = { ...snake[0] };

      if (dir === "UP") head.y -= box;
      if (dir === "DOWN") head.y += box;
      if (dir === "LEFT") head.x -= box;
      if (dir === "RIGHT") head.x += box;

      snake.unshift(head);
      snake.pop();
    }

    let game = setInterval(draw, 150);
    return () => clearInterval(game);
  }, []);

  return (
    <div>
      <h1>Snake Game</h1>
      <canvas ref={canvasRef} width={400} height={400} style={{ border: "2px solid black" }} />
    </div>
  );
}
