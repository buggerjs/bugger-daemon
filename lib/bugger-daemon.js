// Copyright (C) 2013 Jan Krems
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software is furnished to do
// so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

var ProcessResource = require('./resource/process');
var Url = require('url');
var QueryString = require('querystring');
var fs = require('fs');
var path = require('path');
var ConcatStream = require('concat-stream');
var EventEmitter = require('events').EventEmitter;

function parsedUrl(url) {
  var parsed = Url.parse(url);
  parsed.query = QueryString.parse(parsed.query);
  parsed.segments = parsed.pathname.substr(1).split('/').filter(
    function(segment) {
      return segment.length > 0;
    });
  return parsed;
}

/**
 * Bugger daemon - bringing buggers together since 2013
 */
var createHttpHandler = function(buggerd) {
  var handleProcessRequest = ProcessResource(buggerd.ProcessModel);
  var publicFolder = path.join(__dirname, '..', 'public');

  return function(req, res) {
    req.parsedUrl = parsedUrl(req.url);
    var firstSegment = req.parsedUrl.segments.shift();
    if (firstSegment == null) { firstSegment = 'index.html'; }
    switch (firstSegment) {
      case 'processes':
        return handleProcessRequest(req, res);
      case 'index.html':
        var filename = path.join(publicFolder, firstSegment);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return fs.createReadStream(path.join(publicFolder, 'index.html'))
        .pipe(new ConcatStream(function(template) {
          var page = template.toString()
          .replace(/\{\{#processes\}\}([\s\S]*)\{\{\/processes\}\}/, function(subTpl) {
            subTpl = subTpl.substr(14).replace('{{/processes}}', '');
            return buggerd.ProcessModel.all().map(function(process) {
              return subTpl.replace(/\{\{\w+\}\}/g, function(placeholder) {
                var field = placeholder.match(/\{\{(\w+)\}\}/)[1];
                return process[field];
              });
            }).join('');
          });
          res.end(page);
        }));

      default:
        var contentType = 'text/plain';
        switch (path.extname(firstSegment)) {
          case '.html':
            contentType = 'text/html'; break;
          case '.js':
            contentType = 'application/javascript'; break;
          case '.css':
            contentType = 'text/css'; break;
        }

        if (/^[a-z]/.test(firstSegment)) {
          var filename = path.join(publicFolder, firstSegment);
          res.writeHead(200, { 'Content-Type': contentType });
          try {
            return fs.createReadStream(filename).on('error', function(err) {
              return res.end('File not found: ' + firstSegment);
            }).pipe(res);
          } catch (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Not found');
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('Not found');
        }
    }
  };
};

var createWebsocketHandler = function(buggerd, httpServer) {
  var WebSocketServer = require('websocket').server;

  var webSocket = new WebSocketServer({
    httpServer: buggerd.httpServer,
    autoAcceptConnections: false
  });

  webSocket.on('request', function(wsRequest) {
    var urlInfo = parsedUrl(wsRequest.httpRequest.url);
    if (urlInfo.segments.length < 2 || urlInfo.segments[0] !== 'processes') {
      wsRequest.reject(404, "No handler is configured to accept the connection.");
    } else {
      wsRequest.socket.buggerPid = parseInt(urlInfo.segments[1], 10);
      wsRequest.accept(wsRequest.requestedProtocols[0], wsRequest.origin);
    }
  });

  webSocket.on('connect', function(c) {
    c.buggerPid = c.socket.buggerPid;
    buggerd.emit('devtoolsClient', c, c.buggerPid);
  });

  return webSocket;
};

/**
 * Create an http server that just runs buggerd
 */
module.exports = function createBuggerServer() {
  var buggerd = new EventEmitter();

  buggerd.ProcessModel = require('./model/process')();

  buggerd.httpServer = require('http').createServer(
    createHttpHandler(buggerd)
  );

  buggerd.webSocket = createWebsocketHandler(buggerd);

  return buggerd;
};
