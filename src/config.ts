
export interface ProjectConfig {
    ApiUrl: string;
    BaseUrl: string;
    FullApiUrl: string;
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
const isGigacams = window.location.hostname.indexOf('gigacams.com') > -1;

if(isGigacams){
    config.AutomaticCountryRedirect = true;
}

// Client (API) version
config.ApiUrl = '2.0';

const tagManagerKey = isGigacams ? 'GTM-MPS978H' : 'GTM-WQN9TVH';

if(window.loadTagManager){
    window.loadTagManager(window,document,'script','dataLayer',tagManagerKey);
}

export default config;
