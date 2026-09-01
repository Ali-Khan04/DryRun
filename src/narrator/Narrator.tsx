import { useSim } from "../context/SimulationContext";
import styles from "./Narrator.module.css";

const TONE_LABEL: Record<string, string> = {
  guide: "Next step",
  progress: "In progress",
  success: "Done",
  warn: "Heads up",
};

// A full-width, hard-to-miss narration bar docked above the canvas. The
// toolbar's small status line still exists for a quick glance, but this is
// the one place the app actually explains, in plain language, what's
// happening and what to do next - for every mode, not just SLAM.
export function Narrator() {
  const { state } = useSim();
  const tone = state.statusTone;

  return (
    <div className={`${styles.narrator} ${styles[tone]}`} role="status">
      <span className={styles.indicator} aria-hidden="true" />
      <span className={styles.label}>{TONE_LABEL[tone]}</span>
      <span className={styles.message}>{state.statusMsg}</span>
    </div>
  );
}
