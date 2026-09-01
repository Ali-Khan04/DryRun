import { useCallback, useRef, useState } from "react";
import { useSim } from "../context/SimulationContext";

const SPEED_MS = { slow: 200, normal: 90, fast: 30 } as const;
export type WalkSpeed = keyof typeof SPEED_MS;

// Angle from one grid cell to the next, in degrees. Matches the convention
// renderer.ts already uses (0deg = facing +col/right, 90deg = facing +row/down).
function angleBetween(
  from: { row: number; col: number },
  to: { row: number; col: number },
) {
  const dRow = to.row - from.row;
  const dCol = to.col - from.col;
  return (Math.atan2(dRow, dCol) * 180) / Math.PI;
}

export function usePathWalker() {
  const { state, dispatch } = useSim();
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const [speed, setSpeed] = useState<WalkSpeed>("normal");
  const [isWalking, setIsWalking] = useState(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Move the robot to path[indexRef.current], facing the direction it just came from
  const advance = useCallback((): boolean => {
    const path = state.path;
    if (!path || path.length === 0) return true;

    const i = indexRef.current;
    if (i >= path.length) return true;

    const pos = path[i];
    const prev = i > 0 ? path[i - 1] : pos;
    const angleDeg = angleBetween(prev, pos);

    dispatch({ type: "MOVE_ROBOT", pos, angleDeg });
    indexRef.current += 1;

    return indexRef.current >= path.length;
  }, [state.path, dispatch]);

  const step = useCallback(() => {
    stopTimer();
    setIsWalking(false);
    advance();
  }, [advance, stopTimer]);

  const play = useCallback(() => {
    if (!state.path || state.path.length === 0) return;
    dispatch({
      type: "SET_STATUS",
      msg: "Nav2 is driving the robot along the planned route, this is what a real robot does after A*/Dijkstra hands it a path.",
      tone: "progress",
    });
    setIsWalking(true);
    dispatch({ type: "SET_RUNNING", val: true });
    stopTimer();
    timerRef.current = window.setInterval(() => {
      if (advance()) {
        stopTimer();
        setIsWalking(false);
        dispatch({ type: "SET_RUNNING", val: false });
        dispatch({
          type: "SET_STATUS",
          msg: "Arrived! Nav2 followed the planned route all the way to the goal.",
          tone: "success",
        });
      }
    }, SPEED_MS[speed]);
  }, [advance, dispatch, speed, state.path, stopTimer]);

  const pause = useCallback(() => {
    stopTimer();
    setIsWalking(false);
    dispatch({ type: "SET_RUNNING", val: false });
    dispatch({
      type: "SET_STATUS",
      msg: "Walk paused. Resume, step through one move at a time, or reset to start the route over.",
      tone: "guide",
    });
  }, [dispatch, stopTimer]);

  // place the robot back to the start of the path (index 0), for replaying
  const reset = useCallback(() => {
    stopTimer();
    setIsWalking(false);
    dispatch({ type: "SET_RUNNING", val: false });
    indexRef.current = 0;
    const path = state.path;
    if (path && path.length > 0) {
      dispatch({ type: "MOVE_ROBOT", pos: path[0], angleDeg: 0 });
    }
  }, [dispatch, state.path, stopTimer]);

  return {
    play,
    pause,
    step,
    reset,
    speed,
    setSpeed,
    isWalking,
    canWalk: !!state.path && state.path.length > 0,
  };
}
