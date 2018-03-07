
export interface Info {
    categories: { slug: string, title: string }[];
    countries: string[];
    country: string;
    credits_per_email: string;
    credits_per_minute: string;
    credits_per_sms: string;
    language: string;
    languages: string[];
    mail_cpm: number;
    mail_enabled: number;
    marketing: {
        current: string;
        happy_hour: {
            phone_number: string;
            phone_cpm: number;
        },
        happy_days: {
            phone_number: string;
            phone_cpm: number;
        }
    },
    ivr1: {
        phone_cpm: number;
        phone_enabled: number;
        phone_number: string;
        phone_number_free: string;
        sms_cpt: number;
        sms_enabled: number;
        sms_number: 4500;
        marketing: number;
    }
    ivr2: {
        phone_cpm: number;
        phone_enabled: number;
        phone_number: string;
        phone_number_free: string;
        sms_cpt: number;
        sms_enabled: number;
        sms_number: 4500;
        marketing: number;
    }
    tags: string[];
}
