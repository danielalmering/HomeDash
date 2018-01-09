
export interface ProjectConfig {
    BaseUrl: string;
    SocketUrl: string;
    ImageUrl: string;
    JsmpegUrl: string;
    StorageKey: string;
    NoAgeCheckCountries: string[];
    AutomaticCountryRedirect: boolean;
    H5Server: string;
    H5FlashSwf: string;
}

const config = require(`./private.${process.env.NODE_ENV}.json`) as ProjectConfig;

const countryRedirectDomains = ['gigacams.com'];

if(countryRedirectDomains.indexOf(window.location.hostname) > -1){
    config.AutomaticCountryRedirect = true;
}

export default config;