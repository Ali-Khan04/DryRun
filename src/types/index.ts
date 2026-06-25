export type CellType = "empty" | "wall" | "start" | "goal";

export interface Cell {
  type: CellType;
  explored: boolean;
  inPath: boolean;
}

export interface GridPos {
  row: number;
  col: number;
}

export interface RobotState {
  pos: GridPos;
  angleDeg: number;
}

export type DrawMode = "wall" | "erase" | "start" | "goal";

export interface SimConfig {
  cols: number;
  rows: number;
  cellSize: number;
}

export interface SimState {
  grid: Cell[][];
  robot: RobotState | null;
  goal: GridPos | null;
  drawMode: DrawMode;
  config: SimConfig;
  isRunning: boolean;
  statusMsg: string;
}

export type SimAction =
  | { type: "SET_CELL"; row: number; col: number }
  | { type: "SET_DRAW_MODE"; mode: DrawMode }
  | { type: "SET_ROBOT"; pos: GridPos }
  | { type: "SET_GOAL"; pos: GridPos }
  | { type: "CLEAR_GRID" }
  | { type: "SET_STATUS"; msg: string }
  | { type: "SET_RUNNING"; val: boolean }
  | { type: "MARK_PATH"; cells: GridPos[] }
  | { type: "MARK_EXPLORED"; cells: GridPos[] }
  | { type: "LOAD_GRID"; grid: Cell[][] };
