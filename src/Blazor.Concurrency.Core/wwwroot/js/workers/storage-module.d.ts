import { BaseWorkerModule } from './base-module';
import type { StorageGetItemRequest, StorageSetItemRequest, StorageRemoveItemRequest } from '../generated';
export declare class StorageModule extends BaseWorkerModule {
    readonly moduleName = "storage";
    private provider;
    private capabilities;
    constructor(orchestrator: any);
    private initializeProvider;
    handleGetItem(data: StorageGetItemRequest, id: string): Promise<void>;
    handleSetItem(data: StorageSetItemRequest, id: string): Promise<void>;
    handleRemoveItem(data: StorageRemoveItemRequest, id: string): Promise<void>;
    handleClear(data: any, id: string): Promise<void>;
    handleGetLength(data: any, id: string): Promise<void>;
    handleGetKeys(data: any, id: string): Promise<void>;
    private ensureProvider;
}
