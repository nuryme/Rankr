"use client";

// Catches unexpected render-time crashes (distinct from the pipeline-level
// error handling in Analyzing.tsx, which retries failed stages). Wraps the
// Analyzing and ResultsWizard subtrees in RankrApp so a crash anywhere below
// shows a recoverable message instead of a blank screen.

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error in RANKR:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
          <div
            role="alert"
            className="flex flex-col items-center gap-[var(--gap-md)] rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] px-[var(--gap-2xl)] py-[var(--gap-xl)]"
          >
            <p className="text-[19px] font-semibold text-[var(--text)]">
              Something went wrong. Please reload and try again.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="h-auto min-h-[44px] border border-[var(--accent)] bg-[var(--accent)] px-[var(--gap-lg)] text-white hover:bg-[var(--accent)] hover:brightness-110"
            >
              Reload
            </Button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
