'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  /** Label para identificar dónde ocurrió el error (ej: "KDS", "AdminPanel") */
  label?: string
  /** Componente de fallback personalizado */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    // Log to console (could send to a monitoring service like Sentry)
    console.error(`[ErrorBoundary${this.props.label ? ` / ${this.props.label}` : ''}]`, error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Algo salió mal</h3>
            {this.props.label && (
              <p className="text-xs text-muted-foreground mt-0.5">en {this.props.label}</p>
            )}
            {this.state.error && (
              <p className="text-[11px] text-muted-foreground mt-2 font-mono bg-secondary px-2 py-1 rounded max-w-xs truncate">
                {this.state.error.message}
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={this.handleReset}>
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Versión simplificada para envolver secciones pequeñas.
 * Uso: <SafeSection label="MiComponente"><MiComponente /></SafeSection>
 */
export function SafeSection({ children, label, fallback }: Props) {
  return (
    <ErrorBoundary label={label} fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}
