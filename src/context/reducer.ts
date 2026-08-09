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
          statusMsg: state.goal
            ? "Start and goal set."
            : "Start placed. Now place a goal.",
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
          statusMsg: state.robot
            ? "Start and goal set."
            : "Goal placed. Now place a start.",
        };
      }

      return { ...state, grid };
    }

    case "SET_DRAW_MODE":
      return { ...state, drawMode: action.mode };

    case "CLEAR_GRID": {
      const { rows, cols } = state.config;
      return {
        ...state,
        grid: makeGrid(rows, cols),
        robot: null,
        goal: null,
        statusMsg: "Grid cleared.",
      };
    }

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

    case "RESIZE_GRID": {
      const { rows, cols } = action;
      if (rows === state.config.rows && cols === state.config.cols) {
        return state;
      }

      // Rebuild at the new size, copying over whatever overlaps the old grid
      // so walls/start/goal survive a resize instead of getting wiped.
      const grid = makeGrid(rows, cols);
      const oldGrid = state.grid;
      const copyRows = Math.min(rows, oldGrid.length);
      const copyCols = Math.min(cols, oldGrid[0]?.length ?? 0);

      for (let r = 0; r < copyRows; r++) {
        for (let c = 0; c < copyCols; c++) {
          grid[r][c] = { ...oldGrid[r][c] };
        }
      }

      const robotInBounds =
        state.robot && state.robot.pos.row < rows && state.robot.pos.col < cols;
      const goalInBounds =
        state.goal && state.goal.row < rows && state.goal.col < cols;

      return {
        ...state,
        grid,
        config: { ...state.config, rows, cols },
        robot: robotInBounds ? state.robot : null,
        goal: goalInBounds ? state.goal : null,
      };
    }

    default:
      return state;
  }
}
