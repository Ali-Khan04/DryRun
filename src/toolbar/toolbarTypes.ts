import type { ExploreSpeed } from "../algorithms/useExplorer";
import type { PlanSpeed } from "../algorithms/useKnownPlanner";
import type { WalkSpeed } from "../algorithms/usePathWalker";
import type { SearchSpeed } from "../algorithms/useSearchRunner";

export interface SearchControls {
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  speed: SearchSpeed;
  setSpeed: (speed: SearchSpeed) => void;
  isRunning: boolean;
}

export interface ExploreControls {
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  speed: ExploreSpeed;
  setSpeed: (speed: ExploreSpeed) => void;
  isExploring: boolean;
  canExplore: boolean;
}

export interface PlannerControls {
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  speed: PlanSpeed;
  setSpeed: (speed: PlanSpeed) => void;
  isPlanning: boolean;
  canPlan: boolean;
}

export interface WalkerControls {
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  speed: WalkSpeed;
  setSpeed: (speed: WalkSpeed) => void;
  isWalking: boolean;
  canWalk: boolean;
}
