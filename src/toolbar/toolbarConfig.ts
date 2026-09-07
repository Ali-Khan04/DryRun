import type { Algorithm, DrawMode, PlanningMode, SensorMode } from "../types";
import styles from "./Toolbar.module.css";

export const DRAW_MODES: {
  mode: DrawMode;
  label: string;
  swatchClass: string;
}[] = [
  { mode: "wall", label: "Wall", swatchClass: styles.swatchWall },
  { mode: "erase", label: "Erase", swatchClass: styles.swatchErase },
  { mode: "start", label: "Start", swatchClass: styles.swatchStart },
  { mode: "goal", label: "Goal", swatchClass: styles.swatchGoal },
];

export const ALGORITHMS: { value: Algorithm; label: string }[] = [
  { value: "astar", label: "A*" },
  { value: "dijkstra", label: "Dijkstra" },
];

export const PLANNING_MODES: {
  value: PlanningMode;
  label: string;
  blurb: string;
}[] = [
  {
    value: "global",
    label: "Global",
    blurb: "Full map known up front",
  },
  {
    value: "reactive",
    label: "Reactive",
    blurb: "Senses and moves on its own",
  },
  {
    value: "slam",
    label: "SLAM",
    blurb: "Maps as it goes, then plans",
  },
];

export const ALGORITHM_INFO: Record<Algorithm, string> = {
  astar:
    "A* explores toward the goal first, using distance as a guide. Usually faster, fewer cells checked.",
  dijkstra:
    "Dijkstra explores evenly in all directions. Slower, but guaranteed shortest path even with no sense of direction.",
};

export const SENSOR_MODES: { value: SensorMode; label: string }[] = [
  { value: "lidar", label: "LiDAR" },
  { value: "ultrasonic", label: "Ultrasonic" },
];

export const SENSOR_INFO: Record<SensorMode, string> = {
  lidar:
    "Full 360° sweep every step - sees everything nearby, in every direction, at once.",
  ultrasonic:
    "Checks all 4 directions before moving - narrower field of view per glance than LiDAR.",
};

export function planningModeLabel(mode: PlanningMode): string {
  return PLANNING_MODES.find((item) => item.value === mode)?.label ?? mode;
}

export function algorithmLabel(algorithm: Algorithm): string {
  return ALGORITHMS.find((item) => item.value === algorithm)?.label ?? algorithm;
}

export function sensorModeLabel(mode: SensorMode): string {
  return SENSOR_MODES.find((item) => item.value === mode)?.label ?? mode;
}
