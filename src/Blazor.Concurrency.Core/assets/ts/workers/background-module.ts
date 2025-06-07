import { BaseWorkerModule } from './base-module';
import {
    BackgroundJobStatus,
    ExecuteTaskRequest,
    ParallelProgress,
    ParallelTaskRequest,
    ParallelTask,
    ProcessDataRequest,
    QueueJobRequest,
} from '../generated';

interface BackgroundJob {
    id: string;
    type: string;
    parameters: any;
    priority: number;
    status: BackgroundJobStatus;
    progress: number;
    result?: any;
    error?: string;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
}

export class BackgroundModule extends BaseWorkerModule {
    get moduleName(): string {
        return 'background';
    }

    private jobQueue: BackgroundJob[] = [];
    private runningJobs = new Map<string, BackgroundJob>();
    private isProcessingQueue = false;

    async handleProcessData(data: ProcessDataRequest, id: string): Promise<void> {
        const { data: inputData, processorType = 'default' } = data;

        try {
            // Simulate data processing with progress reporting
            const result = await this.processDataWithProgress(inputData, processorType, (progress) => {
                this.sendProgress(progress, id);
            });

            this.sendResponse(result, id);
        } catch (error) {
            this.sendError(error as Error, id, 'DATA_PROCESSING_FAILED');
        }
    }

    async handleExecuteTask(data: ExecuteTaskRequest, id: string): Promise<void> {
        const { taskType, payload } = data;

        try {
            const result = await this.executeTaskWithProgress(taskType, payload, (progress) => {
                this.sendProgress(progress, id);
            });

            this.sendResponse(result, id);
        } catch (error) {
            this.sendError(error as Error, id, 'TASK_EXECUTION_FAILED');
        }
    }

    async handleQueueJob(data: QueueJobRequest, id: string): Promise<void> {
        const { jobType, parameters, priority = 0 } = data;

        const job: BackgroundJob = {
            id: this.generateJobId(),
            type: jobType,
            parameters,
            priority,
            status: BackgroundJobStatus.Queued,
            progress: 0,
            createdAt: Date.now()
        };

        // Add to queue in priority order
        this.jobQueue.push(job);
        this.jobQueue.sort((a, b) => b.priority - a.priority);

        // Start processing if not already running
        if (!this.isProcessingQueue) {
            this.processJobQueue();
        }

        this.sendResponse({
            jobId: job.id,
            status: BackgroundJobStatus.Queued,
            queuePosition: this.jobQueue.findIndex(j => j.id === job.id) + 1
        }, id);
    }

    async handleExecuteParallel(data: ParallelTaskRequest, id: string): Promise<void> {
        const { tasks } = data;

        try {
            const results = await this.executeParallelTasks(tasks, (progress) => {
                this.sendProgress(progress.completedTasks / progress.totalTasks * 100, id, {
                    completedTasks: progress.completedTasks,
                    totalTasks: progress.totalTasks,
                    taskProgress: progress.taskProgress
                });
            });

            this.sendResponse(results, id);
        } catch (error) {
            this.sendError(error as Error, id, 'PARALLEL_EXECUTION_FAILED');
        }
    }

    async handleGetJobStatus(data: { jobId: string }, id: string): Promise<void> {
        const { jobId } = data;

        const job = this.runningJobs.get(jobId) ||
            this.jobQueue.find(j => j.id === jobId);

        if (!job) {
            this.sendError(new Error('Job not found'), id, 'JOB_NOT_FOUND');
            return;
        }

        this.sendResponse({
            jobId: job.id,
            status: job.status,
            progress: job.progress,
            result: job.result,
            error: job.error
        }, id);
    }

    async handleCancelJob(data: { jobId: string }, id: string): Promise<void> {
        const { jobId } = data;

        // Check if job is queued
        const queueIndex = this.jobQueue.findIndex(j => j.id === jobId);
        if (queueIndex !== -1) {
            const job = this.jobQueue[queueIndex];
            job.status = BackgroundJobStatus.Cancelled;
            this.jobQueue.splice(queueIndex, 1);

            this.sendResponse({ success: true, jobId, status: 'cancelled' }, id);
            return;
        }

        // Check if job is running
        const runningJob = this.runningJobs.get(jobId);
        if (runningJob) {
            runningJob.status = BackgroundJobStatus.Cancelled;
            this.sendResponse({ success: true, jobId, status: 'cancelled' }, id);
            return;
        }

        this.sendError(new Error('Job not found'), id, 'JOB_NOT_FOUND');
    }

