import { SimulationProvider } from "./context/SimulationContext";
import { HistoryProvider } from "./history/HistoryContext";
import { TourProvider } from "./tour/TourContext";
import { TourOverlay } from "./tour/TourOverlay";
import { SimCanvas } from "./canvas/SimCanvas";
import { Toolbar } from "./toolbar/Toolbar";
import { Narrator } from "./narrator/Narrator";
import styles from "./App.module.css";

export default function App() {
  return (
    <SimulationProvider>
      <HistoryProvider>
        <TourProvider>
          <div className={styles.app}>
            <Toolbar />
            <div className={styles.main}>
              <Narrator />
              <SimCanvas />
            </div>
          </div>
          <TourOverlay />
        </TourProvider>
      </HistoryProvider>
    </SimulationProvider>
  );
}
