import { InfoButton } from "../components/InfoButton";
import { SpeedSelect } from "../components/SpeedSelect";
import type { ExploreControls } from "../toolbarTypes";
import styles from "../Toolbar.module.css";

interface ReactiveExploreSectionProps {
  explorer: ExploreControls;
  openInfo: string | null;
  onToggleInfo: (id: string) => void;
  onPause: () => void;
}

export function ReactiveExploreSection({
  explorer,
  openInfo,
  onToggleInfo,
  onPause,
}: ReactiveExploreSectionProps) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardLabel} style={{ flex: 1 }}>
          Explore
        </h2>
        <InfoButton
          id="explore"
          label="What does Explore do?"
          openId={openInfo}
          onToggle={onToggleInfo}
        >
          The robot senses from where it stands, then moves one cell toward the
          goal if it's already visible, or toward the nearest unexplored edge
          otherwise. Repeats until it reaches the goal or runs out of reachable
          ground.
        </InfoButton>
      </div>
      <div className={styles.runControls}>
        {explorer.isExploring ? (
          <button type="button" className={styles.controlBtn} onClick={onPause}>
            Pause
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.controlBtn} ${styles.controlBtnPrimary}`}
            disabled={!explorer.canExplore}
            onClick={explorer.play}
          >
            Explore
          </button>
        )}
        <button
          type="button"
          className={styles.controlBtn}
          disabled={!explorer.canExplore || explorer.isExploring}
          onClick={explorer.step}
        >
          Step
        </button>
        <button
          type="button"
          className={styles.controlBtn}
          disabled={!explorer.canExplore}
          onClick={explorer.reset}
        >
          Reset
        </button>
      </div>

      <SpeedSelect
        value={explorer.speed}
        disabled={explorer.isExploring}
        onChange={explorer.setSpeed}
        ariaLabel="Exploration speed"
      />
    </section>
  );
}
