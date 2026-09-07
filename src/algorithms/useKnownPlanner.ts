import { useCallback, useRef, useState } from 'react';
import { useSim } from '../context/SimulationContext';
import { runSearch } from './pathfinding';
import type { SearchStep } from './pathfinding';
import type { Cell, Knowledge } from '../types';

const SPEED_MS = { slow: 120, normal: 40, fast: 8 } as const;
export type PlanSpeed = keyof typeof SPEED_MS;

interface PlannerInputSnapshot {
  known: Knowledge[][];
  robotRow: number;
  robotCol: number;
  goalRow: number;
  goalCol: number;
  useHeuristic: boolean;
  rows: number;
  cols: number;
}

// Builds a search-ready grid purely from what's actually been sensed.
// Unknown cells are blocked exactly like walls - the algorithm has no
// business routing through territory nobody's confirmed. This is the one
// place "the SLAM map" actually gets handed to A*/Dijkstra; if the goal
// hasn't been sensed yet, it's blocked here too, so the search correctly
// comes back "no path" instead of fabricating one.
function buildKnownGrid(
  known: Knowledge[][],
  rows: number,
  cols: number,
): Cell[][] {
  return Array.from(
    { length: rows },
    (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        type: known[r][c] === 'free' ? 'empty' : 'wall',
        explored: false,
        inPath: false,
      })) as Cell[],
  );
}

export function useKnownPlanner() {
  const { state, dispatch } = useSim();
  const generatorRef = useRef<Generator<SearchStep, void, void> | null>(null);
  const inputRef = useRef<PlannerInputSnapshot | null>(null);
  const timerRef = useRef<number | null>(null);
  const [speed, setSpeed] = useState<PlanSpeed>('normal');
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
    if (!state.robot || !state.goal) return null;

    const { rows, cols } = state.config;
    const useHeuristic = state.algorithm === 'astar';
    const previous = inputRef.current;
    const inputsStillMatch =
      previous?.known === state.known &&
      previous.robotRow === state.robot.pos.row &&
      previous.robotCol === state.robot.pos.col &&
      previous.goalRow === state.goal.row &&
      previous.goalCol === state.goal.col &&
      previous.useHeuristic === useHeuristic &&
      previous.rows === rows &&
      previous.cols === cols;

    // A paused generator is reusable only while the map/endpoints/algorithm
    // are exactly the same. If SLAM sensed more cells (or a resize changed
    // the map dimensions), build a fresh search over the latest known map.
    if (generatorRef.current && inputsStillMatch) {
      return generatorRef.current;
    }

    const knownGrid = buildKnownGrid(state.known, rows, cols);
    generatorRef.current = runSearch(
      knownGrid,
      state.robot.pos,
      state.goal,
      useHeuristic,
    );
    inputRef.current = {
      known: state.known,
      robotRow: state.robot.pos.row,
      robotCol: state.robot.pos.col,
      goalRow: state.goal.row,
      goalCol: state.goal.col,
      useHeuristic,
      rows,
      cols,
    };
    return generatorRef.current;
  }, [state.known, state.robot, state.goal, state.algorithm, state.config]);

  const advance = useCallback((): boolean => {
    const gen = ensureGenerator();
    if (!gen) {
      dispatch({
        type: 'SET_STATUS',
        msg: 'Place a Start and a Goal first, both are needed before planning a route.',
        tone: 'warn',
      });
      return true;
    }

    const result = gen.next();
    if (result.done === true) {
      generatorRef.current = null;
      inputRef.current = null;
      return true;
    }
    const value = result.value;

    if (value.kind === 'visit') {
      dispatch({ type: 'MARK_EXPLORED', cells: [value.pos] });
    } else if (value.kind === 'done') {
      dispatch({ type: 'MARK_PATH', cells: value.path });
      dispatch({ type: 'SET_PATH', path: value.path });
      dispatch({
        type: 'SET_STATUS',
        msg: `Route planned: ${value.path.length} cells, using only what's been sensed. Hit Walk in Robot to send it to Nav2 for execution.`,
        tone: 'success',
      });
      generatorRef.current = null;
      inputRef.current = null;
      return true;
    } else if (value.kind === 'no-path') {
      dispatch({
        type: 'SET_STATUS',
        msg: 'No route in the known map yet, the goal may be undiscovered, or the known path is blocked. Go build more of the map first.',
        tone: 'warn',
      });
      generatorRef.current = null;
      inputRef.current = null;
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
      dispatch({
        type: 'SET_STATUS',
        msg: 'Place a Start and a Goal first - both are needed before planning a route.',
        tone: 'warn',
      });
      return;
    }
    dispatch({
      type: 'SET_STATUS',
      msg: `Planning a route with ${state.algorithm === 'astar' ? 'A*' : 'Dijkstra'} over just the map that's been sensed so far...`,
      tone: 'progress',
    });
    setIsPlanning(true);
    dispatch({ type: 'SET_RUNNING', val: true });
    stopTimer();
    timerRef.current = window.setInterval(() => {
      if (advance()) {
        stopTimer();
        setIsPlanning(false);
        dispatch({ type: 'SET_RUNNING', val: false });
      }
    }, SPEED_MS[speed]);
  }, [advance, dispatch, ensureGenerator, speed, stopTimer, state.algorithm]);

  const pause = useCallback(() => {
    stopTimer();
    setIsPlanning(false);
    dispatch({ type: 'SET_RUNNING', val: false });
  }, [dispatch, stopTimer]);

  const reset = useCallback(() => {
    stopTimer();
    generatorRef.current = null;
    inputRef.current = null;
    setIsPlanning(false);
    dispatch({ type: 'SET_RUNNING', val: false });
    dispatch({ type: 'RESET_SEARCH' });
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
