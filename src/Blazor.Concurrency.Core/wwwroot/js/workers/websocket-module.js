import { BaseWorkerModule } from './base-module';
import { WebSocketMessageType } from '../generated';
export class WebSocketModule extends BaseWorkerModule {
    constructor() {
        super(...arguments);
        this.connections = new Map();
    }
    get moduleName() {
        return 'websocket';
    }
    async handleConnect(data, id) {
        const { url, protocols, autoReconnect = true } = data;
        try {
            const ws = new WebSocket(url, protocols);
            const connectionId = this.generateConnectionId();
            const connection = {
                id: connectionId,
                ws,
                url,
                protocols,
                autoReconnect,
                isConnected: false,
                reconnectAttempts: 0,
                maxReconnectAttempts: 5,
                reconnectDelay: 1000,
                messageQueue: []
            };
            this.connections.set(connectionId, connection);
            this.setupWebSocketHandlers(connection, id);
        }
        catch (error) {
            this.sendError(error, id, 'CONNECTION_FAILED');
        }
    }
    async handleSend(data, id) {
        const { connectionId, message, messageType = 'json' } = data;
        const connection = this.connections.get(connectionId);
        if (!connection) {
            this.sendError(new Error('Connection not found'), id, 'CONNECTION_NOT_FOUND');
            return;
        }
        try {
            if (connection.isConnected) {
                const processedMessage = this.processMessage(data.message, data.messageType);
                connection.ws.send(processedMessage);
                this.sendResponse({ success: true }, id);
            }
            else {
                // Queue message for when connection is established
                connection.messageQueue.push({ message, messageType, responseId: id });
            }
        }
        catch (error) {
            this.sendError(error, id, 'SEND_FAILED');
        }
    }
    async handleClose(data, id) {
        const { connectionId, code = 1000, reason = '' } = data;
        const connection = this.connections.get(connectionId);
        if (!connection) {
            this.sendError(new Error('Connection not found'), id, 'CONNECTION_NOT_FOUND');
            return;
        }
        try {
            connection.autoReconnect = false; // Disable auto-reconnect
            connection.ws.close(code, reason);
            this.connections.delete(connectionId);
            this.sendResponse({ success: true }, id);
        }
        catch (error) {
            this.sendError(error, id, 'CLOSE_FAILED');
        }
    }
    async handleSubscribe(data, id) {
        const { connectionId, topic } = data;
        const connection = this.connections.get(connectionId);
        if (!connection) {
            this.sendError(new Error('Connection not found'), id, 'CONNECTION_NOT_FOUND');
            return;
        }
        // Send subscription message
        const subscribeMessage = {
            type: 'subscribe',
            topic: topic,
            timestamp: Date.now()
        };
        try {
            if (connection.isConnected) {
                connection.ws.send(JSON.stringify(subscribeMessage));
                this.sendResponse({ subscribed: true, topic }, id);
            }
            else {
                this.sendError(new Error('Connection not established'), id, 'NOT_CONNECTED');
            }
        }
        catch (error) {
            this.sendError(error, id, 'SUBSCRIBE_FAILED');
        }
    }
    setupWebSocketHandlers(connection, initialResponseId) {
        const { ws, id: connectionId } = connection;
        ws.onopen = () => {
            connection.isConnected = true;
            connection.reconnectAttempts = 0;
            // Send initial connection success response
            this.sendResponse({
                connectionId,
                isConnected: true,
                url: connection.url
            }, initialResponseId);
            // Send any queued messages
            while (connection.messageQueue.length > 0) {
                const queuedMessage = connection.messageQueue.shift();
                this.handleSend({
                    connectionId,
                    message: queuedMessage.message,
                    messageType: queuedMessage.messageType
                }, queuedMessage.responseId);
            }
            // Notify main thread of connection opened
            this.sendStreamData({
                event: 'opened',
                connectionId
            }, `ws_event_${Date.now()}`);
        };
        ws.onmessage = (event) => {
            let messageData;
            if (event.data instanceof ArrayBuffer) {
                // Binary message
                messageData = {
                    type: 'binary',
                    data: Array.from(new Uint8Array(event.data))
                };
            }
            else {
                // Text message - try to parse as JSON
                try {
                    messageData = {
                        type: 'json',
                        data: JSON.parse(event.data)
                    };
                }
                catch {
                    messageData = {
                        type: 'text',
                        data: event.data
                    };
                }
            }
            // Send message to main thread
            this.sendStreamData({
                connectionId,
                message: messageData
            }, `ws_msg_${Date.now()}`);
        };
        ws.onerror = (error) => {
            // Send error to main thread
            this.sendStreamError(`WebSocket error occurred: ${error}`, `ws_error_${Date.now()}`);
        };
        ws.onclose = (event) => {
            connection.isConnected = false;
            // Send close event to main thread
            this.sendStreamData({
                event: 'closed',
                connectionId,
                code: event.code,
                reason: event.reason
            }, `ws_close_${Date.now()}`);
            // Handle auto-reconnect
            if (connection.autoReconnect &&
                connection.reconnectAttempts < connection.maxReconnectAttempts &&
                event.code !== 1000) { // Don't reconnect on normal closure
                setTimeout(() => {
                    this.attemptReconnect(connection);
                }, connection.reconnectDelay);
            }
            else if (!connection.autoReconnect ||
                connection.reconnectAttempts >= connection.maxReconnectAttempts) {
                // Remove connection if not reconnecting
                this.connections.delete(connectionId);
            }
        };
    }
    async attemptReconnect(connection) {
        if (!connection.autoReconnect)
            return;
        connection.reconnectAttempts++;
        try {
            const newWs = new WebSocket(connection.url, connection.protocols);
            connection.ws = newWs;
            this.setupWebSocketHandlers(connection, `reconnect_${Date.now()}`);
            // Increase delay for next attempt
            connection.reconnectDelay = Math.min(connection.reconnectDelay * 1.5, 30000 // Max 30 seconds
            );
        }
        catch (error) {
            // If reconnect fails, try again later
            if (connection.reconnectAttempts < connection.maxReconnectAttempts) {
                setTimeout(() => {
                    this.attemptReconnect(connection);
                }, connection.reconnectDelay);
            }
            else {
                // Give up and remove connection
                this.connections.delete(connection.id);
                this.sendStreamError(`Reconnection attempts exhausted for connection ${connection.id}`, `reconnect_failed_${Date.now()}`);
            }
        }
    }
    processMessage(message, messageType) {
        switch (messageType) {
            case WebSocketMessageType.Text:
                return message;
            case WebSocketMessageType.Json:
                return JSON.stringify(message);
            case WebSocketMessageType.Binary:
                if (message instanceof Uint8Array) {
                    return message.buffer;
                }
                else if (message instanceof ArrayBuffer) {
                    return message;
                }
                else if (Array.isArray(message)) {
                    // Convert number array to Uint8Array
                    return new Uint8Array(message).buffer;
                }
            default:
                throw new Error(`Unknown message type: ${messageType}`);
        }
    }
    parseMessage(data) {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            }
            catch {
                return data; // Return as string if not valid JSON
            }
        }
        else if (data instanceof ArrayBuffer) {
            return Array.from(new Uint8Array(data));
        }
        else if (data instanceof Blob) {
            // Handle Blob data (would need async handling in real implementation)
            return { type: 'blob', size: data.size };
        }
        return data;
    }
    generateConnectionId() {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=websocket-module.js.map