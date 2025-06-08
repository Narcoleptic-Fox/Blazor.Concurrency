export class StorageDetector {
    static async detect() {
        if (this.capabilities)
            return this.capabilities;
        const capabilities = {
            indexedDB: false,
            localStorage: false,
            sessionStorage: false,
            memoryOnly: false
        };
        // Test IndexedDB
        capabilities.indexedDB = await this.testIndexedDB();
        // Test localStorage
        capabilities.localStorage = this.testLocalStorage();
        // Test sessionStorage
        capabilities.sessionStorage = this.testSessionStorage();
        // If nothing works, fall back to memory
        capabilities.memoryOnly = !capabilities.indexedDB && !capabilities.localStorage && !capabilities.sessionStorage;
        this.capabilities = capabilities;
        console.log('Storage capabilities detected:', capabilities);
        return capabilities;
    }
    static async testIndexedDB() {
        if (!('indexedDB' in self))
            return false;
        try {
            // Test if we can actually open a database
            const testDB = 'BlazorConcurrencyTest';
            const request = indexedDB.open(testDB, 1);
            return new Promise((resolve) => {
                const timeout = setTimeout(() => resolve(false), 2000);
                request.onsuccess = () => {
                    clearTimeout(timeout);
                    request.result.close();
                    indexedDB.deleteDatabase(testDB);
                    resolve(true);
                };
                request.onerror = () => {
                    clearTimeout(timeout);
                    resolve(false);
                };
                request.onblocked = () => {
                    clearTimeout(timeout);
                    resolve(false);
                };
            });
        }
        catch {
            return false;
        }
    }
    static testLocalStorage() {
        try {
            const testKey = '__blazor_concurrency_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        }
        catch {
            return false;
        }
    }
    static testSessionStorage() {
        try {
            const testKey = '__blazor_concurrency_test__';
            sessionStorage.setItem(testKey, 'test');
            sessionStorage.removeItem(testKey);
            return true;
        }
        catch {
            return false;
        }
    }
}
StorageDetector.capabilities = null;
//# sourceMappingURL=storage-detector.js.map