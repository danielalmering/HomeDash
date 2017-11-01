
export interface ProjectConfig {
    BaseUrl: string;
    SocketUrl: string;
}

export default require(`./private.${process.env.NODE_ENV}.json`) as ProjectConfig;