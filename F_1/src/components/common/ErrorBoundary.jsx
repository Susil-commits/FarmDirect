import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    const report = {
      errorId: this.state.errorId,
      message: error?.message,
      name: error?.name,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    console.error('[ErrorBoundary] Caught error:', report);

    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo, report);
      } catch (reportingError) {
        console.warn('[ErrorBoundary] onError handler threw:', reportingError);
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
    window.location.href = '/';
  };

  handleHardReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env?.DEV;
      const errorMessage = this.state.error?.message || '';
      const isChunkError =
        this.state.error?.name === 'ChunkLoadError' ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Expected a JavaScript-or-Wasm module script') ||
        errorMessage.includes('MIME type') ||
        errorMessage.includes('Loading chunk');

      if (isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-green-200 dark:border-green-800">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw size={32} className="text-green-600 dark:text-green-400 animate-spin-slow" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                New Version Available
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                FarmDirect was updated on the server. Please refresh to load the latest application files.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={this.handleHardReload}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition"
                >
                  <RefreshCw size={18} />
                  Refresh Application
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              An unexpected error occurred. You can try again or go back to the home page.
            </p>
            {this.state.errorId && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 font-mono">
                Error ID: {this.state.errorId}
              </p>
            )}

            {/* Dev-mode: show full error details */}
            {isDev && this.state.error && (
              <details className="mb-6 text-left border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
                <summary className="px-4 py-2 text-sm text-red-600 dark:text-red-400 cursor-pointer bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                  🐛 Dev: Error Details
                </summary>
                <div className="p-4 bg-gray-900 text-red-400 text-xs font-mono overflow-auto max-h-48">
                  <div className="mb-2 text-red-300 font-bold">{this.state.error.name}: {this.state.error.message}</div>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap text-gray-400">{this.state.error.stack}</pre>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <div className="mt-3 mb-1 text-yellow-400">Component Stack:</div>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition"
              >
                <Home size={18} />
                Go Home
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
              >
                <RefreshCw size={18} />
                Try Again
              </button>
              <button
                onClick={this.handleHardReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                <RotateCcw size={18} />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}