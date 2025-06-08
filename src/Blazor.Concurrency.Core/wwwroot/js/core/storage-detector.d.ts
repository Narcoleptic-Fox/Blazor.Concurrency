export interface StorageCapabilities {
    indexedDB: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    memoryOnly: boolean;
}
export declare class StorageDetector {
    private static capabilities;
    static detect(): Promise<StorageCapabilities>;
    private static testIndexedDB;
    private static testLocalStorage;
    private static testSessionStorage;
}
