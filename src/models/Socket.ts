
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
}

export interface SocketMessageEventArgs {
    clientId: number;
    performerId: number;
    sentBy: string;
    type: string;
}
