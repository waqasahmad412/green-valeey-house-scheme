import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Green Valley Residencia ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B1724] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#071827] border border-white/15 rounded-2xl p-8 text-center space-y-4">
            <p className="text-xs font-mono-tabular text-[#22C55E]">
              APPLICATION RECOVERY BOUNDARY
            </p>
            <h1 className="font-display text-3xl font-semibold text-white">
              Something went wrong
            </h1>
            <p className="text-xs text-slate-300 break-words bg-[#0B1724] p-3.5 rounded-lg border border-white/10">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-[#22C55E] text-[#071827] font-semibold text-xs rounded-lg"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
