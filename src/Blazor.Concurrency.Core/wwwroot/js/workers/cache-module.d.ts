import { BaseWorkerModule } from './base-module';
import type { CacheGetRequest, CacheSetRequest, CacheRemoveRequest, CacheGetKeysRequest, CacheExistsRequest } from '../generated';
export declare class CacheModule extends BaseWorkerModule {
    readonly moduleName = "cache";
    private storage;
    private capabilities;
    constructor(orchestrator: any);
    private initializeStorage;
    handleGet(data: CacheGetRequest, id: string): Promise<void>;
    handleSet(data: CacheSetRequest, id: string): Promise<void>;
    handleRemove(data: CacheRemoveRequest, id: string): Promise<void>;
    handleClear(data: any, id: string): Promise<void>;
    handleGetKeys(data: CacheGetKeysRequest, id: string): Promise<void>;
    handleExists(data: CacheExistsRequest, id: string): Promise<void>;
    private ensureStorage;
}
