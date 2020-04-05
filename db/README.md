mkdir pouchdb
cd puchdb
npm init -y
npm install --save dotenv
npm install --save express

npm install --save pouchdb-core
npm install --save pouchdb-replication
npm install --save pouchdb-adapter-http
npm install --save pouchdb-mapreduce
npm install --save pouchdb-find               createindex and find / mango queries

npm install --save pouchdb-adapter-memory
npm install --save pouchdb-adapter-node-websql
npm install --save express-pouchdb

npm install --save cors
npm install --save blob-util

npm install --save socket.io-client

//npm install --save rxdb
//npm install --save rxjs
//npm install --save rxdb-utils

//npm i -s pouchdb

npm rebuild


npm install --save-dev nodemon
npm install --save-dev supervisor


"httpd": {
  "Bind_address": "0.0.0.0",
  "enable_cors": true
},
"cors": {
  "credentials": true,
  "methods": "GET, PUT, POST, HEAD, DELETE, OPTIONS",
  "origins": "http://localhost:3000",
  "headers": "accept, authorization, content-type, origin, referer, x-csrf-token"
},
