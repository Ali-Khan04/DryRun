import { useCallback, useRef, useState } from "react";
import { useSim } from "../context/SimulationContext";
import { findCell } from "../utils/grid";
import { explore } from "./explore";
import type { ExploreStep } from "./explore";

const SPEED_MS = { slow: 260, normal: 120, fast: 40 } as const;
export type ExploreSpeed = keyof typeof SPEED_MS;

export function useExplorer() {
  const { state, dispatch } = useSim();
  const generatorRef = useRef<Generator<ExploreStep, void, void> | null>(null);
  const timerRef = useRef<number | null>(null);
  const [speed, setSpeed] = useState<ExploreSpeed>("normal");
  const [isExploring, setIsExploring] = useState(false);

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
      dispatch({ type: "SET_STATUS", msg: "Place a start and a goal first." });
      return true;
    }

    const { value, done } = gen.next();
    if (done) return true;

    if (value.kind === "sense") {
      dispatch({ type: "SENSE_UPDATE", reading: value.reading });
    } else if (value.kind === "move") {
      dispatch({
        type: "MOVE_ROBOT",
        pos: value.pos,
        angleDeg: value.angleDeg,
      });
    } else if (value.kind === "reached") {
      dispatch({
        type: "SET_STATUS",
        msg: "Goal reached - found entirely through sensing, no map given.",
      });
      return true;
    } else if (value.kind === "stuck") {
      dispatch({
        type: "SET_STATUS",
        msg: "No reachable path found - goal may be walled off.",
      });
      return true;
    }

    return false;
  }, [ensureGenerator, dispatch]);

  const step = useCallback(() => {
    stopTimer();
    setIsExploring(false);
    advance();
  }, [advance, stopTimer]);

  const play = useCallback(() => {
    if (!ensureGenerator()) {
      dispatch({ type: "SET_STATUS", msg: "Place a start and a goal first." });
      return;
    }
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
  }, [advance, dispatch, ensureGenerator, speed, stopTimer]);

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
