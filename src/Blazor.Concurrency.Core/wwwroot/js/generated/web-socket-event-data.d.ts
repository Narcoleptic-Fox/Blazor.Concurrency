/**
 * This is a TypeGen auto-generated file.
 * Any changes made to this file can be lost when this file is regenerated.
 */
import { WebSocketEventType } from "./web-socket-event-type";
export interface WebSocketEventData {
    connectionId: string;
    event: WebSocketEventType;
    code: number | null;
    reason: string | null;
}
