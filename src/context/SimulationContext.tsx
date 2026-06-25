import { createContext, useContext, useReducer, type ReactNode } from "react";
import { simReducer, makeInitialState } from "./reducer";
import type { SimState, SimAction } from "../types";

interface SimCtx {
  state: SimState;
  dispatch: React.Dispatch<SimAction>;
}

const SimulationContext = createContext<SimCtx | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(simReducer, makeInitialState());
  return (
    <SimulationContext.Provider value={{ state, dispatch }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSim() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSim must be used inside SimulationProvider");
  return ctx;
}
