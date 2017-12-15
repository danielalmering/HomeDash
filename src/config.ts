
export interface ProjectConfig {
    BaseUrl: string;
    SocketUrl: string;
    ImageUrl: string;
    JsmpegUrl: string;
    StorageKey: string;
    NoAgeCheckCountries: string[];
}

export default require(`./private.${process.env.NODE_ENV}.json`) as ProjectConfig;