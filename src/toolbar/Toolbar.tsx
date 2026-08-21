import { useEffect } from "react";
import { useSim } from "../context/SimulationContext";
import { useHistory } from "../history/HistoryContext";
import {
  useSearchRunner,
  type SearchSpeed,
} from "../algorithms/useSearchRunner";
import { usePathWalker, type WalkSpeed } from "../algorithms/usePathWalker";
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

function LogoMark() {
  return (
    <svg
      className={styles.logoMark}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
    >
      <rect
        x="0.5"
        y="0.5"
        width="27"
        height="27"
        rx="7"
        fill="#12161D"
        stroke="#242B38"
      />
      <path
        d="M6 20 L6 14 L14 14 L14 8 L22 8"
        stroke="#4CE8B8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="20" r="2.2" fill="#FF8F5C" />
      <circle cx="22" cy="8" r="2.2" fill="#4CE8B8" />
    </svg>
  );
}

export function Toolbar() {
  const { state, dispatch } = useSim();
  const history = useHistory();
  const runner = useSearchRunner();
  const walker = usePathWalker();

  const isGridEmpty =
    !state.robot &&
    !state.goal &&
    state.grid.every((row) =>
      row.every(
        (cell) => cell.type === "empty" && !cell.explored && !cell.inPath,
      ),
    );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (state.isRunning) return;
        e.preventDefault();
        history.undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history, state.isRunning]);

  const handleAlgorithmChange = (algorithm: Algorithm) => {
    runner.reset();
    dispatch({ type: "SET_ALGORITHM", algorithm });
  };

  const handleClearEndpoints = () => {
    history.checkpoint();
    runner.reset();
    dispatch({ type: "CLEAR_ENDPOINTS" });
  };

  const handleClearGrid = () => {
    history.checkpoint();
    runner.reset();
    dispatch({ type: "CLEAR_GRID" });
  };

  return (
    <div className={styles.toolbar}>
      <header className={styles.header}>
        <LogoMark />
        <div className={styles.headerText}>
          <span className={styles.brand}>DryRun</span>
          <span className={styles.tagline}>robotics sandbox</span>
        </div>
      </header>

      <div className={styles.body}>
        {/* ---- EDIT ---- */}
        <section className={styles.card}>
          <h2 className={styles.cardLabel}>Draw Mode</h2>
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

          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.editBtn}
              disabled={state.isRunning || !history.canUndo}
              onClick={history.undo}
              title="Undo (Ctrl+Z)"
            >
              Undo
            </button>
            <button
              type="button"
              className={styles.editBtn}
              disabled={state.isRunning || (!state.robot && !state.goal)}
              onClick={handleClearEndpoints}
            >
              Clear Points
            </button>
            <button
              type="button"
              className={`${styles.editBtn} ${styles.editBtnDanger}`}
              disabled={state.isRunning || isGridEmpty}
              onClick={handleClearGrid}
            >
              Clear Grid
            </button>
          </div>
        </section>

        {/* ---- ALGORITHM ---- */}
        <section className={styles.card}>
          <h2 className={styles.cardLabel}>Algorithm</h2>
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
              ? "A* explores toward the goal first, using distance as a guide - usually faster, fewer cells checked."
              : "Dijkstra explores evenly in all directions - slower, but guaranteed shortest path even with no sense of direction."}
          </p>
        </section>

        {/* ---- SEARCH ---- */}
        <section className={styles.card}>
          <h2 className={styles.cardLabel}>Search</h2>
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
        </section>

        {/* ---- WALK ---- */}
        <section className={styles.card}>
          <h2 className={styles.cardLabel}>Robot</h2>
          <div className={styles.runControls}>
            {walker.isWalking ? (
              <button
                type="button"
                className={styles.controlBtn}
                onClick={walker.pause}
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.controlBtn} ${styles.controlBtnPrimary}`}
                disabled={!walker.canWalk}
                onClick={walker.play}
              >
                Walk
              </button>
            )}
            <button
              type="button"
              className={styles.controlBtn}
              disabled={!walker.canWalk || walker.isWalking}
              onClick={walker.step}
            >
              Step
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              disabled={!walker.canWalk}
              onClick={walker.reset}
            >
              Reset
            </button>
          </div>

          <select
            className={styles.speedSelect}
            value={walker.speed}
            disabled={walker.isWalking}
            onChange={(e) => walker.setSpeed(e.target.value as WalkSpeed)}
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </section>
      </div>

      <div className={styles.statusBar}>
        <span
          className={`${styles.statusDot} ${
            state.isRunning || walker.isWalking ? styles.statusDotActive : ""
          }`}
        />
        <span className={styles.statusText}>{state.statusMsg}</span>
      </div>
    </div>
  );
}
