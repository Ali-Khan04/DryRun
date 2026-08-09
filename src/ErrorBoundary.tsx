import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("DryRun crashed:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <span className={styles.brand}>DryRun</span>
          <h1 className={styles.title}>Something broke</h1>
          <p className={styles.message}>
            The simulation hit an unexpected error and couldn't continue.
            Resetting will clear your current grid.
          </p>
          <pre className={styles.details}>{error.message}</pre>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={this.handleReset}
          >
            Reset and continue
          </button>
        </div>
      </div>
    );
  }
}
