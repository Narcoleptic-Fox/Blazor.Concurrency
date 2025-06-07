import type { WorkerOrchestrator } from '../core/worker-orchestrator';
export declare abstract class BaseWorkerModule {
    protected orchestrator: WorkerOrchestrator;
    constructor(orchestrator: WorkerOrchestrator);
    abstract get moduleName(): string;
    handleOperation(operation: string, data: any, id: string): Promise<void>;
    protected sendResponse(data: any, id: string, metadata?: Record<string, any>): void;
    protected sendError(error: Error | string, id: string, code?: string): void;
    protected sendProgress(progressPercentage: number, id: string, metadata?: Record<string, any>): void;
    protected sendStreamData(data: any, id: string): void;
    protected sendStreamError(error: string, id: string): void;
    private capitalizeFirst;
    protected sleep(ms: number): Promise<void>;
    protected withRetry<T>(operation: () => Promise<T>, maxRetries?: number, baseDelay?: number): Promise<T>;
    protected isRetryableError(error: any): boolean;
}
