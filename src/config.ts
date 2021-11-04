export interface ProjectConfig {
    Host: string;
    Localhost: string;
    Username: string;
    Password: string;
    Sections: any;
    Colums: any;
    Blocks: any;
    Cameras: any;
    Weather_api: string;
    Weather_country: string;
    Weather_location: string;
}

const config = require(`./private.${process.env.NODE_ENV}.json`) as ProjectConfig;
export const login = `username=${config.Username}&password=${config.Password}&`;
export const host = (location.hostname === 'localhost' || location.hostname === '192.168.178.25') ? `http://${config.Localhost}:8080` : `http://${config.Host}:8080
`;

export default config;
