"use client"

import { Component, type ReactNode } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[200px] p-6">
          <div className="text-center max-w-md space-y-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Something went wrong</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={this.handleRetry} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
