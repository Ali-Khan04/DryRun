import { useRef, useEffect, useCallback } from "react";
import { useSim } from "../context/SimulationContext";
import { renderGrid } from "./renderer";
import styles from "./SimCanvas.module.css";

export function SimCanvas() {
  const { state, dispatch } = useSim();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const { config } = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderGrid(ctx, state);
  }, [state]);

  const getCellFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / config.cellSize);
      const row = Math.floor(y / config.cellSize);
      if (row < 0 || row >= config.rows || col < 0 || col >= config.cols)
        return null;
      return { row, col };
    },
    [config],
  );

  const paint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCellFromEvent(e);
      if (!pos) return;
      dispatch({ type: "SET_CELL", row: pos.row, col: pos.col });
    },
    [getCellFromEvent, dispatch],
  );

  return (
    <div className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={config.cols * config.cellSize}
        height={config.rows * config.cellSize}
        className={styles.canvas}
        onMouseDown={(e) => {
          isDrawing.current = true;
          paint(e);
        }}
        onMouseMove={(e) => {
          if (isDrawing.current) paint(e);
        }}
        onMouseUp={() => {
          isDrawing.current = false;
        }}
        onMouseLeave={() => {
          isDrawing.current = false;
        }}
      />
    </div>
  );
}
