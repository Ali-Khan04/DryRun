import { LogoMark } from "./LogoMark";
import styles from "../Toolbar.module.css";

interface ToolbarHeaderProps {
  activeModeLabel: string;
  onHelp: () => void;
}

export function ToolbarHeader({ activeModeLabel, onHelp }: ToolbarHeaderProps) {
  return (
    <header className={styles.header}>
      <LogoMark />
      <div className={styles.headerText}>
        <span className={styles.brand}>DryRun</span>
        <span className={styles.tagline}>robotics sandbox</span>
      </div>
      <button
        type="button"
        className={styles.helpBtn}
        data-tour="help-button"
        aria-label={`How ${activeModeLabel} mode works`}
        onClick={onHelp}
      >
        ?
      </button>
    </header>
  );
}
