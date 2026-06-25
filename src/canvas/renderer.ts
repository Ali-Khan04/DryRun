import type { SimState } from "../types";

const C = {
  bg: "#0A0E14",
  gridLine: "#1E3A5F",
  wall: "#334155",
  wallStroke: "#475569",
  explored: "#0f2a1a",
  path: "#00D4FF22",
  pathStroke: "#00D4FF",
  start: "#FF6B35",
  goal: "#00D4FF",
  robot: "#FF6B35",
  robotBorder: "#FFB347",
  text: "#E2E8F0",
};

export function renderGrid(ctx: CanvasRenderingContext2D, state: SimState) {
  const { grid, robot, config } = state;
  const { rows, cols, cellSize } = config;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);

  // grid lines
  ctx.strokeStyle = C.gridLine;
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * cellSize);
    ctx.lineTo(cols * cellSize, r * cellSize);
    ctx.stroke();
  }
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cellSize, 0);
    ctx.lineTo(c * cellSize, rows * cellSize);
    ctx.stroke();
  }

  // cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      const x = c * cellSize;
      const y = r * cellSize;

      if (cell.explored) {
        ctx.fillStyle = C.explored;
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      }

      if (cell.inPath) {
        ctx.fillStyle = C.path;
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        ctx.strokeStyle = C.pathStroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      }

      if (cell.type === "wall") {
        ctx.fillStyle = C.wall;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = C.wallStroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
      }

      if (cell.type === "goal") {
        drawGoal(ctx, x, y, cellSize);
      }
    }
  }

  // robot
  if (robot) {
    const rx = robot.pos.col * cellSize + cellSize / 2;
    const ry = robot.pos.row * cellSize + cellSize / 2;
    drawRobot(ctx, rx, ry, cellSize * 0.38, robot.angleDeg);
  }
}

function drawRobot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angleDeg: number,
) {
  // glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
  glow.addColorStop(0, "#FF6B3520");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // body
  ctx.fillStyle = C.robot;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = C.robotBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // direction indicator
  const rad = (angleDeg * Math.PI) / 180;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(rad) * r * 0.8, y + Math.sin(rad) * r * 0.8);
  ctx.stroke();
}

function drawGoal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.3;

  // crosshair rings
  ctx.strokeStyle = C.goal;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
  ctx.stroke();

  // crosshair lines
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.4, cy);
  ctx.lineTo(cx + r * 1.4, cy);
  ctx.moveTo(cx, cy - r * 1.4);
  ctx.lineTo(cx, cy + r * 1.4);
  ctx.stroke();
}
