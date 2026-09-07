import type { ReactNode } from "react";
import styles from "../Toolbar.module.css";

interface SectionProps {
  title: string;
  summary?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  info?: ReactNode;
  children: ReactNode;
}

export function Section({
  title,
  summary,
  collapsible,
  collapsed,
  onToggleCollapse,
  info,
  children,
}: SectionProps) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <button
          type="button"
          className={styles.cardHeaderMain}
          onClick={collapsible ? onToggleCollapse : undefined}
          aria-expanded={collapsible ? !collapsed : undefined}
          disabled={!collapsible}
        >
          <h2 className={styles.cardLabel}>{title}</h2>
          {collapsed && summary && (
            <span className={styles.cardSummary}>{summary}</span>
          )}
          {collapsible && (
            <span
              className={`${styles.chevron} ${collapsed ? "" : styles.chevronOpen}`}
              aria-hidden="true"
            />
          )}
        </button>
        {info}
      </div>
      {(!collapsible || !collapsed) && (
        <div className={styles.cardBody}>{children}</div>
      )}
    </section>
  );
}
