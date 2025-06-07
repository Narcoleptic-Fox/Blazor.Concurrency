/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

export interface WorkerRequest {
    id: string;
    module: string;
    operation: string;
    data: Object | null;
    metadata: Record<string, any> | null;
    timestamp: Date;
}
