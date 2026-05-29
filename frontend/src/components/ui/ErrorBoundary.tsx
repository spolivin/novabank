import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-brand-fg text-lg font-semibold mb-2">Something went wrong</p>
            <p className="text-brand-fg-muted text-sm mb-6">
              A page failed to load. Check your connection and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 rounded-xl bg-brand-accent text-brand-bg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
