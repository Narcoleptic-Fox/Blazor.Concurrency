import type { WorkerRequest, WorkerResponse } from '../generated';
import { HttpModule } from '../workers/http-module';
import { WebSocketModule } from '../workers/websocket-module';
import { RealTimeModule } from '../workers/realtime-module';
import { BackgroundModule } from '../workers/background-module';

interface ModuleConstructor {
    new(orchestrator: WorkerOrchestrator): IWorkerModule;
}

interface IWorkerModule {
    readonly moduleName: string;
    handleOperation(operation: string, data: any, id: string): Promise<void>;
}

interface ActiveOperation {
    module: string;
    operation: string;
    startTime: number;
    status: 'running' | 'completed' | 'failed';
}

/**
 * Complete Worker Orchestrator with all modules
 */
export class WorkerOrchestrator {
    private modules = new Map<string, IWorkerModule>();
    private activeOperations = new Map<string, ActiveOperation>();
    private operationCounter = 0;
    private startTime = Date.now();
    private isInitialized = false;

    constructor() {
        self.onmessage = this.handleMessage.bind(this);
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            // Register all built-in modules
            this.registerModule('http', HttpModule);
            this.registerModule('websocket', WebSocketModule);
            this.registerModule('realtime', RealTimeModule);
            this.registerModule('background', BackgroundModule);

            this.isInitialized = true;
            this.sendResponse('SYSTEM', { status: 'initialized', modules: Array.from(this.modules.keys()) }, 'init');
            console.log('Worker orchestrator initialized with modules:', Array.from(this.modules.keys()));
        } catch (error) {
            this.sendResponse('ERROR', { error: (error as Error).message }, 'init');
            console.error('Failed to initialize worker orchestrator:', error);
        }
    }

    registerModule(name: string, moduleClass: ModuleConstructor): void {
        try {
            const moduleInstance = new moduleClass(this);
            this.modules.set(name, moduleInstance);
            console.log(`Registered module: ${name}`);
        } catch (error) {
            console.error(`Failed to register module ${name}:`, error);
            throw error;
        }
    }

    private async handleMessage(e: MessageEvent): Promise<void> {
        const message = e.data as WorkerRequest;

        try {
            if (message.module === 'SYSTEM') {
                await this.handleSystemMessage(message);
                return;
            }

            const { module, operation, data, id } = message;

            if (!id) {
                throw new Error('Message must have an ID');
            }

            const moduleInstance = this.modules.get(module);
            if (!moduleInstance) {
                throw new Error(`Module '${module}' not found. Available modules: ${Array.from(this.modules.keys()).join(', ')}`);
            }

            // Track the operation
            this.activeOperations.set(id, {
                module,
                operation,
                startTime: Date.now(),
                status: 'running'
            });

            // Execute the operation
            await moduleInstance.handleOperation(operation, data, id);

        } catch (error) {
            console.error('Worker orchestrator error:', error);
            this.sendResponse('ERROR', {
                error: (error as Error).message,
                stack: (error as Error).stack
            }, message.id || 'unknown');
        }
    }

    private async handleSystemMessage(message: WorkerRequest): Promise<void> {
        switch (message.operation) {
            case 'getHealth':
                this.handleHealthCheck(message);
                break;
            case 'registerModule':
                await this.handleModuleRegistration(message);
                break;
            case 'listModules':
                this.handleListModules(message);
                break;
            default:
                throw new Error(`Unknown system operation: ${message.operation}`);
        }
    }

    private handleHealthCheck(message: WorkerRequest): void {
        const health = {
            isHealthy: this.isInitialized,
            activeOperations: this.activeOperations.size,
            registeredModules: Array.from(this.modules.keys()),
            metrics: {
                totalOperations: this.operationCounter,
                uptime: Date.now() - this.startTime,
                memoryUsage: (performance as any).memory ? {
                    used: (performance as any).memory.usedJSHeapSize,
                    total: (performance as any).memory.totalJSHeapSize,
                    limit: (performance as any).memory.jsHeapSizeLimit
                } : undefined
            }
        };

        this.sendResponse('SUCCESS', health, message.id);
    }

    private handleListModules(message: WorkerRequest): void {
        const modules = Array.from(this.modules.entries()).map(([name, module]) => ({
            name,
            moduleName: module.moduleName
        }));

        this.sendResponse('SUCCESS', { modules }, message.id);
    }

    private async handleModuleRegistration(message: WorkerRequest): Promise<void> {
        try {
            const { moduleName, scriptPath } = message.data as { moduleName: string; scriptPath: string };

            // Dynamic import of external module
            await this.importScript(scriptPath);

            this.sendResponse('SUCCESS', { registered: moduleName }, message.id);

        } catch (error) {
            this.sendResponse('ERROR', {
                error: `Failed to register module: ${(error as Error).message}`
            }, message.id);
        }
    }

    private async importScript(scriptPath: string): Promise<void> {
        if (typeof importScripts !== 'undefined') {
            // Use importScripts for compatibility
            importScripts(scriptPath);
        } else {
            // Use dynamic import for ES6 modules
            await import(scriptPath);
        }
    }

    sendResponse(type: string, data: any, id: string, metadata: Record<string, any> = {}): void {
        const response: WorkerResponse = {
            type,
            data,
            id,
            timestamp: new Date(),
            metadata,
            error: type === 'ERROR' ? data : undefined
        };

        self.postMessage(response);

        // Update operation tracking
        if (id && this.activeOperations.has(id)) {
            if (type === 'SUCCESS' || type === 'ERROR') {
                const operation = this.activeOperations.get(id)!;
                operation.status = type === 'SUCCESS' ? 'completed' : 'failed';
                this.activeOperations.delete(id);
                this.operationCounter++;
            }
        }
    }

    sendProgress(progressPercentage: number, id: string, metadata: Record<string, any> = {}): void {
        this.sendResponse('PROGRESS', progressPercentage, id, metadata);
    }

    sendStreamData(data: any, id: string): void {
        this.sendResponse('STREAM_DATA', data, id);
    }

    sendStreamError(error: string, id: string): void {
        this.sendResponse('STREAM_ERROR', { error }, id);
    }

    generateOperationId(): string {
        return `op_${++this.operationCounter}_${Date.now()}`;
    }
}

// Initialize the orchestrator
new WorkerOrchestrator();