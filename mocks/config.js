const path = require('path');
const config = {
    '/mocks/messages': {
        data: './messages/GET.json'
    }
}
 
for (let item in config) {
    if (config.hasOwnProperty(item)) config[item].path = path.resolve(__dirname, config[item].data);
}
module.exports = config;