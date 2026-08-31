import { useRef, useEffect, useCallback } from "react";
import { useSim } from "../context/SimulationContext";
import { useHistory } from "../history/HistoryContext";
import { renderGrid } from "./renderer";
import styles from "./SimCanvas.module.css";
import { RobotCallout } from "./RobotCallout";
import { CanvasLegend } from "./CanvasLegend";

const WRAPPER_PADDING = 16;
const MIN_COLS = 20;
const MIN_ROWS = 12;

export function SimCanvas() {
  const { state, dispatch } = useSim();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const { config } = state;
  const history = useHistory();

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const resize = (width: number, height: number) => {
      const availW = width - WRAPPER_PADDING * 2;
      const availH = height - WRAPPER_PADDING * 2;
      const cols = Math.max(MIN_COLS, Math.floor(availW / config.cellSize));
      const rows = Math.max(MIN_ROWS, Math.floor(availH / config.cellSize));
      dispatch({ type: "RESIZE_GRID", rows, cols });
    };

    resize(wrapper.clientWidth, wrapper.clientHeight);

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      resize(width, height);
    });
    observer.observe(wrapper);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.cellSize, dispatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderGrid(ctx, state);
  }, [state]);

  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const col = Math.floor(x / config.cellSize);
      const row = Math.floor(y / config.cellSize);
      if (row < 0 || row >= config.rows || col < 0 || col >= config.cols)
        return null;
      return { row, col };
    },
    [config],
  );

  const paintAt = useCallback(
    (clientX: number, clientY: number) => {
      if (state.isRunning) return; // freeze the grid while a search animates
      const pos = getCellFromPoint(clientX, clientY);
      if (!pos) return;
      dispatch({ type: "SET_CELL", row: pos.row, col: pos.col });
    },
    [getCellFromPoint, dispatch, state.isRunning],
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.isRunning) return;
    history.checkpoint();
    isDrawing.current = true;
    paintAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing.current) paintAt(e.clientX, e.clientY);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (state.isRunning) return;
    history.checkpoint();
    isDrawing.current = true;
    const touch = e.touches[0];
    if (touch) paintAt(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const touch = e.touches[0];
    if (touch) paintAt(touch.clientX, touch.clientY);
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.canvasStage}>
        <div className={styles.canvasFrame} data-tour="canvas">
          <canvas
            ref={canvasRef}
            width={config.cols * config.cellSize}
            height={config.rows * config.cellSize}
            className={styles.canvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
          />
        </div>
        <RobotCallout />
        <CanvasLegend />
      </div>
    </div>
  );
}
