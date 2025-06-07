/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { BatchRequestError } from "./batch-request-error";

export interface BatchResult<T> {
    results: T[];
    errors: BatchRequestError[];
    hasErrors: boolean;
    isSuccess: boolean;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
}
