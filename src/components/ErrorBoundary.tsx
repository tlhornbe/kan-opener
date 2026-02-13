import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
    children: ReactNode;
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

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleClearStorage = async () => {
        if (confirm('This will reset all your tasks, columns, and bookmarks. Are you sure?')) {
            try {
                // Clear chrome.storage.sync
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                    await chrome.storage.sync.clear();
                }
                // Clear localStorage
                localStorage.clear();
                
                // Reload page
                window.location.reload();
            } catch (error) {
                console.error('[ErrorBoundary] Failed to clear storage:', error);
                alert('Failed to clear storage. Please try manually resetting the extension.');
            }
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-center mb-6">
                            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-center mb-4 text-slate-900 dark:text-slate-100">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
                            Kan-Opener encountered an unexpected error. This might be due to corrupted data or a loading issue.
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mb-6 max-h-48 overflow-auto">
                            <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
                                {this.state.error?.toString()}
                            </p>
                            {this.state.errorInfo && (
                                <details className="mt-2">
                                    <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                                        Stack trace
                                    </summary>
                                    <pre className="text-xs text-slate-600 dark:text-slate-500 mt-2 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/30"
                            >
                                <RefreshCw size={20} />
                                Reload Extension
                            </button>

                            <button
                                onClick={this.handleClearStorage}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                <Trash2 size={20} />
                                Reset All Data (Last Resort)
                            </button>
                        </div>

                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
                            If this issue persists, please report it with the error details above.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
