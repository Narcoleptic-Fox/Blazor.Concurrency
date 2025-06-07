import { BaseWorkerModule } from './base-module';
import { ChannelData, PollingData, EventSourceData } from '../generated';
export declare class RealTimeModule extends BaseWorkerModule {
    get moduleName(): string;
    private pollingSubscriptions;
    private eventSourceSubscriptions;
    private channels;
    handleStartPolling(data: PollingData, id: string): Promise<void>;
    handleStopPolling(data: {
        subscriptionId: string;
    }, id: string): Promise<void>;
    handleChangePollingInterval(data: {
        subscriptionId: string;
        newInterval: number;
    }, id: string): Promise<void>;
    handleSubscribeEvents(data: EventSourceData, id: string): Promise<void>;
    handleUnsubscribeEvents(data: {
        subscriptionId: string;
    }, id: string): Promise<void>;
    handleCreateChannel(data: ChannelData, id: string): Promise<void>;
    handleWriteChannel(data: {
        channelName: string;
        data: any;
    }, id: string): Promise<void>;
    handleReadChannel(data: {
        channelName: string;
        readerId?: string;
    }, id: string): Promise<void>;
    handleCompleteChannel(data: {
        channelName: string;
    }, id: string): Promise<void>;
    private generateSubscriptionId;
}
