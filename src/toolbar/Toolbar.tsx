import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSim } from "../context/SimulationContext";
import { useHistory } from "../history/HistoryContext";
import {
  useSearchRunner,
  type SearchSpeed,
} from "../algorithms/useSearchRunner";
import { usePathWalker, type WalkSpeed } from "../algorithms/usePathWalker";
import { useExplorer, type ExploreSpeed } from "../algorithms/useExplorer";
import { useKnownPlanner, type PlanSpeed } from "../algorithms/useKnownPlanner";
import { ModeInfoModal, type ModalKind } from "./ModeInfoModal";
import type { DrawMode, Algorithm, PlanningMode, SensorMode } from "../types";
import styles from "./Toolbar.module.css";

const SEEN_KEY_PREFIX = "dryrun_seen_mode_";
const SEEN_WELCOME_KEY = "dryrun_seen_welcome";

// localStorage can throw in private-browsing/embedded contexts - never let
// the onboarding nice-to-have break the app.
function hasSeen(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return true;
  }
}

function markSeen(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // ignore
  }
}

const MODES: { mode: DrawMode; label: string; swatchClass: string }[] = [
  { mode: "wall", label: "Wall", swatchClass: styles.swatchWall },
  { mode: "erase", label: "Erase", swatchClass: styles.swatchErase },
  { mode: "start", label: "Start", swatchClass: styles.swatchStart },
  { mode: "goal", label: "Goal", swatchClass: styles.swatchGoal },
];

const ALGORITHMS: { value: Algorithm; label: string }[] = [
  { value: "astar", label: "A*" },
  { value: "dijkstra", label: "Dijkstra" },
];

const PLANNING_MODES: {
  value: PlanningMode;
  label: string;
  blurb: string;
}[] = [
  {
    value: "global",
    label: "Global",
    blurb: "Full map known up front",
  },
  {
    value: "reactive",
    label: "Reactive",
    blurb: "Senses and moves on its own",
  },
  {
    value: "slam",
    label: "SLAM",
    blurb: "Maps as it goes, then plans",
  },
];

const ALGORITHM_INFO: Record<Algorithm, string> = {
  astar:
    "A* explores toward the goal first, using distance as a guide. Usually faster, fewer cells checked.",
  dijkstra:
    "Dijkstra explores evenly in all directions. Slower, but guaranteed shortest path even with no sense of direction.",
};

const SENSOR_MODES: { value: SensorMode; label: string }[] = [
  { value: "lidar", label: "LiDAR" },
  { value: "ultrasonic", label: "Ultrasonic" },
];

const SENSOR_INFO: Record<SensorMode, string> = {
  lidar:
    "Full 360° sweep every step - sees everything nearby, in every direction, at once.",
  ultrasonic:
    "Checks all 4 directions before moving - narrower field of view per glance than LiDAR.",
};

function LogoMark() {
  return (
    <svg
      className={styles.logoMark}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
    >
      <rect
        x="0.5"
        y="0.5"
        width="27"
        height="27"
        rx="7"
        fill="#12161D"
        stroke="#242B38"
      />
      <path
        d="M6 20 L6 14 L14 14 L14 8 L22 8"
        stroke="#4CE8B8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="20" r="2.2" fill="#FF8F5C" />
      <circle cx="22" cy="8" r="2.2" fill="#4CE8B8" />
    </svg>
  );
}

// Small "?" trigger that reveals an explanation panel on demand, so the
// toolbar doesn't have to keep a paragraph of prose permanently on screen
// for every setting. Only one popover is open at a time (see Toolbar).
function InfoButton({
  id,
  label,
  openId,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  openId: string | null;
  onToggle: (id: string) => void;
  children: ReactNode;
}) {
  const open = openId === id;
  return (
    <span className={styles.infoWrap} data-info-wrap>
      <button
        type="button"
        className={`${styles.infoBtn} ${open ? styles.infoBtnActive : ""}`}
        aria-label={label}
        aria-expanded={open}
        onClick={() => onToggle(id)}
      >
        ?
      </button>
      {open && (
        <div className={styles.infoPopover} role="tooltip">
          {children}
        </div>
      )}
    </span>
  );
}

