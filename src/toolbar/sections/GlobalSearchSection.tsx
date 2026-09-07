import type { SearchControls } from "../toolbarTypes";
import { SpeedSelect } from "../components/SpeedSelect";
import styles from "../Toolbar.module.css";

interface GlobalSearchSectionProps {
  runner: SearchControls;
}

export function GlobalSearchSection({ runner }: GlobalSearchSectionProps) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardLabel}>Search</h2>
      <div className={styles.runControls}>
        {runner.isRunning ? (
          <button type="button" className={styles.controlBtn} onClick={runner.pause}>
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
          disabled={runner.isRunning}
          onClick={runner.step}
        >
          Step
        </button>
        <button type="button" className={styles.controlBtn} onClick={runner.reset}>
          Reset
        </button>
      </div>

      <SpeedSelect
        value={runner.speed}
        disabled={runner.isRunning}
        onChange={runner.setSpeed}
        ariaLabel="Search speed"
      />
    </section>
  );
}
