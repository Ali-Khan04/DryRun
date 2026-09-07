import type { ReactNode } from "react";
import styles from "../Toolbar.module.css";

interface InfoButtonProps {
  id: string;
  label: string;
  openId: string | null;
  onToggle: (id: string) => void;
  children: ReactNode;
}

export function InfoButton({
  id,
  label,
  openId,
  onToggle,
  children,
}: InfoButtonProps) {
  const open = openId === id;

  return (
    <span className={styles.infoWrap} data-info-wrap>
      <button
        type="button"
        className={`${styles.infoBtn} ${open ? styles.infoBtnActive : ""}`}
        aria-label={label}
        aria-expanded={open}
        onClick={() => onToggle(id)}
      >
        ?
      </button>
      {open && (
        <div className={styles.infoPopover} role="tooltip">
          {children}
        </div>
      )}
    </span>
  );
}
