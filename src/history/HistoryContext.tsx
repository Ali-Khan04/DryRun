import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSim } from "../context/SimulationContext";
import type { GridSnapshot, RobotState, GridPos, Cell } from "../types";

const MAX_HISTORY = 20;

interface HistoryCtx {
  checkpoint: () => void;
  undo: () => void;
  canUndo: boolean;
}

const HistoryContext = createContext<HistoryCtx | null>(null);

function cloneSnapshot(
  grid: Cell[][],
  robot: RobotState | null,
  goal: GridPos | null,
): GridSnapshot {
  return {
    grid: grid.map((row) => row.map((cell) => ({ ...cell }))),
    robot: robot ? { pos: { ...robot.pos }, angleDeg: robot.angleDeg } : null,
    goal: goal ? { ...goal } : null,
  };
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useSim();
  // A ref, not state - pushing to it shouldn't trigger a re-render.
  // canUndo (below) is the only piece the UI actually needs to react to.
  const stackRef = useRef<GridSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Call this BEFORE a mutating action, so the stack holds "what it looked
  // like before," and undo just restores the top of the stack.
  const checkpoint = useCallback(() => {
    stackRef.current.push(cloneSnapshot(state.grid, state.robot, state.goal));
    if (stackRef.current.length > MAX_HISTORY) stackRef.current.shift();
    setCanUndo(true);
  }, [state.grid, state.robot, state.goal]);

  const undo = useCallback(() => {
    const snapshot = stackRef.current.pop();
    if (!snapshot) return;
    dispatch({ type: "RESTORE_SNAPSHOT", snapshot });
    setCanUndo(stackRef.current.length > 0);
  }, [dispatch]);

  return (
    <HistoryContext.Provider value={{ checkpoint, undo, canUndo }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used inside HistoryProvider");
  return ctx;
}
