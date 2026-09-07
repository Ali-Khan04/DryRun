import { useEffect, useState } from "react";
import { useExplorer } from "../algorithms/useExplorer";
import { useKnownPlanner } from "../algorithms/useKnownPlanner";
import { usePathWalker } from "../algorithms/usePathWalker";
import { useSearchRunner } from "../algorithms/useSearchRunner";
import { useSim } from "../context/SimulationContext";
import { useHistory } from "../history/HistoryContext";
import { useTour } from "../tour/TourContext";
import type { Algorithm, DrawMode, PlanningMode, SensorMode } from "../types";
import type { ModalKind } from "./ModeInfoModal";
import { planningModeLabel } from "./toolbarConfig";

const SEEN_KEY_PREFIX = "dryrun_seen_mode_";
const SEEN_WELCOME_KEY = "dryrun_seen_welcome";

type CollapsibleSection = "algorithm" | "sensor";

// localStorage can throw in private-browsing/embedded contexts. Onboarding is
// a nice-to-have, so storage failures should never stop the simulator.
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
    // ignore storage failures
  }
}

export function useToolbarController() {
  const { state, dispatch } = useSim();
  const history = useHistory();
  const runner = useSearchRunner();
  const walker = usePathWalker();
  const explorer = useExplorer();
  const planner = useKnownPlanner();
  const tour = useTour();

  const [openInfo, setOpenInfo] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<CollapsibleSection, boolean>>({
    algorithm: true,
    sensor: true,
  });
  const [modalKind, setModalKind] = useState<ModalKind | null>(() => {
    if (!hasSeen(SEEN_WELCOME_KEY)) {
      markSeen(SEEN_WELCOME_KEY);
      markSeen(`${SEEN_KEY_PREFIX}global`);
      return "welcome";
    }
    return null;
  });

  const toggleInfo = (id: string) =>
    setOpenInfo((current) => (current === id ? null : id));

  const toggleSection = (id: CollapsibleSection) =>
    setCollapsed((current) => ({ ...current, [id]: !current[id] }));

  // Close toolbar popovers on outside click / Escape.
  useEffect(() => {
    if (!openInfo) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-info-wrap]")) setOpenInfo(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenInfo(null);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openInfo]);

  // Global undo shortcut stays owned by the toolbar because the undo button
  // and the keyboard action must obey the same running-state guard.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        if (state.isRunning) return;
        event.preventDefault();
        history.undo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history, state.isRunning]);

  const handleDrawModeChange = (mode: DrawMode) => {
    dispatch({ type: "SET_DRAW_MODE", mode });
  };

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

  // "Use This Map" freezes sensing but deliberately keeps `known` intact.
  // Reset only the planner's stale search/path so the next Plan uses the
  // latest SLAM snapshot.
  const handleMapPause = () => {
    explorer.pause();
    planner.reset();
    dispatch({
      type: "SET_STATUS",
      msg: "Map building paused. This is the map the robot will plan with - re-place Start/Goal or edit walls anywhere inside the revealed area, then hit Plan in Plan Path below to route through it with A*/Dijkstra.",
      tone: "guide",
    });
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
      msg: "Exploration paused. Resume, step through one move at a time, or reset to start over.",
      tone: "guide",
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

  const isGridEmpty =
    !state.robot &&
    !state.goal &&
    state.grid.every((row) =>
      row.every(
        (cell) => cell.type === "empty" && !cell.explored && !cell.inPath,
      ),
    );

  const showAlgorithmSection =
    state.planningMode === "global" || state.planningMode === "slam";
  const showSensorSection =
    state.planningMode === "reactive" || state.planningMode === "slam";

  const statusActive =
    state.isRunning ||
    walker.isWalking ||
    explorer.isExploring ||
    planner.isPlanning;

  return {
    state,
    runner,
    walker,
    explorer,
    planner,
    modalKind,
    openInfo,
    collapsed,
    isGridEmpty,
    showAlgorithmSection,
    showSensorSection,
    statusActive,
    activeModeLabel: planningModeLabel(state.planningMode),
    canUndo: history.canUndo,
    hasEndpoints: !!state.robot || !!state.goal,
    toggleInfo,
    toggleSection,
    handleDrawModeChange,
    handleAlgorithmChange,
    handleSensorModeChange,
    handlePlanningModeChange,
    handleMapPause,
    handleExplorePause,
    handleClearEndpoints,
    handleClearGrid,
    undo: history.undo,
    showCurrentModeInfo: () => setModalKind(state.planningMode),
    closeModal: () => setModalKind(null),
    startTour: () => {
      setModalKind(null);
      tour.start();
    },
  };
}
