'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode
  /** Shown in the fallback UI as context */
  label?: string
  /** Compact mode for inline/widget errors (no padding, smaller text) */
  compact?: boolean
  /** Completely silent — render nothing on error */
  silent?: boolean
  /** Custom fallback component */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// ── Component ────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    // Silent mode — render nothing
    if (this.props.silent) {
      return null
    }

    // Custom fallback
    if (this.props.fallback) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error!, this.reset)
      }
      return this.props.fallback
    }

    // Default fallback UI
    const { compact, label } = this.props
    const error = this.state.error

    if (compact) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 text-destructive text-xs">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">
            {label ? `${label}: ` : ''}
            {error?.message || 'Something went wrong'}
          </span>
          <button
            onClick={this.reset}
            className="ml-auto flex-shrink-0 hover:bg-destructive/20 rounded p-0.5"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-destructive/20 bg-destructive/5">
        <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
        <h3 className="text-sm font-semibold text-destructive mb-1">
          {label || 'Rendering Error'}
        </h3>
        <p className="text-xs text-muted-foreground text-center max-w-md mb-3">
          {error?.message || 'An unexpected error occurred while rendering this component.'}
        </p>
        <button
          onClick={this.reset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-background border border-border hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Try Again
        </button>
        {process.env.NODE_ENV === 'development' && error?.stack && (
          <pre className="mt-3 p-3 bg-muted rounded text-[10px] text-muted-foreground overflow-auto max-h-32 w-full">
            {error.stack}
          </pre>
        )}
      </div>
    )
  }
}

// ── Convenience wrappers ─────────────────────────────────────────────

/** Wraps a widget/card — compact error display */
export function WidgetErrorBoundary({ children, label }: { children: ReactNode; label?: string }) {
  return <ErrorBoundary compact label={label}>{children}</ErrorBoundary>
}

/** Wraps a block in the editor — shows inline error */
export function BlockErrorBoundary({ children, blockId }: { children: ReactNode; blockId?: string }) {
  return (
    <ErrorBoundary
      compact
      label={blockId ? `Block ${blockId.slice(0, 6)}` : 'Block'}
    >
      {children}
    </ErrorBoundary>
  )
}

/** Wraps a full page section — shows prominent error */
export function SectionErrorBoundary({ children, label }: { children: ReactNode; label?: string }) {
  return <ErrorBoundary label={label || 'Section Error'}>{children}</ErrorBoundary>
}
