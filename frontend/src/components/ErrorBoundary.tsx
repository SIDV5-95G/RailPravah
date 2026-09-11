import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== "undefined") {
      window.location.hash = "";
    }
  };

  public handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white rounded-2xl border border-[#ffdad6] shadow-sm p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#191c1e]">
                Railप्रवाह Workspace Recovery
              </h1>
              <p className="text-xs text-[#464555] leading-relaxed">
                An unexpected interface exception was caught safely by the system error guard.
                You can recover the session or return to the main operational control dashboard.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#f2f4f6] text-left p-4 rounded-xl text-xs font-mono text-[#ba1a1a] border border-[#e2e8f0] overflow-x-auto max-h-40">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="mt-2 text-[10px] text-[#767586] whitespace-pre-wrap">
                    {this.state.error.stack.split("\n").slice(0, 4).join("\n")}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Return to Workspace</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#191c1e] text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
