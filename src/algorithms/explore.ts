import type { Cell, GridPos, Knowledge, SensorMode, SensorReading } from "../types";
import { lidarSweep, ultrasonicSweep } from "../sensors/raycast";

export type ExploreStep =
  | { kind: "sense"; reading: SensorReading }
  | { kind: "move"; pos: GridPos; angleDeg: number }
  | { kind: "reached" }
  | { kind: "stuck" };

const NEIGHBOR_OFFSETS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

function sameCell(a: GridPos, b: GridPos) {
  return a.row === b.row && a.col === b.col;
}

// Breadth-first search over cells the robot has *already confirmed* are
// free, unknown and wall cells are both treated as blocked, because a real
// robot has no business driving into territory it hasn't sensed. Finds the
// first position matching `isTarget`, which is what lets this same function
// serve as both "path to the goal" and "path to the nearest frontier" below
// same search, different target predicate.
function shortestKnownPath(
  known: Knowledge[][],
  start: GridPos,
  isTarget: (pos: GridPos) => boolean,
): GridPos[] | null {
  const rows = known.length;
  const cols = known[0].length;
  const cameFrom = new Map<string, GridPos | null>();
  cameFrom.set(`${start.row},${start.col}`, null);

  const queue: GridPos[] = [start];
  let qi = 0;

  while (qi < queue.length) {
    const current = queue[qi++];

    if (isTarget(current)) {
      const path: GridPos[] = [];
      let node: GridPos | undefined = current;
      while (node) {
        path.push(node);
        node = cameFrom.get(`${node.row},${node.col}`) ?? undefined;
      }
      return path.reverse();
    }

    for (const offset of NEIGHBOR_OFFSETS) {
      const row = current.row + offset.row;
      const col = current.col + offset.col;
      if (row < 0 || row >= rows || col < 0 || col >= cols) continue;

      const key = `${row},${col}`;
      if (cameFrom.has(key)) continue;
      if (known[row][col] !== "free") continue; // can't trust unknown or walled cells

      cameFrom.set(key, current);
      queue.push({ row, col });
    }
  }

  return null;
}

// A frontier cell is known-free but borders at least one unknown cell, the
// edge of what's been discovered so far, and the most useful place to look
// next
function isFrontier(known: Knowledge[][], pos: GridPos): boolean {
  if (known[pos.row][pos.col] !== "free") return false;
  const rows = known.length;
  const cols = known[0].length;

  for (const offset of NEIGHBOR_OFFSETS) {
    const row = pos.row + offset.row;
    const col = pos.col + offset.col;
    if (row < 0 || row >= rows || col < 0 || col >= cols) continue;
    if (known[row][col] === "unknown") return true;
  }
  return false;
}

function angleBetween(from: GridPos, to: GridPos): number {
  return Math.atan2(to.row - from.row, to.col - from.col);
}

/**
 * Frontier exploration: the robot has NO access to `grid` for planning
 * purposes; only `sense()` calls touch it. Each loop:
 *
 *   1. Sense from the current cell (LiDAR or ultrasonic) against the real
 *      grid, and fold the result into `known` the robot's own belief.
 *   2. If the goal is already reachable through known-free cells, walk
 *      straight toward it.
 *   3. Otherwise, walk toward the nearest frontier cell to reveal more of
 *      the map.
 *   4. If there's no path to the goal AND no reachable frontier left, the
 *      goal is unreachable from what's been discovered - stop.
 *
 * The goal only becomes reachable in step 2 once some sensor pass has swept
 * over it and  there's no special-casing "is the goal visible," it falls out
 * naturally from `known` only ever containing real sensor data.
 */
export function* explore(
  grid: Cell[][],
  start: GridPos,
  goal: GridPos,
  sensorMode: SensorMode,
): Generator<ExploreStep, void, void> {
  const rows = grid.length;
  const cols = grid[0].length;
  const known: Knowledge[][] = Array.from({ length: rows }, () =>
    Array<Knowledge>(cols).fill("unknown"),
  );

  let pos = start;
  let facingRad = 0;

  while (true) {
    const sweep =
      sensorMode === "lidar"
        ? lidarSweep(grid, pos)
        : ultrasonicSweep(grid, pos, facingRad);

    // The robot's own cell always counts as known-free.
    const freeCells = [{ ...pos }, ...sweep.freeCells];

    for (const c of freeCells) known[c.row][c.col] = "free";
    for (const c of sweep.hits) known[c.row][c.col] = "wall";

    yield { kind: "sense", reading: { origin: pos, hits: sweep.hits, freeCells } };

    if (sameCell(pos, goal)) {
      yield { kind: "reached" };
      return;
    }

    let path = shortestKnownPath(known, pos, (p) => sameCell(p, goal));
    if (!path) {
      path = shortestKnownPath(known, pos, (p) => !sameCell(p, pos) && isFrontier(known, p));
    }

    if (!path || path.length < 2) {
      yield { kind: "stuck" };
      return;
    }

    const next = path[1];
    facingRad = angleBetween(pos, next);
    pos = next;

    yield { kind: "move", pos, angleDeg: (facingRad * 180) / Math.PI };
  }
}
