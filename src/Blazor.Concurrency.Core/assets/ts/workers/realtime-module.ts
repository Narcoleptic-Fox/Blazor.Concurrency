import { BaseWorkerModule } from './base-module';
import {
    ChannelData,
    ServerSentEvent,
    PollingData,
    PollingSubscriptionResult,
    EventSourceData,
    EventSubscriptionResult
} from '../generated';


interface PollingSubscription {
    id: string;
    url: string;
    intervalMs: number;
    intervalId: number;
    isActive: boolean;
}

interface EventSourceSubscription {
    id: string;
    url: string;
    eventSource: EventSource;
    isActive: boolean;
}

interface Channel<T = any> {
    name: string;
    capacity: number;
    buffer: T[];
    readers: string[];
    isCompleted: boolean;
}

export class RealTimeModule extends BaseWorkerModule {
    get moduleName(): string {
        return 'realtime';
    }

    private pollingSubscriptions = new Map<string, PollingSubscription>();
    private eventSourceSubscriptions = new Map<string, EventSourceSubscription>();
    private channels = new Map<string, Channel>();

    async handleStartPolling(data: PollingData, id: string): Promise<void> {
        const { url, intervalMs, subscriptionId = this.generateSubscriptionId() } = data;

        try {
            // Stop existing subscription if it exists
            if (this.pollingSubscriptions.has(subscriptionId)) {
                await this.handleStopPolling({ subscriptionId }, 'stop_' + Date.now());
            }

            const subscription: PollingSubscription = {
                id: subscriptionId,
                url,
                intervalMs,
                intervalId: 0,
                isActive: true
            };

            // Start polling
            subscription.intervalId = self.setInterval(async () => {
                if (!subscription.isActive) return;

                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        this.sendStreamData({
                            subscriptionId,
                            data,
                            timestamp: Date.now()
                        }, `poll_data_${Date.now()}`);
                    } else {
                        this.sendStreamError(
                            `Polling request failed: ${response.status} ${response.statusText}`,
                            `poll_error_${Date.now()}`
                        );
                    }
                } catch (error) {
                    this.sendStreamError(
                        `Polling error: ${(error as Error).message}`,
                        `poll_error_${Date.now()}`
                    );
                }
            }, intervalMs);

            this.pollingSubscriptions.set(subscriptionId, subscription);

