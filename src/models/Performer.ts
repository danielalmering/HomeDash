
export interface Performer {
    id: number;

    advert_numbers: { advertNumber: number }[];
    age: number;
    avatar: Avatar;
    avatar_media?: Avatar;
    country: string;
    cupSize: string;
    description: string;
    eyeColor: string;
    height: string;
    isFavourite: boolean;
    language: string;
    location: string;
    mediaId: number;
    nickname: string;
    performerLanguages: string;
    performerStatus: PerformerStatus;
    performer_services: { [key: string]: boolean }
    roles: Role[];
    safeDescription: string;
    safe_avatar: Avatar;
    socketToken: string;
    userAgent: string;
    username: string;
    weight: string;
};

export enum Role {
    Client      = 'ROLE_CLIENT',
    Performer   = 'ROLE_PERFORMER',
    Admin       = 'ROLE_ADMIN'
};

export enum PerformerStatus {
    Available   = 'AVAILABLE',
    Busy        = 'BUSY',
    Offline     = 'OFFLINE',
    OnCall      = 'ON_CALL'
}

export interface Avatar {
    id: number;

    name: string;
    safe_version: boolean;
    selected: boolean;
    wowza_sync?: boolean;
};