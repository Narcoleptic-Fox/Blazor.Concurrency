import { BaseWorkerModule } from './base-module';
import { StorageDetector, StorageCapabilities } from '../core/storage-detector';
import type {
    CacheGetRequest,
    CacheSetRequest,
    CacheRemoveRequest,
    CacheGetKeysRequest,
    CacheExistsRequest,
    CacheGetResult,
    CacheSetResult,
    CacheRemoveResult,
    CacheClearResult,
    CacheGetKeysResult,
    CacheExistsResult,
    CacheEntry
} from '../generated';

// Storage interfaces remain the same
interface ICacheStorage {
    get(key: string): Promise<CacheEntry | null>;
    set(key: string, entry: CacheEntry): Promise<void>;
    remove(key: string): Promise<boolean>;
    clear(): Promise<void>;
    getAllKeys(): Promise<string[]>;
}

class IndexedDBCacheStorage implements ICacheStorage {
    private db: IDBDatabase | null = null;
    private readonly dbName = 'BlazorConcurrencyCache';
    private readonly storeName = 'entries';

    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'key' });
                }
            };
        });
    }

    async get(key: string): Promise<CacheEntry | null> {
        if (!this.db) await this.initialize();

        return new Promise((resolve) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? {
                    value: result.value,
                    timestamp: result.timestamp,
                    expiry: result.expiry
                } : null);
            };
            request.onerror = () => resolve(null);
        });
    }

    async set(key: string, entry: CacheEntry): Promise<void> {
        if (!this.db) await this.initialize();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ key, ...entry });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async remove(key: string): Promise<boolean> {
        if (!this.db) await this.initialize();

        return new Promise((resolve) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    }

    async clear(): Promise<void> {
        if (!this.db) await this.initialize();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAllKeys(): Promise<string[]> {
        if (!this.db) await this.initialize();

        return new Promise((resolve) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();

            request.onsuccess = () => resolve(request.result as string[]);
            request.onerror = () => resolve([]);
        });
    }
}

class LocalStorageCacheStorage implements ICacheStorage {
    private readonly prefix = 'blazor_cache_';

    async get(key: string): Promise<CacheEntry | null> {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    }

    async set(key: string, entry: CacheEntry): Promise<void> {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(entry));
        } catch (error) {
            await this.cleanupExpired();
            throw error;
        }
    }

    async remove(key: string): Promise<boolean> {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch {
            return false;
        }
    }

    async clear(): Promise<void> {
        const keys = await this.getAllKeys();
        for (const key of keys) {
            localStorage.removeItem(this.prefix + key);
        }
    }

    async getAllKeys(): Promise<string[]> {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.prefix)) {
                keys.push(key.substring(this.prefix.length));
            }
        }
        return keys;
    }

    private async cleanupExpired(): Promise<void> {
        const keys = await this.getAllKeys();
        const now = Date.now();

        for (const key of keys) {
            const entry = await this.get(key);
            if (entry?.expiry && now > entry.expiry) {
                await this.remove(key);
            }
        }
    }
}

class MemoryCacheStorage implements ICacheStorage {
    private cache = new Map<string, CacheEntry>();

    async get(key: string): Promise<CacheEntry | null> {
        return this.cache.get(key) || null;
    }

    async set(key: string, entry: CacheEntry): Promise<void> {
        this.cache.set(key, entry);

        if (this.cache.size > 1000) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey != undefined)
                this.cache.delete(oldestKey);
        }
    }

    async remove(key: string): Promise<boolean> {
        return this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }

    async getAllKeys(): Promise<string[]> {
        return Array.from(this.cache.keys());
    }
}

export class CacheModule extends BaseWorkerModule {
    public readonly moduleName = 'cache';
    private storage: ICacheStorage | null = null;
    private capabilities: StorageCapabilities | null = null;

    constructor(orchestrator: any) {
        super(orchestrator);
        this.initializeStorage();
    }

    private async initializeStorage(): Promise<void> {
        this.capabilities = await StorageDetector.detect();

        if (this.capabilities.indexedDB) {
            this.storage = new IndexedDBCacheStorage();
            console.log('Using IndexedDB for cache storage');
        } else if (this.capabilities.localStorage) {
            this.storage = new LocalStorageCacheStorage();
            console.log('Using localStorage for cache storage');
        } else {
            this.storage = new MemoryCacheStorage();
            console.log('Using memory-only cache storage');
        }
    }

    async handleGet(data: CacheGetRequest, id: string): Promise<void> {
        try {
            await this.ensureStorage();

            const entry = await this.storage!.get(data.key);

            if (!entry) {
                this.sendResponse({ hasValue: false, value: null }, id);
                return;
            }

            const now = Date.now();
            if (entry.expiry && now > entry.expiry) {
                await this.storage!.remove(data.key);
                this.sendResponse({ hasValue: false, value: null }, id);
                return;
            }

            this.sendResponse({ hasValue: true, value: entry.value }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    async handleSet(data: CacheSetRequest, id: string): Promise<void> {
        try {
            await this.ensureStorage();

            const entry: CacheEntry = {
                value: data.value,
                timestamp: Date.now(),
                expiry: data.expiryMs ? Date.now() + data.expiryMs : null
            };

            await this.storage!.set(data.key, entry);
            this.sendResponse({ success: true }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    async handleRemove(data: CacheRemoveRequest, id: string): Promise<void> {
        try {
            await this.ensureStorage();
            const success = await this.storage!.remove(data.key);
            this.sendResponse({ success }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    async handleClear(data: any, id: string): Promise<void> {
        try {
            await this.ensureStorage();
            await this.storage!.clear();
            this.sendResponse({ success: true }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    async handleGetKeys(data: CacheGetKeysRequest, id: string): Promise<void> {
        try {
            await this.ensureStorage();
            let keys = await this.storage!.getAllKeys();

            if (data.pattern) {
                const regex = new RegExp(data.pattern.replace(/\*/g, '.*'));
                keys = keys.filter(key => regex.test(key));
            }

            this.sendResponse({ keys }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    async handleExists(data: CacheExistsRequest, id: string): Promise<void> {
        try {
            await this.ensureStorage();
            const entry = await this.storage!.get(data.key);
            const exists = entry !== null && (!entry.expiry || Date.now() <= entry.expiry);
            this.sendResponse({ exists }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    private async ensureStorage(): Promise<void> {
        if (!this.storage) {
            await this.initializeStorage();
        }
    }
}