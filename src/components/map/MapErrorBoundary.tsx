"use client";

import { Component, type ReactNode } from "react";

type MapErrorBoundaryProps = {
  children: ReactNode;
  resetKey?: string | number;
};

type MapErrorBoundaryState = {
  hasError: boolean;
};

export default class MapErrorBoundary extends Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[MapErrorBoundary]", error);
  }

  componentDidUpdate(prevProps: MapErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-3xl border border-orange-100 bg-orange-50 p-6 text-center text-sm text-slate-600 lg:min-h-[420px]">
          <p>지도 표시 중 오류가 발생했습니다.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
