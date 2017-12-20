
export interface ProjectConfig {
    BaseUrl: string;
    SocketUrl: string;
    ImageUrl: string;
    JsmpegUrl: string;
    StorageKey: string;
    NoAgeCheckCountries: string[];
    H5Server: string;
    H5FlashSwf: string;
}

export default require(`./private.${process.env.NODE_ENV}.json`) as ProjectConfig;
