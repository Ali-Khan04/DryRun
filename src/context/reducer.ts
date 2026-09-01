import type { SimState, SimAction, Cell, Knowledge, GridPos, PlanningMode } from "../types";
import { findCell } from "../utils/grid";

// The exact next button to point at differs per mode, so both "Start and
// Goal are now set" messages (from SET_CELL and from switching modes with
// both already placed) route through this one place.
function readyToRunMessage(mode: PlanningMode): string {
  if (mode === "reactive") {
    return "Start and Goal are set. Hit Explore below - the robot senses and moves on its own, with no map.";
  }
  if (mode === "slam") {
    return "Start and Goal are set. Hit Sense in Build Map below to start revealing the map.";
  }
  return "Start and Goal are set. Hit Run in Search below to plan a route.";
}

function makeGrid(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      type: "empty",
      explored: false,
      inPath: false,
    })),
  );
}

function makeKnown(rows: number, cols: number): Knowledge[][] {
  return Array.from({ length: rows }, () =>
    Array<Knowledge>(cols).fill("unknown"),
  );
}

export function makeInitialState(): SimState {
  const rows = 30;
  const cols = 50;

  return {
    grid: makeGrid(rows, cols),
    robot: null,
    goal: null,
    path: null,
    drawMode: "wall",
    algorithm: "astar",
    planningMode: "global",
    sensorMode: "lidar",
    known: makeKnown(rows, cols),
    lastReading: null,
    calloutPos: null,
    calloutText: null,
    calloutTone: "info",
    config: { rows, cols, cellSize: 20 },
    isRunning: false,
    statusMsg: "Place a Start and a Goal on the grid to begin.",
    statusTone: "guide",
  };
}

