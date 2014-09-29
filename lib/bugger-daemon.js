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
'use strict';

var url = require('url');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var quinn = require('quinn');
var respond = require('quinn-respond');
var send = require('send');

var API = require('./api');

function prefix(parsed, pre) {
  if (parsed.pathname === pre) return true;
  if (parsed.pathname.indexOf(pre + '/') === 0) return true;
  return false;
}

/**
 * Bugger daemon - bringing buggers together since 2013
 */
var createHttpHandler = function(buggerd) {
  var publicFolder = path.join(__dirname, '..', 'public');
  var apiApp = quinn(API(buggerd));

  return function(req, res) {
    var parsed = url.parse(req.url, true);
    if (prefix(parsed, '/json')) return apiApp(req, res);
    send(req, parsed.pathname, {
      root: publicFolder,
      index: [ 'index.html' ]
    }).pipe(res);
  };
};

var createWebsocketHandler = function(buggerd, httpServer) {
  var WebSocketServer = require('websocket').server;

  var webSocket = new WebSocketServer({
    httpServer: buggerd.httpServer,
    autoAcceptConnections: false
  });

  webSocket.on('request', function(wsRequest) {
    var parsed = url.parse(wsRequest.httpRequest.url);

    // /devtools/page/{pageId}
    var match = parsed.pathname.match(/^\/devtools\/page\/([^/]+)$/);
    if (match === null) {
      wsRequest.reject(404, "No handler is configured to accept the connection.");
    } else {
      wsRequest.socket.pageId = match[1];
      wsRequest.accept(wsRequest.requestedProtocols[0], wsRequest.origin);
    }
  });

  webSocket.on('connect', function(c) {
    c.pageId = c.socket.pageId;
    buggerd.emit('devtoolsClient', c, c.pageId);
  });

  return webSocket;
};

/**
 * Create an http server that just runs buggerd
 */
module.exports = function createBuggerServer() {
  var buggerd = new EventEmitter();

  buggerd.Pages = require('./page/model')();

  buggerd.httpServer = require('http').createServer(
    createHttpHandler(buggerd)
  );

  buggerd.webSocket = createWebsocketHandler(buggerd);

  buggerd.httpServer.on('listening', function() {
    console.log('Setting port to %d', this.address().port);
    buggerd.Pages.buggerPort = this.address().port;
  });

  return buggerd;
};
