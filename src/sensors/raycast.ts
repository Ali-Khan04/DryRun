import type { Cell, GridPos } from "../types";

export const LIDAR_RANGE = 8;
export const LIDAR_RAYS = 60;
export const ULTRASONIC_RANGE = 5;
export const ULTRASONIC_RAYS = 5;
export const ULTRASONIC_CONE_DEG = 30;

export interface SweepResult {
  hits: GridPos[]; // cells where a ray hit a wall
  freeCells: GridPos[]; // cells a ray passed through without hitting anything
}

const STEP = 0.5; // grid cells per raymarch step

// Walks a single ray from origin, one small step at a time, until it either
// hits a wall, leaves the grid, or reaches maxRangeCells. Both LiDAR (many
// rays, full circle) and ultrasonic (few rays, narrow cone) are built from
// this one function
function castRay(
  grid: Cell[][],
  origin: GridPos,
  angleRad: number,
  maxRangeCells: number,
): { hitWall: GridPos | null; freeCells: GridPos[] } {
  const rows = grid.length;
  const cols = grid[0].length;
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  let x = origin.col + 0.5;
  let y = origin.row + 0.5;

  const freeCells: GridPos[] = [];
  const seen = new Set<string>();
  const steps = Math.ceil(maxRangeCells / STEP);

  for (let i = 0; i < steps; i++) {
    x += dx * STEP;
    y += dy * STEP;

    const col = Math.floor(x);
    const row = Math.floor(y);

    if (row < 0 || row >= rows || col < 0 || col >= cols) break;

    if (grid[row][col].type === "wall") {
      return { hitWall: { row, col }, freeCells };
    }

    const key = `${row},${col}`;
    if (!seen.has(key)) {
      seen.add(key);
      freeCells.push({ row, col });
    }
  }

  return { hitWall: null, freeCells };
}

function mergeSweep(
  rayResults: { hitWall: GridPos | null; freeCells: GridPos[] }[],
): SweepResult {
  const hits: GridPos[] = [];
  const freeCells: GridPos[] = [];
  const freeSeen = new Set<string>();

  for (const r of rayResults) {
    if (r.hitWall) hits.push(r.hitWall);
    for (const c of r.freeCells) {
      const key = `${c.row},${c.col}`;
      if (!freeSeen.has(key)) {
        freeSeen.add(key);
        freeCells.push(c);
      }
    }
  }

  return { hits, freeCells };
}

// Full 360-degree sweep 
// regardless of which way it's facing.
export function lidarSweep(
  grid: Cell[][],
  origin: GridPos,
  rayCount = LIDAR_RAYS,
  maxRangeCells = LIDAR_RANGE,
): SweepResult {
  const rays = [];
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    rays.push(castRay(grid, origin, angle, maxRangeCells));
  }
  return mergeSweep(rays);
}

// Narrow cone in the direction the robot is currently facing
// range and field of view than LiDAR, which is the entire teaching point
export function ultrasonicSweep(
  grid: Cell[][],
  origin: GridPos,
  facingRad: number,
  rayCount = ULTRASONIC_RAYS,
  maxRangeCells = ULTRASONIC_RANGE,
  coneDeg = ULTRASONIC_CONE_DEG,
): SweepResult {
  const halfCone = (coneDeg * Math.PI) / 360;
  const rays = [];
  for (let i = 0; i < rayCount; i++) {
    const t = rayCount === 1 ? 0.5 : i / (rayCount - 1);
    const angle = facingRad - halfCone + t * halfCone * 2;
    rays.push(castRay(grid, origin, angle, maxRangeCells));
  }
  return mergeSweep(rays);
}