    private async processDataWithProgress(
        data: any,
        processorType: string,
        onProgress: (progress: number) => void
    ): Promise<any> {
        // Simulate processing with progress updates
        const steps = 10;
        const result = { processed: true, processorType, inputSize: 0 };

        if (Array.isArray(data)) {
            result.inputSize = data.length;

            for (let i = 0; i < steps; i++) {
                await this.sleep(100); // Simulate work
                onProgress(Math.round((i + 1) / steps * 100));
            }

            // Apply processing based on type
            switch (processorType) {
                case 'sort':
                    return { ...result, sortedData: [...data].sort() };
                case 'filter':
                    return { ...result, filteredData: data.filter(item => item != null) };
                case 'transform':
                    return { ...result, transformedData: data.map(item => ({ processed: item })) };
                default:
                    return { ...result, data };
            }
        } else {
            result.inputSize = JSON.stringify(data).length;

            for (let i = 0; i < steps; i++) {
                await this.sleep(50);
                onProgress(Math.round((i + 1) / steps * 100));
            }

            return { ...result, data };
        }
    }

    private async executeTaskWithProgress(
        taskType: string,
        payload: any,
        onProgress: (progress: number) => void
    ): Promise<any> {
        const startTime = Date.now();

        switch (taskType) {
            case 'fibonacci':
                return await this.calculateFibonacci(payload.n || 10, onProgress);

            case 'prime':
                return await this.calculatePrimes(payload.limit || 1000, onProgress);

            case 'hash':
                return await this.calculateHash(payload.data || '', onProgress);

            case 'compress':
                return await this.compressData(payload.data || '', onProgress);

            case 'analyze':
                return await this.analyzeData(payload.data || [], onProgress);

            default:
                // Generic task simulation
                const steps = 20;
                for (let i = 0; i < steps; i++) {
                    await this.sleep(100);
                    onProgress(Math.round((i + 1) / steps * 100));
                }

                return {
                    taskType,
                    payload,
                    executionTime: Date.now() - startTime,
                    result: 'Task completed successfully'
                };
        }
    }

    private async executeParallelTasks(
        tasks: ParallelTask[],
        onProgress: (progress: { completedTasks: number; totalTasks: number; taskProgress: Record<string, number> }) => void
    ): Promise<any[]> {
        const taskProgress: Record<string, number> = {};
        let completedTasks = 0;

        // Initialize progress tracking
        tasks.forEach((task, index) => {
            const taskId = task.taskId || `task_${index}`;
            taskProgress[taskId] = 0;
        });

        // Execute tasks in parallel
        const promises = tasks.map(async (task, index) => {
            const taskId = task.taskId || `task_${index}`;

            try {
                const result = await this.executeTaskWithProgress(
                    task.taskType,
                    task.payload,
                    (progress) => {
                        taskProgress[taskId] = progress;
                        onProgress({ completedTasks, totalTasks: tasks.length, taskProgress });
                    }
                );

                completedTasks++;
                taskProgress[taskId] = 100;
                onProgress({ completedTasks, totalTasks: tasks.length, taskProgress });

                return result;
            } catch (error) {
                completedTasks++;
                taskProgress[taskId] = -1; // Error state
                onProgress({ completedTasks, totalTasks: tasks.length, taskProgress });
                throw error;
            }
        });

        return await Promise.all(promises);
    }