            this.sendResponse({
                subscriptionId,
                isActive: true,
                intervalMs
            }, id);

        } catch (error) {
            this.sendError(error as Error, id, 'POLLING_START_FAILED');
        }
    }

    async handleStopPolling(data: { subscriptionId: string }, id: string): Promise<void> {
        const { subscriptionId } = data;

        const subscription = this.pollingSubscriptions.get(subscriptionId);
        if (!subscription) {
            this.sendError(new Error('Subscription not found'), id, 'SUBSCRIPTION_NOT_FOUND');
            return;
        }

        try {
            subscription.isActive = false;
            self.clearInterval(subscription.intervalId);
            this.pollingSubscriptions.delete(subscriptionId);

            this.sendResponse({ success: true, subscriptionId }, id);
        } catch (error) {
            this.sendError(error as Error, id, 'POLLING_STOP_FAILED');
        }
    }

    async handleChangePollingInterval(data: { subscriptionId: string; newInterval: number }, id: string): Promise<void> {
        const { subscriptionId, newInterval } = data;

        const subscription = this.pollingSubscriptions.get(subscriptionId);
        if (!subscription) {
            this.sendError(new Error('Subscription not found'), id, 'SUBSCRIPTION_NOT_FOUND');
            return;
        }

        try {
            // Stop current interval
            self.clearInterval(subscription.intervalId);

            // Update interval
            subscription.intervalMs = newInterval;

            // Start new interval
            subscription.intervalId = self.setInterval(async () => {
                if (!subscription.isActive) return;

                try {
                    const response = await fetch(subscription.url);
                    if (response.ok) {
                        const data = await response.json();
                        this.sendStreamData({
                            subscriptionId,
                            data,
                            timestamp: Date.now()
                        }, `poll_data_${Date.now()}`);
                    }
                } catch (error) {
                    this.sendStreamError(
                        `Polling error: ${(error as Error).message}`,
                        `poll_error_${Date.now()}`
                    );
                }
            }, newInterval);

            this.sendResponse({ success: true, subscriptionId, newInterval }, id);
        } catch (error) {
            this.sendError(error as Error, id, 'INTERVAL_CHANGE_FAILED');
        }
    }

    async handleSubscribeEvents(data: EventSourceData, id: string): Promise<void> {
        const { url, lastEventId } = data;

        try {
            const subscriptionId = this.generateSubscriptionId();

            // Create EventSource
            const eventSource = new EventSource(url);

            const subscription: EventSourceSubscription = {
                id: subscriptionId,
                url,
                eventSource,
                isActive: true
            };

            // Set up event handlers
            eventSource.onopen = () => {
                this.sendStreamData({
                    event: 'connected',
                    subscriptionId
                }, `sse_connected_${Date.now()}`);
            };

            eventSource.onmessage = (event) => {
                this.sendStreamData({
                    subscriptionId,
                    event: {
                        id: event.lastEventId,
                        type: event.type || 'message',
                        data: event.data,
                        timestamp: Date.now()
                    }
                }, `sse_message_${Date.now()}`);
            };

            eventSource.onerror = (error) => {
                this.sendStreamError(
                    `Server-sent events error: ${error}`,
                    `sse_error_${Date.now()}`
                );
            };

            this.eventSourceSubscriptions.set(subscriptionId, subscription);

            this.sendResponse({
                subscriptionId,
                isActive: true,
                url
            }, id);

        } catch (error) {
            this.sendError(error as Error, id, 'SSE_SUBSCRIBE_FAILED');
        }
    }

    async handleUnsubscribeEvents(data: { subscriptionId: string }, id: string): Promise<void> {
        const { subscriptionId } = data;

        const subscription = this.eventSourceSubscriptions.get(subscriptionId);
        if (!subscription) {
            this.sendError(new Error('Subscription not found'), id, 'SUBSCRIPTION_NOT_FOUND');
            return;
        }

        try {
            subscription.isActive = false;
            subscription.eventSource.close();
            this.eventSourceSubscriptions.delete(subscriptionId);

            this.sendResponse({ success: true, subscriptionId }, id);
        } catch (error) {
            this.sendError(error as Error, id, 'SSE_UNSUBSCRIBE_FAILED');
        }
    }

    async handleCreateChannel(data: ChannelData, id: string): Promise<void> {
        const { channelName, capacity = 100 } = data;

        if (this.channels.has(channelName)) {
            this.sendError(new Error('Channel already exists'), id, 'CHANNEL_EXISTS');
            return;
        }

        const channel: Channel = {
            name: channelName,
            capacity,
            buffer: [],
            readers: [],
            isCompleted: false
        };

        this.channels.set(channelName, channel);

        this.sendResponse({
            channelName,
            capacity,
            isCreated: true
        }, id);
    }

    async handleWriteChannel(data: { channelName: string; data: any }, id: string): Promise<void> {
        const { channelName, data: channelData } = data;

        const channel = this.channels.get(channelName);
        if (!channel) {
            this.sendError(new Error('Channel not found'), id, 'CHANNEL_NOT_FOUND');
            return;
        }

        if (channel.isCompleted) {
            this.sendError(new Error('Channel is completed'), id, 'CHANNEL_COMPLETED');
            return;
        }

        try {
            // Add to buffer (with capacity limit)
            if (channel.buffer.length >= channel.capacity) {
                channel.buffer.shift(); // Remove oldest item
            }

            channel.buffer.push(channelData);

            // Notify readers
            channel.readers.forEach(readerId => {
                this.sendStreamData({
                    channelName,
                    data: channelData,
                    timestamp: Date.now()
                }, readerId);
            });

            this.sendResponse({ success: true, channelName }, id);
        } catch (error) {
            this.sendError(error as Error, id, 'CHANNEL_WRITE_FAILED');
        }
    }

    async handleReadChannel(data: { channelName: string; readerId?: string }, id: string): Promise<void> {
        const { channelName, readerId = id } = data;

        const channel = this.channels.get(channelName);
        if (!channel) {
            this.sendError(new Error('Channel not found'), id, 'CHANNEL_NOT_FOUND');
            return;
        }

        try {
            // Add reader to the channel
            if (!channel.readers.includes(readerId)) {
                channel.readers.push(readerId);
            }

            // Send any buffered data
            if (channel.buffer.length > 0) {
                channel.buffer.forEach(data => {
                    this.sendStreamData({
                        channelName,
                        data,
                        timestamp: Date.now()
                    }, readerId);
                });
            }

            this.sendResponse({
                success: true,
                channelName,
                readerId,
                bufferedItems: channel.buffer.length
            }, id);
        } catch (error) {
            this.sendError(error as Error, id, 'CHANNEL_READ_FAILED');
        }
    }

    async handleCompleteChannel(data: { channelName: string }, id: string): Promise<void> {
        const { channelName } = data;

        const channel = this.channels.get(channelName);
        if (!channel) {
            this.sendError(new Error('Channel not found'), id, 'CHANNEL_NOT_FOUND');
            return;
        }

        try {
            channel.isCompleted = true;

            // Notify all readers that channel is completed
            channel.readers.forEach(readerId => {
                this.sendStreamData({
                    channelName,
                    completed: true,
                    timestamp: Date.now()
                }, readerId);
            });

            this.sendResponse({ success: true, channelName, completed: true }, id);
        } catch (error) {
            this.sendError(error as Error, id, 'CHANNEL_COMPLETE_FAILED');
        }
    }

    private generateSubscriptionId(): string {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}