import { useCallback, useRef, useState } from "react";
import { useSim } from "../context/SimulationContext";
import { runSearch } from "./pathfinding";
import type { SearchStep } from "./pathfinding";
import type { Cell, Knowledge } from "../types";

const SPEED_MS = { slow: 120, normal: 40, fast: 8 } as const;
export type PlanSpeed = keyof typeof SPEED_MS;

// Builds a search-ready grid purely from what's actually been sensed.
// Unknown cells are blocked exactly like walls - the algorithm has no
// business routing through territory nobody's confirmed. This is the one
// place "the SLAM map" actually gets handed to A*/Dijkstra; if the goal
// hasn't been sensed yet, it's blocked here too, so the search correctly
// comes back "no path" instead of fabricating one.
function buildKnownGrid(known: Knowledge[][], rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      type: known[r][c] === "free" ? "empty" : "wall",
      explored: false,
      inPath: false,
    })) as Cell[],
  );
}

export function useKnownPlanner() {
  const { state, dispatch } = useSim();
  const generatorRef = useRef<Generator<SearchStep, void, void> | null>(null);
  const timerRef = useRef<number | null>(null);
  const [speed, setSpeed] = useState<PlanSpeed>("normal");
  const [isPlanning, setIsPlanning] = useState(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Plans from the robot's CURRENT position, not the original start - a
  // real robot replans from wherever it actually is, using whatever it's
  // discovered so far, whether or not it ever reached the goal.
  const ensureGenerator = useCallback(() => {
    if (generatorRef.current) return generatorRef.current;
    if (!state.robot || !state.goal) return null;

    const { rows, cols } = state.config;
    const knownGrid = buildKnownGrid(state.known, rows, cols);

    generatorRef.current = runSearch(
      knownGrid,
      state.robot.pos,
      state.goal,
      state.algorithm === "astar",
    );
    return generatorRef.current;
  }, [state.known, state.robot, state.goal, state.algorithm, state.config]);

  const advance = useCallback((): boolean => {
    const gen = ensureGenerator();
    if (!gen) {
      dispatch({ type: "SET_STATUS", msg: "Place a start and a goal first." });
      return true;
    }

    const { value, done } = gen.next();
    if (done) return true;

    if (value.kind === "visit") {
      dispatch({ type: "MARK_EXPLORED", cells: [value.pos] });
    } else if (value.kind === "done") {
      dispatch({ type: "MARK_PATH", cells: value.path });
      dispatch({ type: "SET_PATH", path: value.path });
      dispatch({
        type: "SET_STATUS",
        msg: `Path found from known map - ${value.path.length} cells.`,
      });
      return true;
    } else if (value.kind === "no-path") {
      dispatch({
        type: "SET_STATUS",
        msg: "No path in the known map yet - goal may be undiscovered or blocked.",
      });
      return true;
    }

    return false;
  }, [ensureGenerator, dispatch]);

  const step = useCallback(() => {
    stopTimer();
    setIsPlanning(false);
    advance();
  }, [advance, stopTimer]);

  const play = useCallback(() => {
    if (!ensureGenerator()) {
      dispatch({ type: "SET_STATUS", msg: "Place a start and a goal first." });
      return;
    }
    setIsPlanning(true);
    dispatch({ type: "SET_RUNNING", val: true });
    stopTimer();
    timerRef.current = window.setInterval(() => {
      if (advance()) {
        stopTimer();
        setIsPlanning(false);
        dispatch({ type: "SET_RUNNING", val: false });
      }
    }, SPEED_MS[speed]);
  }, [advance, dispatch, ensureGenerator, speed, stopTimer]);

  const pause = useCallback(() => {
    stopTimer();
    setIsPlanning(false);
    dispatch({ type: "SET_RUNNING", val: false });
  }, [dispatch, stopTimer]);

  const reset = useCallback(() => {
    stopTimer();
    generatorRef.current = null;
    setIsPlanning(false);
    dispatch({ type: "SET_RUNNING", val: false });
    dispatch({ type: "RESET_SEARCH" }); // clears explored/inPath + path - safe, doesn't touch `known`
  }, [dispatch, stopTimer]);

  return {
    play,
    pause,
    step,
    reset,
    speed,
    setSpeed,
    isPlanning,
    canPlan: !!state.robot && !!state.goal,
  };
}
