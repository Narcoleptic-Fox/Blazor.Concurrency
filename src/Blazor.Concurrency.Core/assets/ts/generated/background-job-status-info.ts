/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */

import { BackgroundJobStatus } from "./background-job-status";

export interface BackgroundJobStatusInfo {
    jobId: string;
    status: BackgroundJobStatus;
    progress: number;
    result: Object | null;
    error: string | null;
}
