/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { WorkerError } from "./worker-error";

export interface WorkerResponse {
    id: string;
    type: string;
    data: Object | null;
    error: WorkerError | null;
    metadata: Record<string, any> | null;
    timestamp: Date;
}
