import styles from "../Toolbar.module.css";

interface StatusBarProps {
  active: boolean;
  message: string;
}

export function StatusBar({ active, message }: StatusBarProps) {
  return (
    <div className={styles.statusBar}>
      <span
        className={`${styles.statusDot} ${active ? styles.statusDotActive : ""}`}
      />
      <span className={styles.statusText}>{message}</span>
    </div>
  );
}
