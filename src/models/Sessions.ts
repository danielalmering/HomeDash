
export enum State {
    Idle            = 'idle',
    InRequest       = 'inRequest',
    Pending         = 'pending',
    Accepted        = 'accepted',
    Initializing    = 'initializing',
    Active          = 'active',
    Ending          = 'ending',
    Canceling       = 'canceling'
}

export enum SessionType {
    Video       = 'VIDEO',
    VideoCall   = 'VIDEOCALL',
    Peek        = 'PEEK'
}

export enum PaymentType {
    Ivr         = 'IVR',
    Credits     = 'CREDITS',
    IvrCredits  = 'IVRCREDITS'
}