import { SimulationProvider } from "./context/SimulationContext";
import { HistoryProvider } from "./history/HistoryContext";
import { SimCanvas } from "./canvas/SimCanvas";
import { Toolbar } from "./toolbar/Toolbar";
import styles from "./App.module.css";

export default function App() {
  return (
    <SimulationProvider>
      <HistoryProvider>
        <div className={styles.app}>
          <Toolbar />
          <div className={styles.main}>
            <SimCanvas />
          </div>
        </div>
      </HistoryProvider>
    </SimulationProvider>
  );
}
