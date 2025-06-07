export class BaseWorkerModule {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
    }
    async handleOperation(operation, data, id) {
        const handlerName = `handle${this.capitalizeFirst(operation)}`;
        const handler = this[handlerName];
        if (!handler || typeof handler !== 'function') {
            throw new Error(`Operation '${operation}' not supported by module '${this.moduleName}'`);
        }
        try {
            await handler.call(this, data, id);
        }
        catch (error) {
            console.error(`Error in ${this.moduleName}.${handlerName}:`, error);
            this.sendError(error, id);
        }
    }
    sendResponse(data, id, metadata = {}) {
        this.orchestrator.sendResponse('SUCCESS', data, id, metadata);
    }
    sendError(error, id, code) {
        const errorObj = error instanceof Error ? error : new Error(error);
        this.orchestrator.sendResponse('ERROR', {
            error: errorObj.message,
            code,
            stack: errorObj.stack
        }, id);
    }
    sendProgress(progressPercentage, id, metadata = {}) {
        this.orchestrator.sendProgress(progressPercentage, id, metadata);
    }
    sendStreamData(data, id) {
        this.orchestrator.sendStreamData(data, id);
    }
    sendStreamError(error, id) {
        this.orchestrator.sendStreamError(error, id);
    }
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async withRetry(operation, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        let delay = baseDelay;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt < maxRetries && this.isRetryableError(lastError)) {
                    await this.sleep(delay);
                    delay *= 2; // Exponential backoff
                    continue;
                }
                break;
            }
        }
        throw lastError;
    }
    isRetryableError(error) {
        // Network errors or 5xx HTTP errors are retryable
        return !error.status || error.status >= 500 || error.status === 408 || error.status === 429;
    }
}
//# sourceMappingURL=base-module.js.map