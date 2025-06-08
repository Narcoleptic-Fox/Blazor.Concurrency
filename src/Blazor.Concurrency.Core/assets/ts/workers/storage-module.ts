import { BaseWorkerModule } from './base-module';
import { StorageDetector, StorageCapabilities } from '../core/storage-detector';
import type {
    StorageGetItemRequest,
    StorageSetItemRequest,
    StorageRemoveItemRequest,
    StorageGetItemResult,
    StorageSetItemResult,
    StorageRemoveItemResult,
    StorageClearResult,
    StorageGetLengthResult,
    StorageGetKeysResult,
    StorageItem
} from '../generated';

interface IStorageProvider {
    getItem(key: string): Promise<StorageItem | null>;
    setItem(key: string, item: StorageItem): Promise<void>;
    removeItem(key: string): Promise<boolean>;
    clear(): Promise<void>;
    getLength(): Promise<number>;
    getAllKeys(): Promise<string[]>;
}

class IndexedDBStorageProvider implements IStorageProvider {
    private db: IDBDatabase | null = null;
    private readonly dbName = 'BlazorConcurrencyStorage';
    private readonly storeName = 'items';

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

    async getItem(key: string): Promise<StorageItem | null> {
        if (!this.db) await this.initialize();

        return new Promise((resolve) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? { value: result.value, timestamp: result.timestamp } : null);
            };
            request.onerror = () => resolve(null);
        });
    }

    async setItem(key: string, item: StorageItem): Promise<void> {
        if (!this.db) await this.initialize();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ key, ...item });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async removeItem(key: string): Promise<boolean> {
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

    async getLength(): Promise<number> {
        if (!this.db) await this.initialize();

        return new Promise((resolve) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(0);
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

class LocalStorageProvider implements IStorageProvider {
    private readonly prefix = 'blazor_storage_';

    async getItem(key: string): Promise<StorageItem | null> {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    }

    async setItem(key: string, item: StorageItem): Promise<void> {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
        } catch (error) {
            throw new Error('Storage quota exceeded');
        }
    }

    async removeItem(key: string): Promise<boolean> {
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

    async getLength(): Promise<number> {
        return (await this.getAllKeys()).length;
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
}

export class StorageModule extends BaseWorkerModule {
    public readonly moduleName = 'storage';
    private provider: IStorageProvider | null = null;
    private capabilities: StorageCapabilities | null = null;

    constructor(orchestrator: any) {
        super(orchestrator);
        this.initializeProvider();
    }

    private async initializeProvider(): Promise<void> {
        this.capabilities = await StorageDetector.detect();

        if (this.capabilities.indexedDB) {
            this.provider = new IndexedDBStorageProvider();
            console.log('Using IndexedDB for persistent storage');
        } else if (this.capabilities.localStorage) {
            this.provider = new LocalStorageProvider();
            console.log('Using localStorage for persistent storage');
        } else {
            throw new Error('No persistent storage available on this device');
        }
    }

    async handleGetItem(data: StorageGetItemRequest, id: string): Promise<void> {
        try {
            await this.ensureProvider();
            const item = await this.provider!.getItem(data.key);
            this.sendResponse({
                hasValue: item !== null,
                value: item?.value || null
            }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    async handleSetItem(data: StorageSetItemRequest, id: string): Promise<void> {
        try {
            await this.ensureProvider();
            await this.provider!.setItem(data.key, {
                value: data.value,
                timestamp: Date.now()
            });
            this.sendResponse({ success: true }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    async handleRemoveItem(data: StorageRemoveItemRequest, id: string): Promise<void> {
        try {
            await this.ensureProvider();
            const success = await this.provider!.removeItem(data.key);
            this.sendResponse({ success }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    async handleClear(data: any, id: string): Promise<void> {
        try {
            await this.ensureProvider();
            await this.provider!.clear();
            this.sendResponse({ success: true }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    async handleGetLength(data: any, id: string): Promise<void> {
        try {
            await this.ensureProvider();
            const length = await this.provider!.getLength();
            this.sendResponse({ length }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    async handleGetKeys(data: any, id: string): Promise<void> {
        try {
            await this.ensureProvider();
            const keys = await this.provider!.getAllKeys();
            this.sendResponse({ keys }, id);
        } catch (error) {
            this.sendError(error as Error, id);
        }
    }

    private async ensureProvider(): Promise<void> {
        if (!this.provider) {
            await this.initializeProvider();
        }
    }
}