import { useEffect, useLayoutEffect, useState } from "react";
import { useTour } from "./TourContext";
import { TOUR_STEPS } from "./tourSteps";
import styles from "./TourOverlay.module.css";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PADDING = 6;
const TOOLTIP_WIDTH = 280;
const TOOLTIP_GAP = 14;
const EST_TOOLTIP_HEIGHT = 180;

export function TourOverlay() {
  const { active, stepIndex, totalSteps, next, back, end } = useTour();
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  const step = TOUR_STEPS[stepIndex];

  // Locate the current step's target, scroll it into view if needed, and
  // measure it. Re-runs on every step change and on resize.
  useLayoutEffect(() => {
    if (!active || !step) return;

    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        x: r.left - PADDING,
        y: r.top - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      });
    };

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    el?.scrollIntoView({ block: "center", inline: "center" });

    // Let the scroll settle before measuring. This also keeps the state
    // update out of the effect body itself (only the timer callback below
    // calls setRect), which is what the lint rule wants.
    const settleTimer = window.setTimeout(measure, 60);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", measure);
    };
  }, [active, step]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, next, back, end]);

  if (!active || !step) return null;

  const { w: vw, h: vh } = viewport;

  let tooltipLeft = 16;
  let tooltipTop = 16;

  if (rect) {
    const placeBelow = rect.y + rect.height + TOOLTIP_GAP + EST_TOOLTIP_HEIGHT < vh;
    tooltipTop = placeBelow
      ? rect.y + rect.height + TOOLTIP_GAP
      : Math.max(16, rect.y - TOOLTIP_GAP - EST_TOOLTIP_HEIGHT);
    const centerX = rect.x + rect.width / 2;
    tooltipLeft = Math.min(
      Math.max(12, centerX - TOOLTIP_WIDTH / 2),
      vw - TOOLTIP_WIDTH - 12,
    );
  }

  return (
    <div className={styles.root}>
      <svg className={styles.mask} width={vw} height={vh}>
        <defs>
          <mask id="tour-hole">
            <rect x={0} y={0} width={vw} height={vh} fill="white" />
            {rect && (
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x={0}
          y={0}
          width={vw}
          height={vh}
          className={styles.backdrop}
          mask="url(#tour-hole)"
        />
      </svg>

      {rect && (
        <div
          className={styles.ring}
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}

      <div
        className={styles.tooltip}
        style={{ left: tooltipLeft, top: tooltipTop }}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
      >
        <div className={styles.tooltipHeader}>
          <span className={styles.stepCount}>
            {stepIndex + 1} / {totalSteps}
          </span>
          <button type="button" className={styles.skipBtn} onClick={end}>
            Skip tour
          </button>
        </div>
        <h3 className={styles.title}>{step.title}</h3>
        <p className={styles.body}>{step.body}</p>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={back}
            disabled={stepIndex === 0}
          >
            Back
          </button>
          <button type="button" className={styles.primaryBtn} onClick={next}>
            {stepIndex + 1 === totalSteps ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