    private async processJobQueue(): Promise<void> {
        this.isProcessingQueue = true;

        while (this.jobQueue.length > 0) {
            const job = this.jobQueue.shift()!;

            if (job.status === BackgroundJobStatus.Cancelled) continue;

            job.status = BackgroundJobStatus.Running;
            job.startedAt = Date.now();
            this.runningJobs.set(job.id, job);

            try {
                const result = await this.executeTaskWithProgress(
                    job.type,
                    job.parameters,
                    (progress) => {
                        job.progress = progress;
                        // Notify about job progress
                        this.sendStreamData({
                            jobId: job.id,
                            progress,
                            status: 'running'
                        }, `job_progress_${Date.now()}`);
                    }
                );

                job.status = BackgroundJobStatus.Completed;
                job.result = result;
                job.progress = 100;
                job.completedAt = Date.now();

                // Notify about job completion
                this.sendStreamData({
                    jobId: job.id,
                    status: 'completed',
                    result
                }, `job_completed_${Date.now()}`);
            } catch (error) {
                job.status = BackgroundJobStatus.Failed;
                job.error = (error as Error).message;
                job.completedAt = Date.now();

                // Notify about job failure
                this.sendStreamData({
                    jobId: job.id,
                    status: 'failed',
                    error: job.error
                }, `job_failed_${Date.now()}`);
            } finally {
                this.runningJobs.delete(job.id);
            }
        }

        this.isProcessingQueue = false;
    }

    // Specific computation methods
    private async calculateFibonacci(n: number, onProgress: (progress: number) => void): Promise<number[]> {
        const result: number[] = [0, 1];

        for (let i = 2; i < n; i++) {
            result[i] = result[i - 1] + result[i - 2];

            if (i % Math.ceil(n / 100) === 0) {
                onProgress(Math.round((i / n) * 100));
                await this.sleep(1); // Yield control
            }
        }

        onProgress(100);
        return result;
    }

    private async calculatePrimes(limit: number, onProgress: (progress: number) => void): Promise<number[]> {
        const primes: number[] = [];
        const sieve = new Array(limit + 1).fill(true);
        sieve[0] = sieve[1] = false;

        for (let i = 2; i <= limit; i++) {
            if (sieve[i]) {
                primes.push(i);
                for (let j = i * i; j <= limit; j += i) {
                    sieve[j] = false;
                }
            }

            if (i % Math.ceil(limit / 100) === 0) {
                onProgress(Math.round((i / limit) * 100));
                await this.sleep(1);
            }
        }

        onProgress(100);
        return primes;
    }

    private async calculateHash(data: string, onProgress: (progress: number) => void): Promise<string> {
        // Simple hash function for demonstration
        let hash = 0;
        const len = data.length;

        for (let i = 0; i < len; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer

            if (i % Math.ceil(len / 100) === 0) {
                onProgress(Math.round((i / len) * 100));
                await this.sleep(1);
            }
        }

        onProgress(100);
        return hash.toString(16);
    }

    private async compressData(data: string, onProgress: (progress: number) => void): Promise<{ compressed: string; ratio: number }> {
        // Simple run-length encoding for demonstration
        let compressed = '';
        let current = data[0];
        let count = 1;

        for (let i = 1; i < data.length; i++) {
            if (data[i] === current) {
                count++;
            } else {
                compressed += count > 1 ? `${count}${current}` : current;
                current = data[i];
                count = 1;
            }

            if (i % Math.ceil(data.length / 100) === 0) {
                onProgress(Math.round((i / data.length) * 100));
                await this.sleep(1);
            }
        }

        compressed += count > 1 ? `${count}${current}` : current;
        onProgress(100);

        return {
            compressed,
            ratio: compressed.length / data.length
        };
    }

    private async analyzeData(data: any[], onProgress: (progress: number) => void): Promise<any> {
        const analysis = {
            count: data.length,
            types: {} as Record<string, number>,
            nullCount: 0,
            uniqueValues: new Set()
        };

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const type = typeof item;

            analysis.types[type] = (analysis.types[type] || 0) + 1;

            if (item === null || item === undefined) {
                analysis.nullCount++;
            } else {
                analysis.uniqueValues.add(item);
            }

            if (i % Math.ceil(data.length / 100) === 0) {
                onProgress(Math.round((i / data.length) * 100));
                await this.sleep(1);
            }
        }

        onProgress(100);

        return {
            ...analysis,
            uniqueCount: analysis.uniqueValues.size,
            uniqueValues: undefined // Remove set from response
        };
    }

    private generateJobId(): string {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}