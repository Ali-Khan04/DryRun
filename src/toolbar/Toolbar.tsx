import { useSim } from "../context/SimulationContext";
import {
  useSearchRunner,
  type SearchSpeed,
} from "../algorithms/useSearchRunner";
import type { DrawMode, Algorithm } from "../types";
import styles from "./Toolbar.module.css";

const MODES: { mode: DrawMode; label: string; swatchClass: string }[] = [
  { mode: "wall", label: "Wall", swatchClass: styles.swatchWall },
  { mode: "erase", label: "Erase", swatchClass: styles.swatchErase },
  { mode: "start", label: "Start", swatchClass: styles.swatchStart },
  { mode: "goal", label: "Goal", swatchClass: styles.swatchGoal },
];

const ALGORITHMS: { value: Algorithm; label: string }[] = [
  { value: "astar", label: "A*" },
  { value: "dijkstra", label: "Dijkstra" },
];

export function Toolbar() {
  const { state, dispatch } = useSim();
  const runner = useSearchRunner();

  const handleAlgorithmChange = (algorithm: Algorithm) => {
    runner.reset();
    dispatch({ type: "SET_ALGORITHM", algorithm });
  };

  const handleClear = () => {
    runner.reset();
    dispatch({ type: "CLEAR_GRID" });
  };

  return (
    <div className={styles.toolbar}>
      <span className={styles.brand}>DryRun</span>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Draw Mode</span>
        <div className={styles.modeGroup} role="group" aria-label="Draw mode">
          {MODES.map(({ mode, label, swatchClass }) => (
            <button
              key={mode}
              type="button"
              disabled={state.isRunning}
              className={`${styles.modeBtn} ${
                state.drawMode === mode ? styles.modeBtnActive : ""
              }`}
              aria-pressed={state.drawMode === mode}
              onClick={() => dispatch({ type: "SET_DRAW_MODE", mode })}
            >
              <span className={`${styles.swatch} ${swatchClass}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Algorithm</span>
        <div className={styles.modeGroup} role="group" aria-label="Algorithm">
          {ALGORITHMS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              disabled={state.isRunning}
              className={`${styles.modeBtn} ${
                state.algorithm === value ? styles.modeBtnActive : ""
              }`}
              aria-pressed={state.algorithm === value}
              onClick={() => handleAlgorithmChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className={styles.hint}>
          {state.algorithm === "astar"
            ? "A* explores toward the goal first, using distance as a guide which is usually faster as fewer cells are checked."
            : "Dijkstra explores evenly in all directions making it slower, but guaranteed shortest path even with no sense of direction."}
        </p>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Search</span>
        <div className={styles.runControls}>
          {state.isRunning ? (
            <button
              type="button"
              className={styles.controlBtn}
              onClick={runner.pause}
            >
              Pause
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.controlBtn} ${styles.controlBtnPrimary}`}
              onClick={runner.play}
            >
              Run
            </button>
          )}
          <button
            type="button"
            className={styles.controlBtn}
            disabled={state.isRunning}
            onClick={runner.step}
          >
            Step
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={runner.reset}
          >
            Reset
          </button>
        </div>

        <select
          className={styles.speedSelect}
          value={runner.speed}
          disabled={state.isRunning}
          onChange={(e) => runner.setSpeed(e.target.value as SearchSpeed)}
        >
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
      </div>

      <button
        type="button"
        className={styles.clearBtn}
        disabled={state.isRunning}
        onClick={handleClear}
      >
        Clear Grid
      </button>

      <div className={styles.status}>{state.statusMsg}</div>
    </div>
  );
}
