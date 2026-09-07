import type { Algorithm } from "../../types";
import { InfoButton } from "../components/InfoButton";
import { SpeedSelect } from "../components/SpeedSelect";
import type { PlannerControls } from "../toolbarTypes";
import styles from "../Toolbar.module.css";

interface SlamPlanSectionProps {
  planner: PlannerControls;
  algorithm: Algorithm;
  openInfo: string | null;
  onToggleInfo: (id: string) => void;
}

export function SlamPlanSection({
  planner,
  algorithm,
  openInfo,
  onToggleInfo,
}: SlamPlanSectionProps) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardLabel} style={{ flex: 1 }}>
          Plan Path
        </h2>
        <InfoButton
          id="slam-plan"
          label="What does Plan Path do?"
          openId={openInfo}
          onToggle={onToggleInfo}
        >
          Runs {algorithm === "astar" ? "A*" : "Dijkstra"} on only what's been
          sensed so far, from the robot's current position. Unsensed cells are
          treated as blocked, so if the goal hasn't been discovered yet, this
          will come back with no path until you build more of the map above.
        </InfoButton>
      </div>
      <div className={styles.runControls}>
        {planner.isPlanning ? (
          <button type="button" className={styles.controlBtn} onClick={planner.pause}>
            Pause
          </button>
        ) : (
          <button
            type="button"
            className={`${styles.controlBtn} ${styles.controlBtnPrimary}`}
            disabled={!planner.canPlan}
            onClick={planner.play}
          >
            Plan
          </button>
        )}
        <button
          type="button"
          className={styles.controlBtn}
          disabled={!planner.canPlan || planner.isPlanning}
          onClick={planner.step}
        >
          Step
        </button>
        <button
          type="button"
          className={styles.controlBtn}
          disabled={!planner.canPlan}
          onClick={planner.reset}
        >
          Reset
        </button>
      </div>

      <SpeedSelect
        value={planner.speed}
        disabled={planner.isPlanning}
        onChange={planner.setSpeed}
        ariaLabel="Planning speed"
      />
    </section>
  );
}
