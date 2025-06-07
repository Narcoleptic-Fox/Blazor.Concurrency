import type { WorkerOrchestrator } from '../core/worker-orchestrator';

export abstract class BaseWorkerModule {
    constructor(protected orchestrator: WorkerOrchestrator) { }

    abstract get moduleName(): string;

    async handleOperation(operation: string, data: any, id: string): Promise<void> {
        const handlerName = `handle${this.capitalizeFirst(operation)}`;
        const handler = (this as any)[handlerName];

        if (!handler || typeof handler !== 'function') {
            throw new Error(`Operation '${operation}' not supported by module '${this.moduleName}'`);
        }

        try {
            await handler.call(this, data, id);
        } catch (error) {
            console.error(`Error in ${this.moduleName}.${handlerName}:`, error);
            this.sendError(error as Error, id);
        }
    }

    protected sendResponse(data: any, id: string, metadata: Record<string, any> = {}): void {
        this.orchestrator.sendResponse('SUCCESS', data, id, metadata);
    }

    protected sendError(error: Error | string, id: string, code?: string): void {
        const errorObj = error instanceof Error ? error : new Error(error);
        this.orchestrator.sendResponse('ERROR', {
            error: errorObj.message,
            code,
            stack: errorObj.stack
        }, id);
    }

    protected sendProgress(progressPercentage: number, id: string, metadata: Record<string, any> = {}): void {
        this.orchestrator.sendProgress(progressPercentage, id, metadata);
    }

    protected sendStreamData(data: any, id: string): void {
        this.orchestrator.sendStreamData(data, id);
    }

    protected sendStreamError(error: string, id: string): void {
        this.orchestrator.sendStreamError(error, id);
    }

    private capitalizeFirst(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    protected sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    protected async withRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: Error;
        let delay = baseDelay;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                if (attempt < maxRetries && this.isRetryableError(lastError)) {
                    await this.sleep(delay);
                    delay *= 2; // Exponential backoff
                    continue;
                }
                break;
            }
        }

        throw lastError!;
    }

    protected isRetryableError(error: any): boolean {
        // Network errors or 5xx HTTP errors are retryable
        return !error.status || error.status >= 500 || error.status === 408 || error.status === 429;
    }
}