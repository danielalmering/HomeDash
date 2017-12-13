
export interface AnonymousUser {
    displayName:string;
    id: number;
    socketToken: string;

    country: string;
    language: string;
}

export interface User extends AnonymousUser {
    username: string;
    email: string;

    status: string; // Make Enum
    roles: string[]; //Transform to single
    registerDate: number;
    credits: number;
    mobile_number: string;

    credits_ivr_code: number;
}

export enum UserRole {
    Performer   = 'ROLE_PERFORMER',
    Client      = 'ROLE_CLIENT',
    Admin       = 'ROLE_ADMIN'
}