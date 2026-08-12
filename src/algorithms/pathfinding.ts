import type { Cell, GridPos } from "../types";

export type SearchStep =
  | { kind: "visit"; pos: GridPos }
  | { kind: "done"; path: GridPos[] }
  | { kind: "no-path" };

interface Node {
  pos: GridPos;
  g: number; // cost from start
  f: number; // g, or g + heuristic when A* is enabled
  parent: Node | null;
}

const key = (p: GridPos) => `${p.row},${p.col}`;

function manhattan(a: GridPos, b: GridPos): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// Minimal binary min-heap, keyed on node.f
class MinHeap {
  private items: Node[] = [];

  get size() {
    return this.items.length;
  }

  push(node: Node) {
    this.items.push(node);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): Node | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0 && last) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent].f <= this.items[i].f) break;
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
    }
  }

  private bubbleDown(i: number) {
    const n = this.items.length;
    while (true) {
      let smallest = i;
      const l = i * 2 + 1;
      const r = i * 2 + 2;
      if (l < n && this.items[l].f < this.items[smallest].f) smallest = l;
      if (r < n && this.items[r].f < this.items[smallest].f) smallest = r;
      if (smallest === i) break;
      [this.items[smallest], this.items[i]] = [
        this.items[i],
        this.items[smallest],
      ];
      i = smallest;
    }
  }
}

const NEIGHBOR_OFFSETS = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

/**
 * One search function, two algorithms.
 *
 * Dijkstra and A* are the same graph search - pop the cheapest frontier
 * node, relax its neighbors, repeat - the only difference is what
 * "cheapest" means:
 *
 *   Dijkstra: priority = cost-so-far (g)
 *   A*:       priority = cost-so-far + estimated-cost-to-goal (g + h)
 *
 * That's the single `useHeuristic ? manhattan(...) : 0` line below.
 * Everything else - the heap, the visited set, relaxation, path
 * reconstruction - is identical code, which is the point: it makes the
 * relationship between the two algorithms visible instead of hiding it
 * behind two separate implementations.
 *
 * It's a generator so the UI can pull one `visit` at a time and animate
 * the frontier expanding, instead of jumping straight to the answer.
 */
export function* runSearch(
  grid: Cell[][],
  start: GridPos,
  goal: GridPos,
  useHeuristic: boolean,
): Generator<SearchStep, void, void> {
  const rows = grid.length;
  const cols = grid[0].length;

  const startNode: Node = {
    pos: start,
    g: 0,
    f: useHeuristic ? manhattan(start, goal) : 0,
    parent: null,
  };

  const open = new MinHeap();
  open.push(startNode);

  const bestG = new Map<string, number>([[key(start), 0]]);
  const visited = new Set<string>();

  while (open.size > 0) {
    const current = open.pop()!;
    const currentKey = key(current.pos);

    if (visited.has(currentKey)) continue; // stale queue entry, skip
    visited.add(currentKey);

    yield { kind: "visit", pos: current.pos };

    if (current.pos.row === goal.row && current.pos.col === goal.col) {
      yield { kind: "done", path: reconstructPath(current) };
      return;
    }

    for (const offset of NEIGHBOR_OFFSETS) {
      const nRow = current.pos.row + offset.row;
      const nCol = current.pos.col + offset.col;

      if (nRow < 0 || nRow >= rows || nCol < 0 || nCol >= cols) continue;
      if (grid[nRow][nCol].type === "wall") continue;

      const nKey = `${nRow},${nCol}`;
      if (visited.has(nKey)) continue;

      const tentativeG = current.g + 1; // uniform grid, one step = one cost

      if (bestG.has(nKey) && (bestG.get(nKey) as number) <= tentativeG)
        continue;
      bestG.set(nKey, tentativeG);

      const nPos = { row: nRow, col: nCol };
      const h = useHeuristic ? manhattan(nPos, goal) : 0;

      open.push({
        pos: nPos,
        g: tentativeG,
        f: tentativeG + h,
        parent: current,
      });
    }
  }

  yield { kind: "no-path" };
}

function reconstructPath(node: Node): GridPos[] {
  const path: GridPos[] = [];
  let cur: Node | null = node;
  while (cur) {
    path.push(cur.pos);
    cur = cur.parent;
  }
  return path.reverse();
}
