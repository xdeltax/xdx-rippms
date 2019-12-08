## **xdx-rippms** [https://client.xdeltax.now.sh](https://client.xdeltax.now.sh)


PWA with reactjs and phaser 3
with a login-screen and server communication with sockets
with a high performance isometric tilemap implementation

° PHASER.JS v3 ° PIXI.JS v5 ° REACT.JS v16 ° MATERIAL-UI v4 ° MOBXJS v5 ° SOCKETIO v2 ° PWA ° TWA °

- [react.js](https://reactjs.org) (unejected react-create-app)
- [phaser.js v3](https://phaser.io) integrated in react component
- [pixi.js v5](https://pixijs.com) integrated in react component
- [material.ui](https://material-ui.com)
- [mobx.js](https://mobx.js.org) (react) for state management
- [react-router](https://reacttraining.com/react-router/web) for page-navigation and authentication
- user authentication / login with [facebook-api](https://developers.facebook.com/docs/apis-and-sdks)
- client / server - authentication with [jsonwebtoken (jwt)](https://jwt.io)
- [mongo.db](https://mongodb.com) style zero configuration text database with [nedb](https://github.com/louischatriot/nedb)
- [socket.io](https://socket.io) for client / server communication
- persistent app-state with client-side [nedb](https://github.com/louischatriot/nedb)
- [progressive web app (pwa)](https://developers.google.com/web/fundamentals/codelabs/your-first-pwapp) / [trusted web activities (twa)](https://developers.google.com/web/updates/2019/02/using-twa) - ready
- useable with [ionic capacitor](https://capacitor.ionicframework.com) / [cordova](https://cordova.apache.org) / [phonegap](https:77phonegap.com)
- phaser-example scene *stresstest*
- phaser-example scene [high performace isometric tilemap](https://github.com/xdeltax/xdx-rippms/blob/master/client/src/game/phaser/extends/isometrictilemap/IsometricTilemap.js)


## isometric tilemap implementation

- isometric maps
- fast map creating
- efficient (map size independent) camera culling algorithm
- z-axis implemantation
- animatable tiles

#### source
[IsometricTilemap.js](https://github.com/xdeltax/xdx-rippms/blob/master/client/src/game/phaser/extends/isometrictilemap/IsometricTilemap.js)

[Tilemap Scene](https://github.com/xdeltax/xdx-rippms/blob/master/client/src/game/phaser/scenes/Tilemap.js)

#### demo	

[https://client.xdeltax.now.sh/#/game/phaser](https://client.xdeltax.now.sh/#/game/phaser)

## installation

```bash
# clone repository
$ git clone --depth 1 https://github.com/xdeltax/xdx-rippms.git xdx-rippms

# navigate to client-folder
$ cd xdx-rippms/client

# install dependencies
$ npm i -f

# start client-side app for local development (port 3000)
$ npm start

# build production code to ./build folder
$ npm run build

# push to zeit
$ npx now

# navigate to server-folder
$ cd xdx-rippms/server

# install dependencies
$ npm i

# start server for development
$ npm start

# start server 
$ npm run node
```


## client side

#### .env
```json
PUBLIC_URL=.

REACT_APP_DECORATORS=true
REACT_APP_BABEL_STAGE_0=true

#socket.io:: used in store.socketio
REACT_APP_SERVERURL="http://localhost:8080"

#facebook-api
REACT_APP_FB_APPID=###your-facebook-app-id###
```

#### installation from scratch
~~~~
mkdir app
cd app

react.js
  npx create-react-app client
  cd client
  npm i -s react-router react-router-dom

ionic-react
  npx ionic init "xdx" --type=react
  npm i -s @ionic/react

material-ui
  npm i -s @material-ui/core @material-ui/icons

mobx
  npm i -s mobx mobx-react

phaser.js
  npm i -s phaser

pixi.js
  npm i -s pixi.js
  npm i -s pixi-viewport
  //npm i -s pixi-tilemap
  //npm i -s pixi-projection
  //npm i -s pixi-layers
  //npm i -s pixi-cull

fonts
  npm i -s typeface-roboto typeface-indie-flower typeface-rock-salt

socket.io
  npm i -s socket.io-client

database
  npm i -s nedb

motion
  npm i -s react-swipeable-views
  npm i -s react-spring
  npm i -s react-use-gesture

images
  npm i -s jimp
  npm i -s react-easy-crop

tools
  npm i -s react-sizeme
  npm i -s react-scroll-into-view-if-needed

analyse
  npm i -s source-map-explorer

fixes
	npm i fsevents@latest -f --save-optional
	npm audit fix --force
~~~~


## server side

#### installation from scratch
~~~~
cd app
mkdir server

node.js
  cd server
  npm init -y

express.js
  npm i -s express body-parser cors helmet morgan

socket.io
  npm i -s socket.io

facebook
  npm i -s fbgraph

validators
  npm i -s @hapi/joi
  npm i -s validator  

jsonwebtoken
  npm i -s jsonwebtoken

database
  npm i -s nedb nedb-promises

gfx
  npm i -s jimp

tools
  npm i -s dotenv
  npm i -s fs-extra     
  npm i -s request-ip

dev
  npm i --save-dev nodemon
~~~~


## update / upgrade

#### update react.js

	check for latest version:: https://github.com/facebook/create-react-app/blob/master/CHANGELOG.md
	change in package.json:: "react-scripts": "3.3.0"
 	npm i

or

	npm install --save --save-exact react-scripts@3.3.0
 	npm i


#### update repositories

	npm outdated
	npm update

or

	npx npm-check-updates
	npx npm-check-updates -u
	npm i

or

	npx npm-check -u


## dev-stuff

#### debug on mobile

~~~~
  run dev-server::         npm run   -> localhost:3000
  get ip of dev-machine::  command:: ipconfig -> 192.168.1.69
  start deamon::           command:: i:\editors\adb\adb devices
  chrome on mobile::       192.168.1.69:3000
  connect device with usb (usb-debugging activated)
  chrome on desktop::      chrome://inspect/#devices  -> choose chrome-tab on device -> new screen with console and preview

  // adb:: https://developer.android.com/studio/command-line/adb
  // adb connect device_ip_address
  // adb kill-server
  // adb devices -l
~~~~


#### build

~~~~
  cd client
  set NODE_PATH=
  set HTTPS=true
  npm run build
  cd build
  npx serve or npx http-server
~~~~


## tools

creating animated sprite-atlas tiles using blender and texturepacker (free-version) for use in phaser

#### [blender](https://blender.org) (freeware)

[Creating-Isometric-Tiles-in-Blender](https://www.gamefromscratch.com/post/2015/11/20/Creating-Isometric-Tiles-in-Blender.aspx)

```bash
- blender -> load isoTemplate-xxx.blender
- adding animation examples from [mixamo](https://www.mixamo.com/#/?page=52&type=Motion%2CMotionPack), download as FXB for import in blender
- set camera ISO 60° == tileHeight = 0.5 * tileWidth  or  ISO 75° == tileHeight = 0.25 * tileWidth (select camera-object -> view -> cameras -> set active object as camera)
- render animation (CTRL + F12) as PNG -> collection of png-images (0001.png, 0002.png, ...)
```


#### [TexturePacker v5.2](https://www.codeandweb.com/texturepacker) (free-version)

load rendered png's from blender in texture-packer to create a spritesheet

```bash
- select data-format: JSON(Array) (no need to use commercial data-format: Phaser); 
- select texture-format: PNG-32;
- uncheck: 
- load in phaser with this.load.atlas("key", PNG, JSON);
```



## mobile

### native app

- use [capacitor](https://capacitor.ionicframework.com/docs) to build for native
- adjust ./client/capacitor.config.json


### pwa / twa

- adjust ./client/public/manifest.json
