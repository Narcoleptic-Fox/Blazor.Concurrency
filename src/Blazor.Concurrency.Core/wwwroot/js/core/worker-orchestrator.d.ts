interface ModuleConstructor {
    new (orchestrator: WorkerOrchestrator): IWorkerModule;
}
interface IWorkerModule {
    readonly moduleName: string;
    handleOperation(operation: string, data: any, id: string): Promise<void>;
}
/**
 * Complete Worker Orchestrator with all modules
 */
export declare class WorkerOrchestrator {
    private modules;
    private activeOperations;
    private operationCounter;
    private startTime;
    private isInitialized;
    constructor();
    private initialize;
    registerModule(name: string, moduleClass: ModuleConstructor): void;
    private handleMessage;
    private handleSystemMessage;
    private handleHealthCheck;
    private handleListModules;
    private handleModuleRegistration;
    private importScript;
    sendResponse(type: string, data: any, id: string, metadata?: Record<string, any>): void;
    sendProgress(progressPercentage: number, id: string, metadata?: Record<string, any>): void;
    sendStreamData(data: any, id: string): void;
    sendStreamError(error: string, id: string): void;
    generateOperationId(): string;
}
export {};
