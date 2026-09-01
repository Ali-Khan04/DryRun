import { useCallback, useRef, useState } from "react";
import { useSim } from "../context/SimulationContext";
import { findCell } from "../utils/grid";
import { explore } from "./explore";
import type { ExploreStep } from "./explore";
import type { Knowledge, SensorReading } from "../types";

const SPEED_MS = { slow: 260, normal: 120, fast: 40 } as const;
export type ExploreSpeed = keyof typeof SPEED_MS;

// How much of the grid has been sensed, counting this step's freshly
// revealed cells even before the SENSE_UPDATE dispatch above has applied -
// otherwise the percentage would always lag one step behind what's on
// screen. Used purely for the narrator's "N% of the grid sensed" line.
function knownCoveragePercent(
  known: Knowledge[][],
  reading: SensorReading,
  rows: number,
  cols: number,
): number {
  const seen = new Set<string>();
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (known[r][c] !== "unknown") {
        count++;
        seen.add(`${r},${c}`);
      }
    }
  }
  for (const cell of [...reading.freeCells, ...reading.hits]) {
    const key = `${cell.row},${cell.col}`;
    if (!seen.has(key)) {
      count++;
      seen.add(key);
    }
  }
  return Math.round((count / (rows * cols)) * 100);
}

export function useExplorer() {
  const { state, dispatch } = useSim();
  const generatorRef = useRef<Generator<ExploreStep, void, void> | null>(null);
  const timerRef = useRef<number | null>(null);
  const [speed, setSpeed] = useState<ExploreSpeed>("normal");
  const [isExploring, setIsExploring] = useState(false);
  const isSlam = state.planningMode === "slam";

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const ensureGenerator = useCallback(() => {
    if (generatorRef.current) return generatorRef.current;
    if (!state.robot || !state.goal) return null;

    generatorRef.current = explore(
      state.grid,
      state.robot.pos,
      state.goal,
      state.sensorMode,
    );
    return generatorRef.current;
  }, [state.grid, state.robot, state.goal, state.sensorMode]);

  const advance = useCallback((): boolean => {
    const gen = ensureGenerator();
    if (!gen) {
      dispatch({
        type: "SET_STATUS",
        msg: "Place a Start and a Goal first - both are needed before the robot can sense anything.",
        tone: "warn",
      });
      return true;
    }

    const { value, done } = gen.next();
    if (done) return true;

    if (value.kind === "sense") {
      dispatch({ type: "SENSE_UPDATE", reading: value.reading });
      dispatch({
        type: "SET_CALLOUT",
        pos: value.reading.origin,
        text:
          state.sensorMode === "lidar"
            ? "LiDAR sweep: full 360deg scan "
            : "Ultrasonic scan: exploring unknown territory",
        tone: "info",
      });

      if (isSlam) {
        const { rows, cols } = state.config;
        const pct = knownCoveragePercent(
          state.known,
          value.reading,
          rows,
          cols,
        );
        dispatch({
          type: "SET_STATUS",
          msg: `Building the map - ${pct}% of the grid sensed so far. Keep going, or hit "Use This Map" to stop here and plan with what's revealed.`,
          tone: "progress",
        });
      } else {
        dispatch({
          type: "SET_STATUS",
          msg: "Exploring - sensing and deciding where to go, one step at a time, with no map given.",
          tone: "progress",
        });
      }
    } else if (value.kind === "move") {
      dispatch({
        type: "MOVE_ROBOT",
        pos: value.pos,
        angleDeg: value.angleDeg,
      });
      dispatch({
        type: "SET_CALLOUT",
        pos: value.pos,
        text:
          value.reason === "goal"
            ? "Goal is within the known map - heading there"
            : value.sawObstacle
              ? "Obstacle nearby: rerouting around it"
              : "Nothing nearby: moving to unexplored area",
        tone: "info",
      });
    } else if (value.kind === "reached") {
      dispatch({
        type: "SET_STATUS",
        msg: isSlam
          ? "Goal reached and map learned! You can now add obstacles or set new Start and Goal points. The robot will use shortest-path planning to navigate the known map."
          : "Goal reached! Found entirely through live sensing. ",
        tone: "success",
      });
      if (state.robot) {
        dispatch({
          type: "SET_CALLOUT",
          pos: state.robot.pos,
          text: "Reached the goal!",
          tone: "success",
        });
      }
      return true;
    } else if (value.kind === "stuck") {
      dispatch({
        type: "SET_STATUS",
        msg: isSlam
          ? "Stuck! the robot explored everywhere it could reach and never found a way to the goal. It may be walled off."
          : "No reachable path found! The goal may be walled off.",
        tone: "warn",
      });
      if (state.robot) {
        dispatch({
          type: "SET_CALLOUT",
          pos: state.robot.pos,
          text: "Stuck! no reachable path found",
          tone: "warn",
        });
      }
      return true;
    }

    return false;
  }, [
    ensureGenerator,
    dispatch,
    state.sensorMode,
    state.robot,
    state.known,
    state.config,
    isSlam,
  ]);

  const step = useCallback(() => {
    stopTimer();
    setIsExploring(false);
    advance();
  }, [advance, stopTimer]);

  const play = useCallback(() => {
    if (!ensureGenerator()) {
      dispatch({
        type: "SET_STATUS",
        msg: "Place a Start and a Goal first - both are needed before the robot can sense anything.",
        tone: "warn",
      });
      return;
    }
    dispatch({
      type: "SET_STATUS",
      msg: isSlam
        ? "Building the map - sensing as the robot moves. Watch the fog clear on the grid."
        : "Exploring - the robot senses and decides where to go, one step at a time, with no map given.",
      tone: "progress",
    });
    setIsExploring(true);
    dispatch({ type: "SET_RUNNING", val: true });
    stopTimer();
    timerRef.current = window.setInterval(() => {
      if (advance()) {
        stopTimer();
        setIsExploring(false);
        dispatch({ type: "SET_RUNNING", val: false });
      }
    }, SPEED_MS[speed]);
  }, [advance, dispatch, ensureGenerator, speed, stopTimer, isSlam]);

  const pause = useCallback(() => {
    stopTimer();
    setIsExploring(false);
    dispatch({ type: "SET_RUNNING", val: false });
  }, [dispatch, stopTimer]);

  const reset = useCallback(() => {
    stopTimer();
    generatorRef.current = null;
    setIsExploring(false);
    dispatch({ type: "SET_RUNNING", val: false });
    dispatch({ type: "RESET_EXPLORE" });

    const startPos = findCell(state.grid, "start");
    if (startPos) {
      dispatch({ type: "MOVE_ROBOT", pos: startPos, angleDeg: 0 });
    }
  }, [dispatch, state.grid, stopTimer]);

  return {
    play,
    pause,
    step,
    reset,
    speed,
    setSpeed,
    isExploring,
    canExplore: !!state.robot && !!state.goal,
  };
}
