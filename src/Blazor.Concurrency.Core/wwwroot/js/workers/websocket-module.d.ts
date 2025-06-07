import { BaseWorkerModule } from './base-module';
import { WebSocketConnectionData, WebSocketSendData, WebSocketCloseData } from '../generated';
export declare class WebSocketModule extends BaseWorkerModule {
    get moduleName(): string;
    private connections;
    handleConnect(data: WebSocketConnectionData, id: string): Promise<void>;
    handleSend(data: WebSocketSendData, id: string): Promise<void>;
    handleClose(data: WebSocketCloseData, id: string): Promise<void>;
    handleSubscribe(data: {
        connectionId: string;
        topic: string;
    }, id: string): Promise<void>;
    private setupWebSocketHandlers;
    private attemptReconnect;
    private processMessage;
    private parseMessage;
    private generateConnectionId;
}
