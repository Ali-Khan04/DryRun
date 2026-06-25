import { SimulationProvider } from "./context/SimulationContext";
import { SimCanvas } from "./canvas/SimCanvas";
import styles from "./App.module.css";

export default function App() {
  return (
    <SimulationProvider>
      <div className={styles.app}>
        <div className={styles.main}>
          <SimCanvas />
        </div>
      </div>
    </SimulationProvider>
  );
}
