import { BaseWorkerModule } from './base-module';
import { BatchRequest, HttpRequestData } from '../generated';
export declare class HttpModule extends BaseWorkerModule {
    get moduleName(): string;
    private defaultHeaders;
    handleGet(data: HttpRequestData, id: string): Promise<void>;
    handlePost(data: HttpRequestData, id: string): Promise<void>;
    handlePut(data: HttpRequestData, id: string): Promise<void>;
    handlePatch(data: HttpRequestData, id: string): Promise<void>;
    handleDelete(data: HttpRequestData, id: string): Promise<void>;
    handleRetry(data: HttpRequestData, id: string): Promise<void>;
    handleBatch(data: {
        requests: BatchRequest[];
    }, id: string): Promise<void>;
    private makeRequest;
}
