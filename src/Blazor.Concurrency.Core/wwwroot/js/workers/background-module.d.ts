import { BaseWorkerModule } from './base-module';
import { ExecuteTaskRequest, ParallelTaskRequest, ProcessDataRequest, QueueJobRequest } from '../generated';
export declare class BackgroundModule extends BaseWorkerModule {
    get moduleName(): string;
    private jobQueue;
    private runningJobs;
    private isProcessingQueue;
    handleProcessData(data: ProcessDataRequest, id: string): Promise<void>;
    handleExecuteTask(data: ExecuteTaskRequest, id: string): Promise<void>;
    handleQueueJob(data: QueueJobRequest, id: string): Promise<void>;
    handleExecuteParallel(data: ParallelTaskRequest, id: string): Promise<void>;
    handleGetJobStatus(data: {
        jobId: string;
    }, id: string): Promise<void>;
    handleCancelJob(data: {
        jobId: string;
    }, id: string): Promise<void>;
    private processDataWithProgress;
    private executeTaskWithProgress;
    private executeParallelTasks;
    private processJobQueue;
    private calculateFibonacci;
    private calculatePrimes;
    private calculateHash;
    private compressData;
    private analyzeData;
    private generateJobId;
}
