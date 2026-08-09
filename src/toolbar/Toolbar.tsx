import { useSim } from "../context/SimulationContext";
import type { DrawMode } from "../types";
import styles from "./Toolbar.module.css";

const MODES: { mode: DrawMode; label: string; swatchClass: string }[] = [
  { mode: "wall", label: "Wall", swatchClass: styles.swatchWall },
  { mode: "erase", label: "Erase", swatchClass: styles.swatchErase },
  { mode: "start", label: "Start", swatchClass: styles.swatchStart },
  { mode: "goal", label: "Goal", swatchClass: styles.swatchGoal },
];

export function Toolbar() {
  const { state, dispatch } = useSim();

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

      <button
        type="button"
        className={styles.clearBtn}
        onClick={() => dispatch({ type: "CLEAR_GRID" })}
      >
        Clear Grid
      </button>

      <div className={styles.status}>{state.statusMsg}</div>
    </div>
  );
}
