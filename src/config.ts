
export interface ProjectConfig {
    BaseUrl: string;
    FullApiUrl: string;
    SocketUrl: string;
    ImageUrl: string;
    JsmpegUrl: string;
    StorageKey: string;
    Country: string;
    H5Server: string;
    VodServer: string;
    H5FlashSwf: string;

    locale: LocaleConfig;
}

interface LocaleConfig {
    DefaultLanguage: string;
    GoogleTagCode: string;
    AgeCheck: boolean;

    Logo?: any;
    LogoDark?: any;
}

//TODO:
//Create semi-high order wrapper component for language specific pieces of template

const config = require(`./private.${process.env.NODE_ENV}.json`) as ProjectConfig;
config.locale = require(`./locale/locale.${config.Country}.json`) as LocaleConfig;

export const logo = require(`./assets/images/${config.Country}/logo.png`);
export const logoDark = require(`./assets/images/${config.Country}/logo-dark.png`);
export const voucher = require(`./assets/images/${config.Country}/voucher.png`);

if(window.loadTagManager){
    window.loadTagManager(window, document, 'script', 'dataLayer', config.locale.GoogleTagCode);
}

export default config;
