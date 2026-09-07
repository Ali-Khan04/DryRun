import type { DrawMode } from "../../types";
import { DRAW_MODES } from "../toolbarConfig";
import styles from "../Toolbar.module.css";

interface DrawModeSectionProps {
  drawMode: DrawMode;
  isRunning: boolean;
  canUndo: boolean;
  hasEndpoints: boolean;
  isGridEmpty: boolean;
  onDrawModeChange: (mode: DrawMode) => void;
  onUndo: () => void;
  onClearEndpoints: () => void;
  onClearGrid: () => void;
}

export function DrawModeSection({
  drawMode,
  isRunning,
  canUndo,
  hasEndpoints,
  isGridEmpty,
  onDrawModeChange,
  onUndo,
  onClearEndpoints,
  onClearGrid,
}: DrawModeSectionProps) {
  return (
    <section className={styles.card} data-tour="draw-mode">
      <h2 className={styles.cardLabel}>Draw Mode</h2>
      <div className={styles.modeGroup} role="group" aria-label="Draw mode">
        {DRAW_MODES.map(({ mode, label, swatchClass }) => (
          <button
            key={mode}
            type="button"
            disabled={isRunning}
            className={`${styles.modeBtn} ${
              drawMode === mode ? styles.modeBtnActive : ""
            }`}
            aria-pressed={drawMode === mode}
            onClick={() => onDrawModeChange(mode)}
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
          disabled={isRunning || !canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          type="button"
          className={styles.editBtn}
          disabled={isRunning || !hasEndpoints}
          onClick={onClearEndpoints}
        >
          Clear Points
        </button>
        <button
          type="button"
          className={`${styles.editBtn} ${styles.editBtnDanger}`}
          disabled={isRunning || isGridEmpty}
          onClick={onClearGrid}
        >
          Clear Grid
        </button>
      </div>
    </section>
  );
}
