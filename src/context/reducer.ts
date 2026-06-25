import type { SimState, SimAction, Cell, GridPos } from "../types";

// Creates an empty grid with the given dimensions
function makeGrid(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      type: "empty",
      explored: false,
      inPath: false,
    })),
  );
}

export function makeInitialState(): SimState {
  const rows = 30;
  const cols = 50;

  return {
    grid: makeGrid(rows, cols),
    robot: null,
    goal: null,
    drawMode: "wall",
    config: { rows, cols, cellSize: 20 },
    isRunning: false,
    statusMsg: "Draw walls, then place start and goal.",
  };
}

export function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "SET_CELL": {
      const { row, col } = action;
      const grid = state.grid.map((r) => r.map((c) => ({ ...c })));
      const mode = state.drawMode;

      if (mode === "wall") {
        grid[row][col].type = "wall";
      } else if (mode === "erase") {
        // Reset the cell back to its default state
        grid[row][col].type = "empty";
        grid[row][col].inPath = false;
        grid[row][col].explored = false;
      } else if (mode === "start") {
        // Only allow one start position on the grid
        for (let r = 0; r < grid.length; r++)
          for (let c = 0; c < grid[0].length; c++)
            if (grid[r][c].type === "start") grid[r][c].type = "empty";

        grid[row][col].type = "start";

        return {
          ...state,
          grid,
          robot: { pos: { row, col }, angleDeg: 0 },
        };
      } else if (mode === "goal") {
        // Replace the previous goal if one already exists
        for (let r = 0; r < grid.length; r++)
          for (let c = 0; c < grid[0].length; c++)
            if (grid[r][c].type === "goal") grid[r][c].type = "empty";

        grid[row][col].type = "goal";

        return {
          ...state,
          grid,
          goal: { row, col },
        };
      }

      return { ...state, grid };
    }

    case "SET_DRAW_MODE":
      return { ...state, drawMode: action.mode };

    case "CLEAR_GRID":
      return {
        ...makeInitialState(),
        drawMode: state.drawMode,
        statusMsg: "Grid cleared.",
      };

    case "SET_STATUS":
      return { ...state, statusMsg: action.msg };

    case "SET_RUNNING":
      return { ...state, isRunning: action.val };

    case "MARK_PATH": {
      const grid = state.grid.map((r) => r.map((c) => ({ ...c })));

      // Highlight the final path without changing walls or markers
      action.cells.forEach(({ row, col }: GridPos) => {
        if (grid[row][col].type === "empty") {
          grid[row][col].inPath = true;
        }
      });

      return { ...state, grid };
    }

    case "MARK_EXPLORED": {
      const grid = state.grid.map((r) => r.map((c) => ({ ...c })));

      // Mark every node visited by the search
      action.cells.forEach(({ row, col }: GridPos) => {
        grid[row][col].explored = true;
      });

      return { ...state, grid };
    }

    case "LOAD_GRID":
      return { ...state, grid: action.grid };

    default:
      return state;
  }
}
