import { createContext, useContext, useState, type ReactNode } from "react";
import { TOUR_STEPS } from "./tourSteps";

interface TourCtx {
  active: boolean;
  stepIndex: number;
  totalSteps: number;
  start: () => void;
  next: () => void;
  back: () => void;
  end: () => void;
}

const TourContext = createContext<TourCtx | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const start = () => {
    setStepIndex(0);
    setActive(true);
  };

  const next = () => {
    setStepIndex((i) => {
      if (i + 1 >= TOUR_STEPS.length) {
        setActive(false);
        return i;
      }
      return i + 1;
    });
  };

  const back = () => setStepIndex((i) => Math.max(0, i - 1));
  const end = () => setActive(false);

  return (
    <TourContext.Provider
      value={{
        active,
        stepIndex,
        totalSteps: TOUR_STEPS.length,
        start,
        next,
        back,
        end,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside TourProvider");
  return ctx;
}
