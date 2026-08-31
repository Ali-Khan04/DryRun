export interface TourStep {
  /** Matches a data-tour="..." attribute somewhere in the app. */
  target: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: "canvas",
    title: "This is your grid",
    body: "Click and drag to paint walls, or just leave it open. Everything the robot does happens right here.",
  },
  {
    target: "draw-mode",
    title: "Place a start and a goal",
    body: "Switch to Start or Goal in here, then click a cell on the grid to drop it there.",
  },
  {
    target: "planning-mode",
    title: "Choose what the robot knows",
    body: "Global sees the whole map upfront. Reactive and SLAM only know what they've sensed, pick one to change how the run behaves.",
  },
  {
    target: "legend",
    title: "Forget what a color means?",
    body: "This key lives on the canvas itself and updates automatically for whichever mode you're in.",
  },
  {
    target: "help-button",
    title: "Want the full explanation?",
    body: "Tap this any time for a detailed breakdown of exactly how the current mode works.",
  },
];