// A card whose body can be tucked away once the user knows what it does.
// The header always shows the current selection, so collapsing a section
// never hides state - only the controls used to change it.
function Section({
  title,
  summary,
  collapsible,
  collapsed,
  onToggleCollapse,
  info,
  children,
}: {
  title: string;
  summary?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  info?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <button
          type="button"
          className={styles.cardHeaderMain}
          onClick={collapsible ? onToggleCollapse : undefined}
          aria-expanded={collapsible ? !collapsed : undefined}
          disabled={!collapsible}
        >
          <h2 className={styles.cardLabel}>{title}</h2>
          {collapsed && summary && (
            <span className={styles.cardSummary}>{summary}</span>
          )}
          {collapsible && (
            <span
              className={`${styles.chevron} ${collapsed ? "" : styles.chevronOpen}`}
              aria-hidden="true"
            />
          )}
        </button>
        {info}
      </div>
      {(!collapsible || !collapsed) && (
        <div className={styles.cardBody}>{children}</div>
      )}
    </section>
  );
}

export function Toolbar() {
  const { state, dispatch } = useSim();
  const history = useHistory();
  const runner = useSearchRunner();
  const walker = usePathWalker();
  const explorer = useExplorer();
  const planner = useKnownPlanner();

  const [openInfo, setOpenInfo] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    algorithm: true,
    sensor: true,
  });
  // First-ever visit: introduce the app itself. Doubles as marking Global
  // (the mode the app opens in) as "seen" so it isn't immediately re-shown
  // the first time the user deliberately clicks its tab. Computed lazily
  // (not in an effect) so there's no extra render on mount.
  const [modalKind, setModalKind] = useState<ModalKind | null>(() => {
    if (!hasSeen(SEEN_WELCOME_KEY)) {
      markSeen(SEEN_WELCOME_KEY);
      markSeen(`${SEEN_KEY_PREFIX}global`);
      return "welcome";
    }
    return null;
  });
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const toggleInfo = (id: string) =>
    setOpenInfo((cur) => (cur === id ? null : id));
  const toggleSection = (id: string) =>
    setCollapsed((cur) => ({ ...cur, [id]: !cur[id] }));

  const isGridEmpty =
    !state.robot &&
    !state.goal &&
    state.grid.every((row) =>
      row.every(
        (cell) => cell.type === "empty" && !cell.explored && !cell.inPath,
      ),
    );

  // Close any open popover on outside click / Escape, like a normal menu.
  useEffect(() => {
    if (!openInfo) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-info-wrap]")) setOpenInfo(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenInfo(null);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openInfo]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (state.isRunning) return;
        e.preventDefault();
        history.undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history, state.isRunning]);

  const handleAlgorithmChange = (algorithm: Algorithm) => {
    runner.reset();
    planner.reset();
    dispatch({ type: "SET_ALGORITHM", algorithm });
  };

  const handleSensorModeChange = (mode: SensorMode) => {
    explorer.reset();
    dispatch({ type: "SET_SENSOR_MODE", mode });
  };

  const handlePlanningModeChange = (mode: PlanningMode) => {
    runner.reset();
    walker.reset();
    explorer.reset();
    planner.reset();
    dispatch({ type: "SET_PLANNING_MODE", mode });

    const key = `${SEEN_KEY_PREFIX}${mode}`;
    if (!hasSeen(key)) {
      setModalKind(mode);
      markSeen(key);
    }
  };

  // Wraps explorer.pause() so pausing actually tells the user what just
  // happened: the map isn't gone, it's frozen and ready to plan against.
  const handleMapPause = () => {
    explorer.pause();
    const msg =
      "Map building paused - the revealed area is frozen. Place a new start/goal inside it if you like, then head to Plan Path.";
    dispatch({ type: "SET_STATUS", msg });
    if (state.robot) {
      dispatch({
        type: "SET_CALLOUT",
        pos: state.robot.pos,
        text: "Map paused - ready to plan with what's revealed so far",
        tone: "info",
      });
    }
  };

  const handleExplorePause = () => {
    explorer.pause();
    dispatch({
      type: "SET_STATUS",
      msg: "Exploration paused. Resume, step through, or reset to start over.",
    });
  };

  const handleClearEndpoints = () => {
    history.checkpoint();
    runner.reset();
    explorer.reset();
    planner.reset();
    dispatch({ type: "CLEAR_ENDPOINTS" });
  };

  const handleClearGrid = () => {
    history.checkpoint();
    runner.reset();
    explorer.reset();
    planner.reset();
    dispatch({ type: "CLEAR_GRID" });
  };

  const activeModeLabel = PLANNING_MODES.find(
    (m) => m.value === state.planningMode,
  )?.label;
  const activeAlgorithmLabel = ALGORITHMS.find(
    (a) => a.value === state.algorithm,
  )?.label;
  const activeSensorLabel = SENSOR_MODES.find(
    (s) => s.value === state.sensorMode,
  )?.label;

  const showAlgorithmSection =
    state.planningMode === "global" || state.planningMode === "slam";
  const showSensorSection =
    state.planningMode === "reactive" || state.planningMode === "slam";

  return (
    <div className={styles.toolbar} ref={toolbarRef}>
      <header className={styles.header}>
        <LogoMark />
        <div className={styles.headerText}>
          <span className={styles.brand}>DryRun</span>
          <span className={styles.tagline}>robotics sandbox</span>
        </div>
        <button
          type="button"
          className={styles.helpBtn}
          aria-label={`How ${activeModeLabel} mode works`}
          onClick={() => setModalKind(state.planningMode)}
        >
          ?
        </button>
      </header>

      <div className={styles.body}>
        <section className={styles.card}>
          <h2 className={styles.cardLabel}>Draw Mode</h2>
          <div className={styles.modeGroup} role="group" aria-label="Draw mode">
            {MODES.map(({ mode, label, swatchClass }) => (
              <button
                key={mode}
                type="button"
                disabled={state.isRunning}
                className={`${styles.modeBtn} ${
                  state.drawMode === mode ? styles.modeBtnActive : ""
                }`}
                aria-pressed={state.drawMode === mode}
                onClick={() => dispatch({ type: "SET_DRAW_MODE", mode })}
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
              disabled={state.isRunning || !history.canUndo}
              onClick={history.undo}
              title="Undo (Ctrl+Z)"
            >
              Undo
            </button>
            <button
              type="button"
              className={styles.editBtn}
              disabled={state.isRunning || (!state.robot && !state.goal)}
              onClick={handleClearEndpoints}
            >
              Clear Points
            </button>
            <button
              type="button"
              className={`${styles.editBtn} ${styles.editBtnDanger}`}
              disabled={state.isRunning || isGridEmpty}
              onClick={handleClearGrid}
            >
              Clear Grid
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardLabel}>Mode</h2>
          <div
            className={styles.tabGroup}
            role="group"
            aria-label="Planning mode"
          >
            {PLANNING_MODES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                disabled={state.isRunning}
                className={`${styles.tabBtn} ${
                  state.planningMode === value ? styles.tabBtnActive : ""
                }`}
                aria-pressed={state.planningMode === value}
                onClick={() => handlePlanningModeChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.modeBlurbRow}>
            <p className={styles.hintCompact}>
              {
                PLANNING_MODES.find((m) => m.value === state.planningMode)
                  ?.blurb
              }
            </p>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setModalKind(state.planningMode)}
            >
              How {activeModeLabel} mode works →
            </button>
          </div>
        </section>

        {showAlgorithmSection && (
          <Section
            title="Algorithm"
            summary={activeAlgorithmLabel}
            collapsible
            collapsed={collapsed.algorithm}
            onToggleCollapse={() => toggleSection("algorithm")}
            info={
              <InfoButton
                id="algorithm"
                label="How do the algorithms differ?"
                openId={openInfo}
                onToggle={toggleInfo}
              >
                {ALGORITHM_INFO[state.algorithm]}
              </InfoButton>
            }
          >
            <div
              className={styles.modeGroup}
              role="group"
              aria-label="Algorithm"
            >
              {ALGORITHMS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={state.isRunning}
                  className={`${styles.modeBtn} ${
                    state.algorithm === value ? styles.modeBtnActive : ""
                  }`}
                  aria-pressed={state.algorithm === value}
                  onClick={() => handleAlgorithmChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>
        )}

        {showSensorSection && (
          <Section
            title="Sensor"
            summary={activeSensorLabel}
            collapsible
            collapsed={collapsed.sensor}
            onToggleCollapse={() => toggleSection("sensor")}
            info={
              <InfoButton
                id="sensor"
                label="How do the sensors differ?"
                openId={openInfo}
                onToggle={toggleInfo}
              >
                {SENSOR_INFO[state.sensorMode]}
              </InfoButton>
            }
          >
            <div
              className={styles.modeGroup}
              role="group"
              aria-label="Sensor mode"
            >
              {SENSOR_MODES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={state.isRunning}
                  className={`${styles.modeBtn} ${
                    state.sensorMode === value ? styles.modeBtnActive : ""
                  }`}
                  aria-pressed={state.sensorMode === value}
                  onClick={() => handleSensorModeChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>
        )}

        {state.planningMode === "global" && (
          <section className={styles.card}>
            <h2 className={styles.cardLabel}>Search</h2>
            <div className={styles.runControls}>
              {state.isRunning ? (
                <button
                  type="button"
                  className={styles.controlBtn}
                  onClick={runner.pause}
                >
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
                disabled={state.isRunning}
                onClick={runner.step}
              >
                Step
              </button>
              <button
                type="button"
                className={styles.controlBtn}
                onClick={runner.reset}
              >
                Reset
              </button>
            </div>

            <select
              className={styles.speedSelect}
              value={runner.speed}
              disabled={state.isRunning}
              onChange={(e) => runner.setSpeed(e.target.value as SearchSpeed)}
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </section>
        )}

        {state.planningMode === "reactive" && (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardLabel} style={{ flex: 1 }}>
                Explore
              </h2>
              <InfoButton
                id="explore"
                label="What does Explore do?"
                openId={openInfo}
                onToggle={toggleInfo}
              >
                The robot senses from where it stands, then moves one cell
                toward the goal if it's already visible, or toward the
                nearest unexplored edge otherwise. Repeats until it reaches
                the goal or runs out of reachable ground.
              </InfoButton>
            </div>
            <div className={styles.runControls}>
              {explorer.isExploring ? (
                <button
                  type="button"
                  className={styles.controlBtn}
                  onClick={handleExplorePause}
                >
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

            <select
              className={styles.speedSelect}
              value={explorer.speed}
              disabled={explorer.isExploring}
              onChange={(e) =>
                explorer.setSpeed(e.target.value as ExploreSpeed)
              }
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </section>
        )}

        {state.planningMode === "slam" && (
          <>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardLabel} style={{ flex: 1 }}>
                  Build Map
                </h2>
                <InfoButton
                  id="slam-map"
                  label="What does Build Map do?"
                  openId={openInfo}
                  onToggle={toggleInfo}
                >
                  Drives the robot around, sensing as it goes and filling in
                  the known map - exactly like a real SLAM front-end would.
                  Nothing is planned yet; this just reveals territory for the
                  planner below to use.
                </InfoButton>
              </div>
              <div className={styles.runControls}>
                {explorer.isExploring ? (
                  <button
                    type="button"
                    className={styles.controlBtn}
                    onClick={handleMapPause}
                  >
                    Pause
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

              <select
                className={styles.speedSelect}
                value={explorer.speed}
                disabled={explorer.isExploring}
                onChange={(e) =>
                  explorer.setSpeed(e.target.value as ExploreSpeed)
                }
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
              <p className={styles.hintCompact}>
                Place start/goal before or after this - pause any time to
                freeze the map and plan with what's revealed so far.
              </p>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardLabel} style={{ flex: 1 }}>
                  Plan Path
                </h2>
                <InfoButton
                  id="slam-plan"
                  label="What does Plan Path do?"
                  openId={openInfo}
                  onToggle={toggleInfo}
                >
                  Runs {state.algorithm === "astar" ? "A*" : "Dijkstra"} on
                  only what's been sensed so far, from the robot's current
                  position. Unsensed cells are treated as blocked, so if the
                  goal hasn't been discovered yet, this will come back with
                  no path until you build more of the map above.
                </InfoButton>
              </div>
              <div className={styles.runControls}>
                {planner.isPlanning ? (
                  <button
                    type="button"
                    className={styles.controlBtn}
                    onClick={planner.pause}
                  >
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

              <select
                className={styles.speedSelect}
                value={planner.speed}
                disabled={planner.isPlanning}
                onChange={(e) => planner.setSpeed(e.target.value as PlanSpeed)}
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </section>
          </>
        )}

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardLabel} style={{ flex: 1 }}>
              Robot
            </h2>
            <InfoButton
              id="robot"
              label="What does Walk do?"
              openId={openInfo}
              onToggle={toggleInfo}
            >
              Moves the robot step by step along the most recently computed
              path, whichever mode produced it.
            </InfoButton>
          </div>
          <div className={styles.runControls}>
            {walker.isWalking ? (
              <button
                type="button"
                className={styles.controlBtn}
                onClick={walker.pause}
              >
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

          <select
            className={styles.speedSelect}
            value={walker.speed}
            disabled={walker.isWalking}
            onChange={(e) => walker.setSpeed(e.target.value as WalkSpeed)}
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </section>
      </div>

      <div className={styles.statusBar}>
        <span
          className={`${styles.statusDot} ${
            state.isRunning ||
            walker.isWalking ||
            explorer.isExploring ||
            planner.isPlanning
              ? styles.statusDotActive
              : ""
          }`}
        />
        <span className={styles.statusText}>{state.statusMsg}</span>
      </div>

      {modalKind && (
        <ModeInfoModal kind={modalKind} onClose={() => setModalKind(null)} />
      )}
    </div>
  );
}
