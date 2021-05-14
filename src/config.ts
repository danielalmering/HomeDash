export interface ProjectConfig {
    Host: string;
    Localhost: string;
    Username: string;
    Password: string;
    Colums: any;
    Blocks: any;
    Cameras: any;
    Weather_api: string;
    Weather_country: string;
    Weather_location: string;
}

const config = require(`./private.${process.env.NODE_ENV}.json`) as ProjectConfig;
export const login = `username=${config.Username}&password=${config.Password}&`;
export const host = location.hostname === 'localhost' ? `http://${config.Localhost}:8084` : `https://${config.Host}:8443`;

export default config;
