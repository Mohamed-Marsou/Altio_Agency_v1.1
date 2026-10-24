"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger/client";

type Props = {
  /** the component this boundary protects: it becomes the "Component" line in the log */
  name: string;
  children: ReactNode;
  /** what to show instead when something inside crashes */
  fallback?: ReactNode;
};

// React error boundary: if a component inside crashes while rendering, only THIS
// block is replaced by a small message (not the whole page), and the crash is
// written to the error log with the name given above.
//   <ErrorBoundary name="OverviewView"> ... </ErrorBoundary>
export default class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.exception(error, {
      component: this.props.name,
      source: "react-error-boundary",
      // componentStack lists the React components between the crash and this boundary
      stack: `${error.stack ?? ""}\nReact component stack:${info.componentStack ?? ""}`,
    });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      this.props.fallback ?? (
        <div role="alert" style={{ padding: "1rem", border: "1px solid currentColor", borderRadius: "0.75rem" }}>
          <strong>This part could not be shown.</strong>
          <p style={{ margin: "0.25rem 0 0.75rem" }}>The problem was recorded. You can try again.</p>
          <button type="button" onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </div>
      )
    );
  }
}
