import styles from "../Toolbar.module.css";

type SpeedValue = "slow" | "normal" | "fast";

interface SpeedSelectProps<T extends SpeedValue> {
  value: T;
  disabled: boolean;
  onChange: (speed: T) => void;
  ariaLabel: string;
}

export function SpeedSelect<T extends SpeedValue>({
  value,
  disabled,
  onChange,
  ariaLabel,
}: SpeedSelectProps<T>) {
  return (
    <select
      className={styles.speedSelect}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value as T)}
    >
      <option value="slow">Slow</option>
      <option value="normal">Normal</option>
      <option value="fast">Fast</option>
    </select>
  );
}
