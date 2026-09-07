import type { PlanningMode } from "../../types";
import { PLANNING_MODES, planningModeLabel } from "../toolbarConfig";
import styles from "../Toolbar.module.css";

interface PlanningModeSectionProps {
  planningMode: PlanningMode;
  isRunning: boolean;
  onModeChange: (mode: PlanningMode) => void;
  onShowInfo: () => void;
}

export function PlanningModeSection({
  planningMode,
  isRunning,
  onModeChange,
  onShowInfo,
}: PlanningModeSectionProps) {
  const activeMode = PLANNING_MODES.find((mode) => mode.value === planningMode);
  const activeModeLabel = planningModeLabel(planningMode);

  return (
    <section className={styles.card} data-tour="planning-mode">
      <h2 className={styles.cardLabel}>Mode</h2>
      <div className={styles.tabGroup} role="group" aria-label="Planning mode">
        {PLANNING_MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            disabled={isRunning}
            className={`${styles.tabBtn} ${
              planningMode === value ? styles.tabBtnActive : ""
            }`}
            aria-pressed={planningMode === value}
            onClick={() => onModeChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.modeBlurbRow}>
        <p className={styles.hintCompact}>{activeMode?.blurb}</p>
        <button type="button" className={styles.linkBtn} onClick={onShowInfo}>
          How {activeModeLabel} mode works →
        </button>
      </div>
    </section>
  );
}
