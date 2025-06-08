import { BaseWorkerModule } from './base-module';
import { StorageDetector } from '../core/storage-detector';
class IndexedDBStorageProvider {
    constructor() {
        this.db = null;
        this.dbName = 'BlazorConcurrencyStorage';
        this.storeName = 'items';
    }
    async initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'key' });
                }
            };
        });
    }
    async getItem(key) {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? { value: result.value, timestamp: result.timestamp } : null);
            };
            request.onerror = () => resolve(null);
        });
    }
    async setItem(key, item) {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ key, ...item });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    async removeItem(key) {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    }
    async clear() {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    async getLength() {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(0);
        });
    }
    async getAllKeys() {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve([]);
        });
    }
}
class LocalStorageProvider {
    constructor() {
        this.prefix = 'blazor_storage_';
    }
    async getItem(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        }
        catch {
            return null;
        }
    }
    async setItem(key, item) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
        }
        catch (error) {
            throw new Error('Storage quota exceeded');
        }
    }
    async removeItem(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        }
        catch {
            return false;
        }
    }
    async clear() {
        const keys = await this.getAllKeys();
        for (const key of keys) {
            localStorage.removeItem(this.prefix + key);
        }
    }
    async getLength() {
        return (await this.getAllKeys()).length;
    }
    async getAllKeys() {
        const keys = [];
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
    constructor(orchestrator) {
        super(orchestrator);
        this.moduleName = 'storage';
        this.provider = null;
        this.capabilities = null;
        this.initializeProvider();
    }
    async initializeProvider() {
        this.capabilities = await StorageDetector.detect();
        if (this.capabilities.indexedDB) {
            this.provider = new IndexedDBStorageProvider();
            console.log('Using IndexedDB for persistent storage');
        }
        else if (this.capabilities.localStorage) {
            this.provider = new LocalStorageProvider();
            console.log('Using localStorage for persistent storage');
        }
        else {
            throw new Error('No persistent storage available on this device');
        }
    }
    async handleGetItem(data, id) {
        try {
            await this.ensureProvider();
            const item = await this.provider.getItem(data.key);
            this.sendResponse({
                hasValue: item !== null,
                value: item?.value || null
            }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
    async handleSetItem(data, id) {
        try {
            await this.ensureProvider();
            await this.provider.setItem(data.key, {
                value: data.value,
                timestamp: Date.now()
            });
            this.sendResponse({ success: true }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
    async handleRemoveItem(data, id) {
        try {
            await this.ensureProvider();
            const success = await this.provider.removeItem(data.key);
            this.sendResponse({ success }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
    async handleClear(data, id) {
        try {
            await this.ensureProvider();
            await this.provider.clear();
            this.sendResponse({ success: true }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
    async handleGetLength(data, id) {
        try {
            await this.ensureProvider();
            const length = await this.provider.getLength();
            this.sendResponse({ length }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
    async handleGetKeys(data, id) {
        try {
            await this.ensureProvider();
            const keys = await this.provider.getAllKeys();
            this.sendResponse({ keys }, id);
        }
        catch (error) {
            this.sendError(error, id);
        }
    }
    async ensureProvider() {
        if (!this.provider) {
            await this.initializeProvider();
        }
    }
}
//# sourceMappingURL=storage-module.js.map