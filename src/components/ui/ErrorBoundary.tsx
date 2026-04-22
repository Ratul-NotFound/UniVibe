import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-3xl border border-white/[0.05] rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <div className="mb-8 mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-zinc-800 border border-white/10 text-primary animate-pulse">
                <AlertTriangle size={40} />
              </div>

              <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter mb-4 leading-tight">
                Frequency Jammed
              </h1>
              
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-10 leading-relaxed px-4">
                The terminal encountered a synchronization error. Resetting signal recommended.
              </p>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={this.handleReset}
                  className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                >
                  <RefreshCw size={14} className="mr-3" />
                  Reset Signal
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => window.location.href = '/'}
                  className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-zinc-500 hover:text-white"
                >
                  <Home size={14} className="mr-3" />
                  Terminal Home
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-10 p-4 bg-black/40 rounded-xl border border-white/5 text-left overflow-auto max-h-32 no-scrollbar">
                  <p className="text-[10px] font-mono text-rose-500 break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
