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
export type Algorithm = "astar" | "dijkstra";
export type PlanningMode = "global" | "reactive";
export type SensorMode = "lidar" | "ultrasonic";
export type Knowledge = "unknown" | "free" | "wall";

export interface SensorReading {
  origin: GridPos;
  hits: GridPos[];
  freeCells: GridPos[];
}

export interface GridSnapshot {
  grid: Cell[][];
  robot: RobotState | null;
  goal: GridPos | null;
}

export interface SimConfig {
  cols: number;
  rows: number;
  cellSize: number;
}

export interface SimState {
  grid: Cell[][];
  robot: RobotState | null;
  goal: GridPos | null;
  path: GridPos[] | null;
  drawMode: DrawMode;
  algorithm: Algorithm;
  planningMode: PlanningMode;
  sensorMode: SensorMode;
  known: Knowledge[][];
  lastReading: SensorReading | null;
  config: SimConfig;
  isRunning: boolean;
  statusMsg: string;
}

export type SimAction =
  | { type: "SET_CELL"; row: number; col: number }
  | { type: "SET_DRAW_MODE"; mode: DrawMode }
  | { type: "SET_ALGORITHM"; algorithm: Algorithm }
  | { type: "SET_PLANNING_MODE"; mode: PlanningMode }
  | { type: "SET_SENSOR_MODE"; mode: SensorMode }
  | { type: "SET_ROBOT"; pos: GridPos }
  | { type: "SET_GOAL"; pos: GridPos }
  | { type: "CLEAR_GRID" }
  | { type: "RESET_SEARCH" }
  | { type: "RESET_EXPLORE" }
  | { type: "CLEAR_ENDPOINTS" }
  | { type: "SET_STATUS"; msg: string }
  | { type: "SET_RUNNING"; val: boolean }
  | { type: "MARK_PATH"; cells: GridPos[] }
  | { type: "MARK_EXPLORED"; cells: GridPos[] }
  | { type: "SET_PATH"; path: GridPos[] | null }
  | { type: "MOVE_ROBOT"; pos: GridPos; angleDeg: number }
  | { type: "SENSE_UPDATE"; reading: SensorReading }
  | { type: "RESTORE_SNAPSHOT"; snapshot: GridSnapshot }
  | { type: "LOAD_GRID"; grid: Cell[][] }
  | { type: "RESIZE_GRID"; rows: number; cols: number };
