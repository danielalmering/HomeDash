# thuisnl-front

> Thuis.nl front-end

## Configuration

Create a `private.development.json` for development usage, or a `private.production.json` for production usage.

``` json
{
    "BaseUrl": "/api",                                              //Url the front-end uses to prefix in front of API requets
    "FullApiUrl": "http://accept-www.thuis.nl",                     //Proxy address for dev mode
    "ImageUrl": "//accept-img.thuis.nl/files/pimg/",                //Url the front-end uses to prefix in front of images
    "SocketUrl": "wss://accept-socket.thuis.nl/",                   //Notification socket url
    "JsmpegUrl": "wss://accept-push02.thuis.nl/jsmpeg",             //Jsmpeg url
    "StorageKey": "thuis",                                          //Localstorage key we use, better to have a different prefix for every domain when testing on 1 domain
    "NoAgeCheckCountries": ["nl"],                                  //Countries that don't require an age check
    "AutomaticCountryRedirect": true,                               //Enable to have forced language prefix in the url (Required for Gigacams)
    "H5Server": "accept-stream01.thuis.nl",                         //H5 stream url for Nano
    "H5FlashSwf": "//demo.nanocosmos.de/nanoplayer/nano.player.swf" //H5 swf for Nano
}
```

## Build Setup

### install dependencies
```
npm install
```

### serve with hot reload at localhost:8080
``` bash
npm run dev
```

### build for production with minification
```
npm run build
```

### build for production and view the bundle analyzer report
```
npm run build --report
```

## Test section... hahaha of course not

### run unit tests
```
npm run unit
```

### run all tests
```
npm test
```