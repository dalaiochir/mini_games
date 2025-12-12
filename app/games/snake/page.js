"use client";
import { useEffect, useRef, useState } from "react";

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const box = 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let snake = [{ x: 9 * box, y: 9 * box }];
    let dir = "RIGHT";

    let food = {
      x: Math.floor(Math.random() * 19) * box,
      y: Math.floor(Math.random() * 19) * box,
    };

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && dir !== "DOWN") dir = "UP";
      if (e.key === "ArrowDown" && dir !== "UP") dir = "DOWN";
      if (e.key === "ArrowLeft" && dir !== "RIGHT") dir = "LEFT";
      if (e.key === "ArrowRight" && dir !== "LEFT") dir = "RIGHT";
    });

    function resetGame() {
      snake = [{ x: 9 * box, y: 9 * box }];
      food = {
        x: Math.floor(Math.random() * 19) * box,
        y: Math.floor(Math.random() * 19) * box,
      };
      setScore(0);
    }

    function draw() {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 400, 400);

      // Draw snake
      for (let s of snake) {
        ctx.fillStyle = "lime";
        ctx.fillRect(s.x, s.y, box, box);
      }

      // Draw food
      ctx.fillStyle = "red";
      ctx.fillRect(food.x, food.y, box, box);

      let head = { ...snake[0] };

      if (dir === "UP") head.y -= box;
      if (dir === "DOWN") head.y += box;
      if (dir === "LEFT") head.x -= box;
      if (dir === "RIGHT") head.x += box;

      // Wall collision
      if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400) {
        resetGame();
        return;
      }

      // Snake body collision
      for (let s of snake) {
        if (head.x === s.x && head.y === s.y) {
          resetGame();
          return;
        }
      }

      snake.unshift(head);

      // Food collision
      if (head.x === food.x && head.y === food.y) {
        setScore((s) => s + 1);
        food = {
          x: Math.floor(Math.random() * 19) * box,
          y: Math.floor(Math.random() * 19) * box,
        };
      } else {
        snake.pop();
      }
    }

    let game = setInterval(draw, 120);
    return () => clearInterval(game);
  }, []);

  return (
    <div>
      <h1>Snake Game</h1>
      <h3>Score: {score}</h3>
      <canvas ref={canvasRef} width={400} height={400} style={{ border: "2px solid black" }} />
    </div>
  );
}
