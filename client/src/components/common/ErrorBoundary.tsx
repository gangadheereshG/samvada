import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SAMVADA ErrorBoundary caught an error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4 text-rose-400 text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-slate-400 max-w-md mb-4 text-sm">
            {this.state.error?.message || 'An unexpected error occurred while loading the application.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-sky-500/25"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
