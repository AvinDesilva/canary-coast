"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-twilight-indigo flex items-center justify-center p-8">
          <div className="border-2 border-sapphire-sky p-8 max-w-lg">
            <h1 className="font-fraunces text-3xl font-bold text-alice-blue mb-4">
              Something went wrong
            </h1>
            <p className="text-alice-blue/80 mb-6">
              Canary Coast encountered an unexpected error. Please refresh the
              page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
