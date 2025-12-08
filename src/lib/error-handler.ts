import { toast as toastFn } from '@/hooks/use-toast';

export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export interface ErrorContext {
    component?: string;
    action?: string;
    userId?: string;
    additionalData?: Record<string, unknown>;
}

class ErrorHandler {
    /**
     * Handle errors with standardized logging and user feedback
     */
    handle(
        error: unknown,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        context?: ErrorContext
    ): void {
        const errorMessage = this.getErrorMessage(error);

        // Log to console with context
        if (process.env.NODE_ENV === 'development') {
            const logMethod = this.getLogMethod(severity);
            logMethod('[Error]', {
                message: errorMessage,
                severity,
                context,
                timestamp: new Date().toISOString(),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }

        // Show user-friendly notification
        this.showUserNotification(errorMessage, severity);

        // TODO: Send to external error tracking service (e.g., Sentry)
        if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
            this.reportToExternalService(error, severity, context);
        }
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return 'An unexpected error occurred';
    }

    private getLogMethod(severity: ErrorSeverity): typeof console.log {
        switch (severity) {
            case ErrorSeverity.CRITICAL:
            case ErrorSeverity.HIGH:
                return console.error;
            case ErrorSeverity.MEDIUM:
                return console.warn;
            case ErrorSeverity.LOW:
            default:
                return console.log;
        }
    }

    private showUserNotification(message: string, severity: ErrorSeverity): void {
        const title = this.getNotificationTitle(severity);

        toastFn({
            title,
            description: message,
            variant: severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH
                ? 'destructive'
                : 'default',
        });
    }

    private getNotificationTitle(severity: ErrorSeverity): string {
        switch (severity) {
            case ErrorSeverity.CRITICAL:
                return 'Critical Error';
            case ErrorSeverity.HIGH:
                return 'Error';
            case ErrorSeverity.MEDIUM:
                return 'Warning';
            case ErrorSeverity.LOW:
            default:
                return 'Notice';
        }
    }

    private reportToExternalService(
        error: unknown,
        severity: ErrorSeverity,
        context?: ErrorContext
    ): void {
        // TODO: Implement Sentry or other error tracking integration
        console.info('[Error Tracking] Would report to external service:', {
            error,
            severity,
            context,
        });
    }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Convenience wrapper for try-catch blocks
 * @example
 * await handleAsync(async () => {
 *   await riskyOperation();
 * }, ErrorSeverity.HIGH, { component: 'MyComponent' });
 */
export async function handleAsync<T>(
    fn: () => Promise<T>,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext
): Promise<T | null> {
    try {
        return await fn();
    } catch (error) {
        errorHandler.handle(error, severity, context);
        return null;
    }
}

/**
 * Synchronous error handling wrapper
 */
export function handleSync<T>(
    fn: () => T,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext
): T | null {
    try {
        return fn();
    } catch (error) {
        errorHandler.handle(error, severity, context);
        return null;
    }
}
