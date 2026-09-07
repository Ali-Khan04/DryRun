import type { SensorMode } from "../../types";
import { InfoButton } from "../components/InfoButton";
import { Section } from "../components/Section";
import { SENSOR_INFO, SENSOR_MODES, sensorModeLabel } from "../toolbarConfig";
import styles from "../Toolbar.module.css";

interface SensorSectionProps {
  sensorMode: SensorMode;
  isRunning: boolean;
  collapsed: boolean;
  openInfo: string | null;
  onToggleInfo: (id: string) => void;
  onToggleCollapse: () => void;
  onSensorModeChange: (mode: SensorMode) => void;
}

export function SensorSection({
  sensorMode,
  isRunning,
  collapsed,
  openInfo,
  onToggleInfo,
  onToggleCollapse,
  onSensorModeChange,
}: SensorSectionProps) {
  return (
    <Section
      title="Sensor"
      summary={sensorModeLabel(sensorMode)}
      collapsible
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      info={
        <InfoButton
          id="sensor"
          label="How do the sensors differ?"
          openId={openInfo}
          onToggle={onToggleInfo}
        >
          {SENSOR_INFO[sensorMode]}
        </InfoButton>
      }
    >
      <div className={styles.modeGroup} role="group" aria-label="Sensor mode">
        {SENSOR_MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            disabled={isRunning}
            className={`${styles.modeBtn} ${
              sensorMode === value ? styles.modeBtnActive : ""
            }`}
            aria-pressed={sensorMode === value}
            onClick={() => onSensorModeChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </Section>
  );
}
