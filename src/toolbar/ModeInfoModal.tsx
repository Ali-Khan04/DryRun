import { useEffect } from "react";
import type { PlanningMode } from "../types";
import styles from "./ModeInfoModal.module.css";

export type ModalKind = PlanningMode | "welcome";

interface ModalContent {
  eyebrow: string;
  title: string;
  body: string;
  steps: string[];
  tips: string[];
}

const CONTENT: Record<ModalKind, ModalContent> = {
  welcome: {
    eyebrow: "Getting started",
    title: "Welcome to DryRun",
    body: "DryRun is a sandbox for exploring how robots find their way around a space they may or may not fully know ahead of time. Draw a floor plan, place a start and goal, then pick how much information the robot gets to work with.",
    steps: [
      "Paint walls (or erase them) directly on the grid using Draw Mode.",
      "Place a Start and a Goal - they can go anywhere on the empty grid, in either order.",
      "Pick a planning mode: Global, Reactive, or SLAM. Each one gives the robot a different amount of knowledge to work with.",
      "Use the controls that appear below to run, step through one move at a time, or reset and try again.",
    ],
    tips: [
      "Every mode can be replayed from scratch with Reset, and Undo (Ctrl+Z) rolls back grid edits.",
      "Click the \"?\" in the top-right any time to reread how the current mode works.",
    ],
  },
  global: {
    eyebrow: "Planning mode",
    title: "Global Mode",
    body: "The algorithm is handed the entire map before it takes a single step. This is the classic \"full-information\" pathfinding you'd see in a textbook or an interview - A* and Dijkstra both live here.",
    steps: [
      "Draw any walls you want, then place a Start and a Goal.",
      "Pick A* or Dijkstra under Algorithm.",
      "Hit Run in Search. Watch it explore the grid, then draw the shortest path once it reaches the goal.",
      "Head to Robot and hit Walk to move the robot along that path, one cell at a time.",
    ],
    tips: [
      "A* is usually faster because it aims toward the goal; Dijkstra checks evenly outward and is a useful baseline to compare against.",
      "Reset in Search clears the visualization so you can rerun with a different algorithm on the same map.",
    ],
  },
  reactive: {
    eyebrow: "Planning mode",
    title: "Reactive Mode",
    body: "The robot has no map at all. It can only see what its sensor picks up from wherever it's currently standing, and decides its next move purely from that - no global path is ever computed.",
    steps: [
      "Place a Start and a Goal - order doesn't matter.",
      "Choose a Sensor: LiDAR sees all around it; Ultrasonic checks the four cardinal directions.",
      "Hit Explore. Each step, the robot senses, then moves toward the goal if it can already see a way there, or toward the nearest unexplored space if it can't.",
      "It keeps going until it reaches the goal, or runs out of places it can reach.",
    ],
    tips: [
      "There's no separate \"plan\" step here - sensing and moving happen together, one cycle at a time, which is what makes it reactive.",
      "Pause any time to see exactly what the robot has revealed so far. Step lets you go one sense-and-move cycle at a time.",
    ],
  },
  slam: {
    eyebrow: "Planning mode",
    title: "SLAM Mode",
    body: "SLAM stands for Simultaneous Localization and Mapping - building a map of an unknown space while also using that map to figure out where to go. Here that's split into two separate moves: sensing to reveal the map, and running a real pathfinding algorithm (A*/Dijkstra) on whatever's been revealed so far.",
    steps: [
      "Place a Start and a Goal. You can do this before exploring, or pause partway through exploring and place them inside whatever's already been revealed - either order works.",
      "Open Build Map and hit Sense. The robot moves around sensing its surroundings and filling in the known map. Nothing gets planned yet, this step is purely mapping.",
      "Pause any time. Whatever's been revealed stays revealed, you don't lose progress, and you can now treat it as \"the map so far\" for planning.",
      "Open Algorithm, choose A* or Dijkstra, then hit Plan in Plan Path. This runs the algorithm only on cells that have actually been sensed - anything still foggy is treated as blocked, exactly like a real robot that won't drive somewhere it hasn't seen.",
      "Hit Walk in Robot to move it along the planned path.",
    ],
    tips: [
      "If Plan Path comes back with no path, the goal probably hasn't been sensed yet - go build more of the map first.",
      "If you move the start or goal after already planning once, hit Reset next to Plan Path before planning again.",
      "Build Map will keep walking the robot all the way to the goal on its own if a route becomes visible - pause it early if you'd rather plan manually with a partial map.",
    ],
  },
};

export function ModeInfoModal({
  kind,
  onClose,
  primaryLabel = "Got it",
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  kind: ModalKind;
  onClose: () => void;
  /** Label for the main action button. Defaults to "Got it". */
  primaryLabel?: string;
  /** Defaults to onClose when not provided. */
  onPrimary?: () => void;
  /** When set, renders a second, lower-emphasis button next to the primary one. */
  secondaryLabel?: string;
  /** Defaults to onClose when not provided. */
  onSecondary?: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const content = CONTENT[kind];

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={content.title}
      >
        <div className={styles.panelHeader}>
          <div className={styles.panelHeaderText}>
            <span className={styles.eyebrow}>{content.eyebrow}</span>
            <h2 className={styles.title}>{content.title}</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className={styles.body}>{content.body}</p>

        <div className={styles.section}>
          <h3 className={styles.sectionLabel}>How it works</h3>
          <ol className={styles.stepList}>
            {content.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionLabel}>Good to know</h3>
          <ul className={styles.tipList}>
            {content.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className={styles.footer}>
          {secondaryLabel && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onSecondary ?? onClose}
            >
              {secondaryLabel}
            </button>
          )}
          <button
            type="button"
            className={styles.gotItBtn}
            onClick={onPrimary ?? onClose}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
