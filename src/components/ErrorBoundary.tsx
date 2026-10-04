import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Changing this value clears the error (e.g. the current route). */
  resetKey?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Shows a recoverable message instead of a blank screen when a page crashes. */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro na tela:', error, info.componentStack);
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
          <div className="space-y-1">
            <h2 className="font-semibold text-foreground">Algo deu errado nesta tela</h2>
            <p className="text-sm text-muted-foreground">Seus dados estão salvos. Tente recarregar a página.</p>
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => this.setState({ error: null })}>Tentar de novo</Button>
            <Button onClick={() => window.location.reload()}>Recarregar</Button>
          </div>
        </div>
      </div>
    );
  }
}
