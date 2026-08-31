import { useState } from "react";
import { useSim } from "../context/SimulationContext";
import styles from "./CanvasLegend.module.css";

interface LegendRow {
  id: string;
  label: string;
  swatchClass: string;
}

const BASE_ROWS: LegendRow[] = [
  { id: "start", label: "Start", swatchClass: styles.swatchStart },
  { id: "goal", label: "Goal", swatchClass: styles.swatchGoal },
  { id: "robot", label: "Robot", swatchClass: styles.swatchRobot },
  { id: "wall", label: "Wall", swatchClass: styles.swatchWall },
  { id: "explored", label: "Explored", swatchClass: styles.swatchExplored },
  { id: "path", label: "Shortest path", swatchClass: styles.swatchPath },
];

const FOG_ROW: LegendRow = {
  id: "fog",
  label: "Not sensed yet",
  swatchClass: styles.swatchFog,
};

// Persistent, collapsible key for what's on the grid. Sits on the canvas
// itself rather than in the toolbar, since that's where the colors are
// actually being looked at.
export function CanvasLegend() {
  const { state } = useSim();
  const [collapsed, setCollapsed] = useState(false);

  // Fog of war only exists in the sense-driven modes - showing it in
  // Global mode would describe a color nobody will ever see.
  const showsFog =
    state.planningMode === "reactive" || state.planningMode === "slam";
  const rows = showsFog ? [...BASE_ROWS, FOG_ROW] : BASE_ROWS;

  return (
    <div className={styles.legend} data-tour="legend">
      <button
        type="button"
        className={styles.header}
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className={styles.headerLabel}>Legend</span>
        <span
          className={`${styles.chevron} ${collapsed ? "" : styles.chevronOpen}`}
          aria-hidden="true"
        />
      </button>
      {!collapsed && (
        <ul className={styles.list}>
          {rows.map((row) => (
            <li key={row.id} className={styles.row}>
              <span className={`${styles.swatch} ${row.swatchClass}`} />
              <span className={styles.label}>{row.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
