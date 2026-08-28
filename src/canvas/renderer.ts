import type { SimState } from "../types";
import {
  LIDAR_RANGE,
  ULTRASONIC_RANGE,
  ULTRASONIC_CONE_DEG,
} from "../sensors/raycast";

const C = {
  bg: "#0B0D12",
  gridLine: "#1A2130",
  wall: "#2B3342",
  wallStroke: "#3D4759",
  explored: "#12241F",
  path: "#4CE8B822",
  pathStroke: "#4CE8B8",
  start: "#FF8F5C",
  goal: "#4CE8B8",
  robot: "#FF8F5C",
  robotBorder: "#FFC49A",
  text: "#EAEDF2",
  fog: "rgba(11, 13, 18, 0.88)",
};

export function renderGrid(ctx: CanvasRenderingContext2D, state: SimState) {
  const { grid, robot, config, planningMode, known } = state;
  const { rows, cols, cellSize } = config;
  const reactive = planningMode === "reactive";

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);

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

      // In reactive mode, anything the robot hasn't sensed yet is hidden
      // that's the entire point of the mode. Start/goal stay visible so the
      // user doesn't lose track of the layout they drew; the algorithm
      // itself never reads pixels, only sense() output.
      const isHidden =
        reactive &&
        known[r][c] === "unknown" &&
        cell.type !== "start" &&
        cell.type !== "goal";

      if (isHidden) {
        ctx.fillStyle = C.fog;
        ctx.fillRect(x, y, cellSize, cellSize);
        continue;
      }

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

      if (cell.type === "start") {
        drawStart(ctx, x, y, cellSize);
      }
    }
  }

  if (reactive) {
    drawSensorOverlay(ctx, state);
  }

  if (robot) {
    const rx = robot.pos.col * cellSize + cellSize / 2;
    const ry = robot.pos.row * cellSize + cellSize / 2;
    drawRobot(ctx, rx, ry, cellSize * 0.38, robot.angleDeg);
  }
}

// Draws the current sensor pass as a light coverage outline (full circle for
// LiDAR, a wedge for ultrasonic) plus small dots at whatever the sensor
// actually hit. Deliberately NOT one line per ray at grid scale, 60 solid
// lines from the robot would just be noise. Dots read cleanly at any zoom
// level, same as how real LiDAR point clouds are visualized.
function drawSensorOverlay(ctx: CanvasRenderingContext2D, state: SimState) {
  const { lastReading, sensorMode, robot, config } = state;
  if (!lastReading || !robot) return;

  const { cellSize } = config;
  const cx = (lastReading.origin.col + 0.5) * cellSize;
  const cy = (lastReading.origin.row + 0.5) * cellSize;
  const color = sensorMode === "lidar" ? C.goal : C.robot;
  const rangeCells = sensorMode === "lidar" ? LIDAR_RANGE : ULTRASONIC_RANGE;
  const rangePx = rangeCells * cellSize;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);

  if (sensorMode === "lidar") {
    ctx.beginPath();
    ctx.arc(cx, cy, rangePx, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const facing = lastReading.facingRad; // was: (robot.angleDeg * Math.PI) / 180
    const half = (ULTRASONIC_CONE_DEG * Math.PI) / 360;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(facing - half) * rangePx,
      cy + Math.sin(facing - half) * rangePx,
    );
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(facing + half) * rangePx,
      cy + Math.sin(facing + half) * rangePx,
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, rangePx, facing - half, facing + half);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  ctx.fillStyle = color;
  for (const hit of lastReading.hits) {
    const hx = (hit.col + 0.5) * cellSize;
    const hy = (hit.row + 0.5) * cellSize;
    ctx.beginPath();
    ctx.arc(hx, hy, Math.max(2, cellSize * 0.12), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawRobot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angleDeg: number,
) {
  const rad = (angleDeg * Math.PI) / 180;

  ctx.save();
  ctx.translate(x, y);

  // glow, drawn before rotation so it stays a clean circle
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.6);
  glow.addColorStop(0, "#00D4FF22");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(rad);

  const w = r * 2.1;
  const h = r * 1.5;
  const radius = h * 0.35;

  // chassis
  ctx.fillStyle = C.robot;
  roundRect(ctx, -w / 2, -h / 2, w, h, radius);
  ctx.fill();
  ctx.strokeStyle = C.robotBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // wheels
  ctx.fillStyle = "#0A0E14";
  ctx.fillRect(-w * 0.32, -h / 2 - 2, w * 0.22, 3);
  ctx.fillRect(w * 0.1, -h / 2 - 2, w * 0.22, 3);
  ctx.fillRect(-w * 0.32, h / 2 - 1, w * 0.22, 3);
  ctx.fillRect(w * 0.1, h / 2 - 1, w * 0.22, 3);

  // headlight marks the front where the direction the robot is actually facing
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(w / 2 - h * 0.2, 0, h * 0.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const s = size * 0.42;

  ctx.fillStyle = "#FF6B3525";
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.44, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = C.start;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.9, cy - s * 0.15);
  ctx.lineTo(cx, cy + s * 0.35);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = C.start;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx, cy + s * 0.9);
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