export function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case "SET_CELL": {
      if (state.isRunning) return state;

      const { row, col } = action;
      const grid = state.grid.map((r) => r.map((c) => ({ ...c })));
      const mode = state.drawMode;

      if (mode === "wall") {
        grid[row][col].type = "wall";
      } else if (mode === "erase") {
        grid[row][col].type = "empty";
        grid[row][col].inPath = false;
        grid[row][col].explored = false;
      } else if (mode === "start") {
        for (let r = 0; r < grid.length; r++)
          for (let c = 0; c < grid[0].length; c++)
            if (grid[r][c].type === "start") grid[r][c].type = "empty";

        grid[row][col].type = "start";

        return {
          ...state,
          grid,
          robot: { pos: { row, col }, angleDeg: 0 },
          statusMsg: state.goal
            ? readyToRunMessage(state.planningMode)
            : "Start placed. Now place a Goal to continue.",
          statusTone: "guide",
        };
      } else if (mode === "goal") {
        for (let r = 0; r < grid.length; r++)
          for (let c = 0; c < grid[0].length; c++)
            if (grid[r][c].type === "goal") grid[r][c].type = "empty";

        grid[row][col].type = "goal";

        return {
          ...state,
          grid,
          goal: { row, col },
          statusMsg: state.robot
            ? readyToRunMessage(state.planningMode)
            : "Goal placed. Now place a Start to continue.",
          statusTone: "guide",
        };
      }

      return { ...state, grid };
    }

    case "SET_DRAW_MODE":
      return { ...state, drawMode: action.mode };

    case "SET_ALGORITHM":
      return { ...state, algorithm: action.algorithm };

    case "SET_SENSOR_MODE":
      return { ...state, sensorMode: action.mode };

    case "SET_PLANNING_MODE": {
      const { rows, cols } = state.config;
      const grid = state.grid.map((r) =>
        r.map((c) => ({ ...c, explored: false, inPath: false })),
      );
      const startPos = findCell(grid, "start");
      const ready = !!startPos && !!state.goal;

      let statusMsg: string;
      if (ready) {
        statusMsg = readyToRunMessage(action.mode);
      } else if (action.mode === "reactive") {
        statusMsg =
          "Reactive mode. Place a Start and a Goal - the robot will sense and move with no map at all.";
      } else if (action.mode === "slam") {
        statusMsg =
          "SLAM mode. Place a Start and a Goal - then Sense builds the map and A*/Dijkstra plans a route through it.";
      } else {
        statusMsg =
          "Global mode. Place a Start and a Goal, then Run plans a route with the whole map already known.";
      }

      return {
        ...state,
        planningMode: action.mode,
        grid,
        path: null,
        known: makeKnown(rows, cols),
        lastReading: null,
        calloutPos: null,
        calloutText: null,
        calloutTone: "info",
        isRunning: false,
        robot: startPos ? { pos: startPos, angleDeg: 0 } : null,
        statusMsg,
        statusTone: "guide",
      };
    }

    case "CLEAR_GRID": {
      const { rows, cols } = state.config;
      return {
        ...state,
        grid: makeGrid(rows, cols),
        robot: null,
        goal: null,
        path: null,
        known: makeKnown(rows, cols),
        lastReading: null,
        calloutPos: null,
        calloutText: null,
        calloutTone: "info",
        statusMsg: "Grid cleared. Place a Start and a Goal to begin.",
        statusTone: "guide",
      };
    }

    case "RESET_SEARCH": {
      const grid = state.grid.map((r) =>
        r.map((c) => ({ ...c, explored: false, inPath: false })),
      );
      return {
        ...state,
        grid,
        path: null,
        calloutPos: null,
        calloutText: null,
        calloutTone: "info",
        statusMsg: "Route cleared. Ready to plan again whenever you like.",
        statusTone: "guide",
      };
    }

    case "RESET_EXPLORE": {
      const { rows, cols } = state.config;
      return {
        ...state,
        known: makeKnown(rows, cols),
        lastReading: null,
        calloutPos: null,
        calloutText: null,
        calloutTone: "info",
        statusMsg: "Map cleared. Ready to build it again.",
        statusTone: "guide",
      };
    }

    case "CLEAR_ENDPOINTS": {
      const grid = state.grid.map((r) =>
        r.map((c) =>
          c.type === "start" || c.type === "goal"
            ? { ...c, type: "empty" as const }
            : c,
        ),
      );
      return {
        ...state,
        grid,
        robot: null,
        goal: null,
        path: null,
        calloutPos: null,
        calloutText: null,
        calloutTone: "info",
        statusMsg: "Start and Goal cleared. Place them again to continue.",
        statusTone: "guide",
      };
    }

    case "SET_STATUS":
      return {
        ...state,
        statusMsg: action.msg,
        statusTone: action.tone ?? "guide",
      };

    case "SET_RUNNING":
      return { ...state, isRunning: action.val };

    case "SET_PATH":
      return { ...state, path: action.path };

    case "MOVE_ROBOT":
      return {
        ...state,
        robot: { pos: action.pos, angleDeg: action.angleDeg },
      };

    case "SENSE_UPDATE": {
      const known = state.known.map((row) => row.slice());
      for (const c of action.reading.freeCells) known[c.row][c.col] = "free";
      for (const c of action.reading.hits) known[c.row][c.col] = "wall";
      return { ...state, known, lastReading: action.reading };
    }

    case "SET_CALLOUT":
      return {
        ...state,
        calloutPos: action.pos,
        calloutText: action.text,
        calloutTone: action.tone,
      };

    case "CLEAR_CALLOUT":
      return {
        ...state,
        calloutPos: null,
        calloutText: null,
        calloutTone: "info",
      };

    case "MARK_PATH": {
      const grid = state.grid.map((r) => r.map((c) => ({ ...c })));
      action.cells.forEach(({ row, col }: GridPos) => {
        if (grid[row][col].type === "empty") {
          grid[row][col].inPath = true;
        }
      });
      return { ...state, grid };
    }

    case "MARK_EXPLORED": {
      const grid = state.grid.map((r) => r.map((c) => ({ ...c })));
      action.cells.forEach(({ row, col }: GridPos) => {
        grid[row][col].explored = true;
      });
      return { ...state, grid };
    }

    case "RESTORE_SNAPSHOT": {
      return {
        ...state,
        grid: action.snapshot.grid,
        robot: action.snapshot.robot,
        goal: action.snapshot.goal,
      };
    }

    case "LOAD_GRID":
      return { ...state, grid: action.grid };

    case "RESIZE_GRID": {
      const { rows, cols } = action;
      if (rows === state.config.rows && cols === state.config.cols) {
        return state;
      }

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
        known: makeKnown(rows, cols),
        lastReading: null,
      };
    }

    default:
      return state;
  }
}
