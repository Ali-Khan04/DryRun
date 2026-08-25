import type { Cell, CellType, GridPos } from "../types";

// Scans the grid for the first cell of the given type. Used to find "where
// is the start/goal" without keeping a duplicate, potentially stale copy of
// that position around in state.
export function findCell(grid: Cell[][], type: CellType): GridPos | null {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[0].length; col++) {
      if (grid[row][col].type === type) return { row, col };
    }
  }
  return null;
}
