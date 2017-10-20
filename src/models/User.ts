
export interface AnonymousUser {
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