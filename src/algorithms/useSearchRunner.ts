import { useCallback, useRef, useState } from "react";
import { useSim } from "../context/SimulationContext";
import { runSearch } from "./pathfinding";
import type { SearchStep } from "./pathfinding";

const SPEED_MS = { slow: 120, normal: 40, fast: 8 } as const;
export type SearchSpeed = keyof typeof SPEED_MS;

export function useSearchRunner() {
  const { state, dispatch } = useSim();
  const generatorRef = useRef<Generator<SearchStep, void, void> | null>(null);
  const timerRef = useRef<number | null>(null);
  const [speed, setSpeed] = useState<SearchSpeed>("normal");

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const ensureGenerator = useCallback(() => {
    if (generatorRef.current) return generatorRef.current;
    if (!state.robot || !state.goal) return null;

    generatorRef.current = runSearch(
      state.grid,
      state.robot.pos,
      state.goal,
      state.algorithm === "astar",
    );
    return generatorRef.current;
  }, [state.grid, state.robot, state.goal, state.algorithm]);

  // Pull one step out of the generator and dispatch the matching action.
  // Returns true when the search is finished (found, blocked, or no path).
  const advance = useCallback((): boolean => {
    const gen = ensureGenerator();
    if (!gen) {
      dispatch({
        type: "SET_STATUS",
        msg: "Place a Start and a Goal first, both are needed before planning a route.",
        tone: "warn",
      });
      return true;
    }

    const { value, done } = gen.next();
    if (done) return true;

    if (value.kind === "visit") {
      dispatch({ type: "MARK_EXPLORED", cells: [value.pos] });
      dispatch({
        type: "SET_CALLOUT",
        pos: value.pos,
        text:
          state.algorithm === "astar"
            ? "A* evaluating:  cost so far + distance to goal"
            : "Dijkstra evaluating: cost so far only",
        tone: "info",
      });
    } else if (value.kind === "done") {
      dispatch({ type: "MARK_PATH", cells: value.path });
      dispatch({ type: "SET_PATH", path: value.path });
      dispatch({
        type: "SET_STATUS",
        msg: `Route found - ${value.path.length} cells. Hit Walk in Robot to send it to Nav2 for execution.`,
        tone: "success",
      });
      dispatch({
        type: "SET_CALLOUT",
        pos: value.path[value.path.length - 1],
        text: `Path found - ${value.path.length} cells`,
        tone: "success",
      });
      return true;
    } else if (value.kind === "no-path") {
      dispatch({
        type: "SET_STATUS",
        msg: "No route exists between Start and Goal!, try clearing a wall or moving one of them.",
        tone: "warn",
      });
      if (state.robot) {
        dispatch({
          type: "SET_CALLOUT",
          pos: state.robot.pos,
          text: "No path exists between start and goal",
          tone: "warn",
        });
      }
      return true;
    }

    return false;
  }, [ensureGenerator, dispatch, state.algorithm, state.robot]);

  const step = useCallback(() => {
    stopTimer();
    dispatch({ type: "SET_RUNNING", val: false });
    advance();
  }, [advance, dispatch, stopTimer]);

  const play = useCallback(() => {
    if (!ensureGenerator()) {
      dispatch({
        type: "SET_STATUS",
        msg: "Place a Start and a Goal first, both are needed before planning a route.",
        tone: "warn",
      });
      return;
    }
    dispatch({
      type: "SET_STATUS",
      msg: `Searching for the shortest route with ${state.algorithm === "astar" ? "A*" : "Dijkstra"} the whole map is already known.`,
      tone: "progress",
    });
    dispatch({ type: "SET_RUNNING", val: true });
    stopTimer();
    timerRef.current = window.setInterval(() => {
      if (advance()) {
        stopTimer();
        dispatch({ type: "SET_RUNNING", val: false });
      }
    }, SPEED_MS[speed]);
  }, [advance, dispatch, ensureGenerator, speed, stopTimer, state.algorithm]);

  const pause = useCallback(() => {
    stopTimer();
    dispatch({ type: "SET_RUNNING", val: false });
  }, [dispatch, stopTimer]);

  const reset = useCallback(() => {
    stopTimer();
    generatorRef.current = null;
    dispatch({ type: "SET_RUNNING", val: false });
    dispatch({ type: "RESET_SEARCH" });
  }, [dispatch, stopTimer]);

  return {
    play,
    pause,
    step,
    reset,
    speed,
    setSpeed,
    isRunning: state.isRunning,
  };
}
