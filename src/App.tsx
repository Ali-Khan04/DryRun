import { SimulationProvider } from "./context/SimulationContext";
import { SimCanvas } from "./canvas/SimCanvas";
import { Toolbar } from "./toolbar/Toolbar";
import styles from "./App.module.css";

export default function App() {
  return (
    <SimulationProvider>
      <div className={styles.app}>
        <Toolbar />
        <div className={styles.main}>
          <SimCanvas />
        </div>
      </div>
    </SimulationProvider>
  );
}
