'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {this.props.fallbackMessage ||
                                "We're sorry, but something unexpected happened. Please try refreshing the page."}
                        </p>
                        {this.props.showError && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 rounded-md text-left">
                                <p className="text-xs font-mono text-red-800">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => window.location.reload()}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh Page
                            </Button>
                            {this.props.onReset && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        this.setState({ hasError: false, error: null });
                                        this.props.onReset();
                                    }}
                                >
                                    Try Again
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
