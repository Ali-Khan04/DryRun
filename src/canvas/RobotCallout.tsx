import { useEffect, useRef, useState } from "react";
import { useSim } from "../context/SimulationContext";
import type { CalloutTone, GridPos } from "../types";
import styles from "./RobotCallout.module.css";

// Floor on how long each popup stays visible before the next one can
// replace it independent of how fast the underlying algorithm is
// stepping. Without this, "Fast" mode could flash a new message several
// times a second, which is both unreadable and a real photosensitivity
// concern. Rapid intermediate messages are coalesced: only the latest
// pending one is shown once the floor elapses, nothing is queued up.
const MIN_DISPLAY_MS = 1100;

interface Display {
  pos: GridPos;
  text: string;
  tone: CalloutTone;
}

export function RobotCallout() {
  const { state } = useSim();
  const { calloutPos, calloutText, calloutTone, config } = state;

  const [display, setDisplay] = useState<Display | null>(null);
  const lastShownAt = useRef(0);
  const pendingTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!calloutPos || !calloutText) {
      setDisplay(null);
      return;
    }

    const commit = () => {
      lastShownAt.current = Date.now();
      setDisplay({ pos: calloutPos, text: calloutText, tone: calloutTone });
    };

    const elapsed = Date.now() - lastShownAt.current;

    if (pendingTimer.current !== null) {
      window.clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }

    if (elapsed >= MIN_DISPLAY_MS) {
      commit();
    } else {
      pendingTimer.current = window.setTimeout(
        commit,
        MIN_DISPLAY_MS - elapsed,
      );
    }

    return () => {
      if (pendingTimer.current !== null)
        window.clearTimeout(pendingTimer.current);
    };
  }, [calloutPos?.row, calloutPos?.col, calloutText, calloutTone]);

  if (!display) return null;

  const { cellSize } = config;
  const x = display.pos.col * cellSize + cellSize / 2;
  const y = display.pos.row * cellSize;

  return (
    <div
      key={`${display.pos.row}-${display.pos.col}-${display.text}`}
      className={`${styles.callout} ${styles[display.tone]}`}
      style={{ left: x, top: y }}
    >
      {display.text}
      <span className={styles.tail} />
    </div>
  );
}
