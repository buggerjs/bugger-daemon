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

var Promise = require('bluebird');
var _ = require('lodash');

// client: A websocket client
// page: A page model
// page.agents: bugger-agents for the page
function connectClientToPage(Pages, client, page) {
  var agents = page.agents;

  function setup() {
    client.on('message', handleMessage);
    client.on('close', handleClose);
    client.on('error', handleFatalError);
  }

  var cleanupDone = false;
  function cleanup() {
    if (cleanupDone) return;
    client.removeListener('message', handleMessage);
    client.removeListener('close', handleClose);
    client.removeListener('error', handleFatalError);
    cleanupDone = true;
  }

  function handleFatalError(err) {
    if (err) console.error(err.stack);
    cleanup();
  }

  function handleClose() {
    cleanup();
  }

  function handleMessage(data) {
    try {
      handleRequest(JSON.parse(data.utf8Data));
    } catch (err) {
      console.error('Could not process message: ' +
        data.utf8Data + '\n' + err.stack);
    }
  }

  function handleRequest(req) {
    var method = req.method, params = req.params, id = req.id;
    params = params || {};

    agents.callMethod(method, params).then(
      _.partial(sendResponse, id, null),
      _.partial(sendResponse, id));
  }

  function sendResponse(id, error, result) {
    if (error) {
      writeJSON({ id: id, result: null,
        error: typeof error === 'string' ? error :
          error.stack || error.message
      });
    } else {
      writeJSON({ id: id, result: result, error: null });
    }
  }

  function writeJSON(obj) {
    if (client && client.connected) {
      client.send(JSON.stringify(obj));
    } else {
      console.error('Cannot write, disconnected');
      cleanup();
    }
  }

  setup();
}

module.exports = connectClientToPage;
