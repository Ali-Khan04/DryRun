import styles from "../Toolbar.module.css";

export function LogoMark() {
  return (
    <svg
      className={styles.logoMark}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="0.5"
        y="0.5"
        width="27"
        height="27"
        rx="7"
        fill="#12161D"
        stroke="#242B38"
      />
      <path
        d="M6 20 L6 14 L14 14 L14 8 L22 8"
        stroke="#4CE8B8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="20" r="2.2" fill="#FF8F5C" />
      <circle cx="22" cy="8" r="2.2" fill="#4CE8B8" />
    </svg>
  );
}
