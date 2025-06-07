import { BaseWorkerModule } from './base-module';
import {
    BatchRequest,
    BatchResult,
    BatchRequestError,
    HttpRequestData,
    HttpResponse,
} from '../generated';

export class HttpModule extends BaseWorkerModule {
    get moduleName(): string {
        return 'http';
    }

    private defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    async handleGet(data: HttpRequestData, id: string): Promise<void> {
        const response = await this.makeRequest(data.url, 'GET', undefined, data.headers, data.timeoutMs);
        this.sendResponse(response, id);
    }

    async handlePost(data: HttpRequestData, id: string): Promise<void> {
        const response = await this.makeRequest(data.url, 'POST', data.body, data.headers, data.timeoutMs);
        this.sendResponse(response, id);
    }

    async handlePut(data: HttpRequestData, id: string): Promise<void> {
        const response = await this.makeRequest(data.url, 'PUT', data.body, data.headers, data.timeoutMs);
        this.sendResponse(response, id);
    }

    async handlePatch(data: HttpRequestData, id: string): Promise<void> {
        const response = await this.makeRequest(data.url, 'PATCH', data.body, data.headers, data.timeoutMs);
        this.sendResponse(response, id);
    }

    async handleDelete(data: HttpRequestData, id: string): Promise<void> {
        const response = await this.makeRequest(data.url, 'DELETE', undefined, data.headers, data.timeoutMs);
        this.sendResponse(response, id);
    }

    async handleRetry(data: HttpRequestData, id: string): Promise<void> {
        const { url, method = 'GET', body, headers, maxRetries = 3 } = data;

        try {
            const response = await this.withRetry(
                () => this.makeRequest(url, method, body, headers),
                maxRetries,
                1000
            );
            this.sendResponse(response, id);
        } catch (error) {
            this.sendError(error as Error, id, 'RETRY_EXHAUSTED');
        }
    }

    async handleBatch(data: { requests: BatchRequest[] }, id: string): Promise<void> {
        const results: any[] = [];
        const errors: BatchRequestError[] = [];

        // Execute requests in parallel
        const promises = data.requests.map(async (request, index) => {
            try {
                const response = await this.makeRequest(
                    request.url,
                    request.method || 'GET',
                    request.body,
                    request.headers
                );
                return { index, result: response };
            } catch (error) {
                return {
                    index,
                    error: {
                        index,
                        url: request.url,
                        errorMessage: (error as Error).message,
                        errorCode: (error as any).code || 'UNKNOWN'
                    } as BatchRequestError
                };
            }
        });

        const responses = await Promise.allSettled(promises);

        responses.forEach((response, index) => {
            if (response.status === 'fulfilled') {
                const { result, error } = response.value;
                if (error) {
                    errors.push(error);
                } else {
                    results[index] = result;
                }
            } else {
                errors.push({
                    index,
                    url: data.requests[index].url,
                    errorMessage: response.reason?.message || 'Unknown error',
                    errorCode: 'PROMISE_REJECTED'
                } as BatchRequestError);
            }
        });

        const batchResult: BatchResult<any> = {
            results,
            errors,
            hasErrors: errors.length > 0,
            isSuccess: errors.length === 0,
            totalRequests: data.requests.length,
            successfulRequests: results.filter(r => r !== undefined).length,
            failedRequests: errors.length
        };

        this.sendResponse(batchResult, id);
    }

    private async makeRequest(
        url: string,
        method: string,
        body?: any,
        headers?: Record<string, string> | null,
        timeout?: number | null
    ): Promise<any> {
        const requestHeaders = { ...this.defaultHeaders, ...headers };

        const options: RequestInit = {
            method,
            headers: requestHeaders
        };

        if (body && method !== 'GET' && method !== 'HEAD') {
            if (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof ArrayBuffer)) {
                options.body = JSON.stringify(body);
            } else {
                options.body = body;
            }
        }

        // Add timeout if specified
        if (timeout) {
            const controller = new AbortController();
            options.signal = controller.signal;
            setTimeout(() => controller.abort(), timeout);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as any;
            error.status = response.status;
            error.statusText = response.statusText;
            error.code = `HTTP_${response.status}`;

            // Try to get error details from response body
            try {
                const errorBody = await response.text();
                if (errorBody) {
                    error.details = errorBody;
                }
            } catch {
                // Ignore error reading body
            }

            throw error;
        }

        // Handle different content types
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            return await response.json();
        } else if (contentType.includes('text/')) {
            return await response.text();
        } else {
            // Return as array buffer for binary data
            const buffer = await response.arrayBuffer();
            return {
                data: Array.from(new Uint8Array(buffer)),
                contentType: contentType,
                size: buffer.byteLength
            };
        }
    }
}