import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="text-6xl font-mono text-red-500">!</div>
            <h1 className="text-2xl font-mono text-primary">SYSTEM ERROR</h1>
            <p className="text-muted-foreground font-mono text-sm">
              Something went wrong. The application encountered an unexpected error.
            </p>
            <pre className="text-xs text-red-400 bg-black/50 p-4 rounded overflow-auto max-h-32 text-left">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-6 py-2 bg-primary text-primary-foreground font-mono text-sm rounded hover:bg-primary/80 transition-colors"
            >
              RETURN TO DASHBOARD
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
