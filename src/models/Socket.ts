export interface SocketVoyeurEventArgs {
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