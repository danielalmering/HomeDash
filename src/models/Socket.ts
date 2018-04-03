import { PerformerStatus } from "./Performer";

export interface SocketVoyeurEventArgs {
    id: string;
    performerId: number;
    type: string;
    value: boolean;
    message?: string;
}

export interface SocketStatusEventArgs {
    performerId: number;
    status: string;
}

export interface SocketServiceEventArgs {
    performerId: number;
    serviceName: string;
    serviceStatus: boolean;
    status?: PerformerStatus;
    services?: { [key: string]: boolean };
}

export interface SocketMessageEventArgs {
    clientId: number;
    performerId: number;
    sentBy: string;
    type: string;
}
