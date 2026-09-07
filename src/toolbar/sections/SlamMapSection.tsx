import { InfoButton } from "../components/InfoButton";
import { SpeedSelect } from "../components/SpeedSelect";
import type { ExploreControls } from "../toolbarTypes";
import styles from "../Toolbar.module.css";

interface SlamMapSectionProps {
  explorer: ExploreControls;
  openInfo: string | null;
  onToggleInfo: (id: string) => void;
  onUseMap: () => void;
}

export function SlamMapSection({
  explorer,
  openInfo,
  onToggleInfo,
  onUseMap,
}: SlamMapSectionProps) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardLabel} style={{ flex: 1 }}>
          Build Map
        </h2>
        <InfoButton
          id="slam-map"
          label="What does Build Map do?"
          openId={openInfo}
          onToggle={onToggleInfo}
        >
          Drives the robot around, sensing as it goes and filling in the known
          map - exactly like a real SLAM front-end would. Nothing is planned
          yet; this just reveals territory for the planner below to use.
        </InfoButton>
      </div>
      <div className={styles.runControls}>
        {explorer.isExploring ? (
          <button
            type="button"
            className={styles.controlBtn}
            onClick={onUseMap}
            title="Stop sensing and freeze the map for planning"
          >
            Use This Map
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.controlBtn} ${styles.controlBtnPrimary}`}
            disabled={!explorer.canExplore}
            onClick={explorer.play}
          >
            Sense
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
        ariaLabel="Map-building speed"
      />
      <p className={styles.hintCompact}>
        Place start/goal before or after this - pause any time to freeze the map
        and plan with what's revealed so far.
      </p>
    </section>
  );
}
