import { InfoButton } from "../components/InfoButton";
import { SpeedSelect } from "../components/SpeedSelect";
import type { WalkerControls } from "../toolbarTypes";
import styles from "../Toolbar.module.css";

interface RobotSectionProps {
  walker: WalkerControls;
  openInfo: string | null;
  onToggleInfo: (id: string) => void;
}

export function RobotSection({
  walker,
  openInfo,
  onToggleInfo,
}: RobotSectionProps) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardLabel} style={{ flex: 1 }}>
          Robot
        </h2>
        <InfoButton
          id="robot"
          label="What does Walk do?"
          openId={openInfo}
          onToggle={onToggleInfo}
        >
          Moves the robot step by step along the most recently computed path,
          whichever mode produced it.
        </InfoButton>
      </div>
      <div className={styles.runControls}>
        {walker.isWalking ? (
          <button type="button" className={styles.controlBtn} onClick={walker.pause}>
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

      <SpeedSelect
        value={walker.speed}
        disabled={walker.isWalking}
        onChange={walker.setSpeed}
        ariaLabel="Robot walking speed"
      />
    </section>
  );
}
