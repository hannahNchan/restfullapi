const http = require('http');
const https = require('https');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const fs = require('fs');

const _data = require('./lib/lib');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

const { httpPort, httpsPort, name } = require('./lib/config')

const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
};
 
var httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

const unifiedServer = (httpsServerOptions, (req, res) => {
  const method = req.method.toLowerCase();
  var parsedUrl = url.parse(req.url, true)
  const { pathname, query } = parsedUrl;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g,'');

  var decoder = new StringDecoder('utf-8');
  var buffer = '';

  req.on('data', data => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    const choosenHandler = typeof router[trimmedPath] !== 'undefined' ? router[trimmedPath]: handlers.notFound;

    var data = {
      'path': pathname,
      'method': method,
      'payload': helpers.parseJSONtoObject(buffer),
      'queryStringObject': query,
    };

    choosenHandler(data, (statusCode, payload) => {
      statusCode = typeof statusCode === 'number' ? statusCode : 200;
      payload = typeof payload === 'object' ? payload : {};
      payloadString = JSON.stringify(payload);
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
      //console.log('Returning ->', statusCode, payloadString);
    });

  });
});

const router = {
  'ping': handlers.ping,
  'users': handlers.users,
};

httpServer.listen(httpPort,() => {
  console.log(`Server http is listening on port ${httpPort} in ${name} mode`);
});

httpsServer.listen(httpsPort,() => {
  console.log(`Server https is listening on port ${httpsPort} in ${name} mode`);
});

