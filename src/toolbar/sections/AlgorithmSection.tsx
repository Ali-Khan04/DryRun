import type { Algorithm } from "../../types";
import { InfoButton } from "../components/InfoButton";
import { Section } from "../components/Section";
import { ALGORITHMS, ALGORITHM_INFO, algorithmLabel } from "../toolbarConfig";
import styles from "../Toolbar.module.css";

interface AlgorithmSectionProps {
  algorithm: Algorithm;
  isRunning: boolean;
  collapsed: boolean;
  openInfo: string | null;
  onToggleInfo: (id: string) => void;
  onToggleCollapse: () => void;
  onAlgorithmChange: (algorithm: Algorithm) => void;
}

export function AlgorithmSection({
  algorithm,
  isRunning,
  collapsed,
  openInfo,
  onToggleInfo,
  onToggleCollapse,
  onAlgorithmChange,
}: AlgorithmSectionProps) {
  return (
    <Section
      title="Algorithm"
      summary={algorithmLabel(algorithm)}
      collapsible
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      info={
        <InfoButton
          id="algorithm"
          label="How do the algorithms differ?"
          openId={openInfo}
          onToggle={onToggleInfo}
        >
          {ALGORITHM_INFO[algorithm]}
        </InfoButton>
      }
    >
      <div className={styles.modeGroup} role="group" aria-label="Algorithm">
        {ALGORITHMS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            disabled={isRunning}
            className={`${styles.modeBtn} ${
              algorithm === value ? styles.modeBtnActive : ""
            }`}
            aria-pressed={algorithm === value}
            onClick={() => onAlgorithmChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </Section>
  );
}
