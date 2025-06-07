import { HttpModule } from '../workers/http-module';
import { WebSocketModule } from '../workers/websocket-module';
import { RealTimeModule } from '../workers/realtime-module';
import { BackgroundModule } from '../workers/background-module';
/**
 * Complete Worker Orchestrator with all modules
 */
export class WorkerOrchestrator {
    constructor() {
        this.modules = new Map();
        this.activeOperations = new Map();
        this.operationCounter = 0;
        this.startTime = Date.now();
        this.isInitialized = false;
        self.onmessage = this.handleMessage.bind(this);
        this.initialize();
    }
    async initialize() {
        try {
            // Register all built-in modules
            this.registerModule('http', HttpModule);
            this.registerModule('websocket', WebSocketModule);
            this.registerModule('realtime', RealTimeModule);
            this.registerModule('background', BackgroundModule);
            this.isInitialized = true;
            this.sendResponse('SYSTEM', { status: 'initialized', modules: Array.from(this.modules.keys()) }, 'init');
            console.log('Worker orchestrator initialized with modules:', Array.from(this.modules.keys()));
        }
        catch (error) {
            this.sendResponse('ERROR', { error: error.message }, 'init');
            console.error('Failed to initialize worker orchestrator:', error);
        }
    }
    registerModule(name, moduleClass) {
        try {
            const moduleInstance = new moduleClass(this);
            this.modules.set(name, moduleInstance);
            console.log(`Registered module: ${name}`);
        }
        catch (error) {
            console.error(`Failed to register module ${name}:`, error);
            throw error;
        }
    }
    async handleMessage(e) {
        const message = e.data;
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
        }
        catch (error) {
            console.error('Worker orchestrator error:', error);
            this.sendResponse('ERROR', {
                error: error.message,
                stack: error.stack
            }, message.id || 'unknown');
        }
    }
    async handleSystemMessage(message) {
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
    handleHealthCheck(message) {
        const health = {
            isHealthy: this.isInitialized,
            activeOperations: this.activeOperations.size,
            registeredModules: Array.from(this.modules.keys()),
            metrics: {
                totalOperations: this.operationCounter,
                uptime: Date.now() - this.startTime,
                memoryUsage: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : undefined
            }
        };
        this.sendResponse('SUCCESS', health, message.id);
    }
    handleListModules(message) {
        const modules = Array.from(this.modules.entries()).map(([name, module]) => ({
            name,
            moduleName: module.moduleName
        }));
        this.sendResponse('SUCCESS', { modules }, message.id);
    }
    async handleModuleRegistration(message) {
        try {
            const { moduleName, scriptPath } = message.data;
            // Dynamic import of external module
            await this.importScript(scriptPath);
            this.sendResponse('SUCCESS', { registered: moduleName }, message.id);
        }
        catch (error) {
            this.sendResponse('ERROR', {
                error: `Failed to register module: ${error.message}`
            }, message.id);
        }
    }
    async importScript(scriptPath) {
        if (typeof importScripts !== 'undefined') {
            // Use importScripts for compatibility
            importScripts(scriptPath);
        }
        else {
            // Use dynamic import for ES6 modules
            await import(scriptPath);
        }
    }
    sendResponse(type, data, id, metadata = {}) {
        const response = {
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
                const operation = this.activeOperations.get(id);
                operation.status = type === 'SUCCESS' ? 'completed' : 'failed';
                this.activeOperations.delete(id);
                this.operationCounter++;
            }
        }
    }
    sendProgress(progressPercentage, id, metadata = {}) {
        this.sendResponse('PROGRESS', progressPercentage, id, metadata);
    }
    sendStreamData(data, id) {
        this.sendResponse('STREAM_DATA', data, id);
    }
    sendStreamError(error, id) {
        this.sendResponse('STREAM_ERROR', { error }, id);
    }
    generateOperationId() {
        return `op_${++this.operationCounter}_${Date.now()}`;
    }
}
// Initialize the orchestrator
new WorkerOrchestrator();
//# sourceMappingURL=worker-orchestrator.js.map