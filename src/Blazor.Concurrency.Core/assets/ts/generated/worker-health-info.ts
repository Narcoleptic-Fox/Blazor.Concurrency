/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

export interface WorkerHealthInfo {
    isHealthy: boolean;
    error: string | null;
    activeOperations: number;
    registeredModules: string[];
    metrics: Record<string, any> | null;
}
