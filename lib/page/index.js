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

var execFile = require('child_process').execFile;

var Promise = require('bluebird');
var _ = require('lodash');
var attachToPort = require('bugger-agents').attachToPort;
var debug = require('debug')('bugger-daemon:page');

var PageModel = require('./model');
var pageFromUrl = require('./url').pageFromUrl;

function verifyPortOpen(port) {
  return Promise.reject(new Error('Not implemented'));
}

function findOpenPort() {
  var net = require('net');
  return new Promise(function(resolve, reject) {
    var server = net.createServer();
    server.on('error', reject);
    server.listen(0, function() {
      var port = this.address().port;
      server.on('close', resolve.bind(null, port));
      server.close();
    });
  });
}

module.exports = function() {
  var store = {};
  var procByPid = {};
  var Pages = {};

  Pages.get = function(id) {
    if (!store[id]) {
      var err = new Error('Process not found');
      err.code = 404;
      throw err;
    }
    return store[id];
  };

  Pages.all = function all(skip, limit) {
    var acc = _.values(store);

    if (skip  == null || isNaN(skip)) { skip = 0; }
    if (limit == null || isNaN(limit)) { limit = acc.length; }

    return acc.slice(skip, skip + limit);
  };

  Pages.remove = function(id) {
    delete store[id];
  };

  Pages.save = function(page) {
    if (!(page instanceof PageModel)) {
      page = new PageModel(page);
    }
    page.validate();
    if (store[page.id] != null) {
      page.joinedAt = store[page.id].joinedAt;
    }
    return store[page.id] = page;
  };

  Pages.launchAndConnect = function(page) {
    // 1. get available debug port
    function getAvailablePort() {
      debug('getAvailablePort', page.port);
      if (page.port !== null) {
        return verifyPortOpen(page.port);
      }
      return findOpenPort();
    }

    // 2. launch process
    function launchProcess(port) {
      debug('Found available port', port);
      page.port = port;

      var nodePath = process.execPath;
      var nodeArgs = [
        '--debug-brk=' + page.port, page.script
      ].concat(page.args);
      var childOptions = { cwd: page.cwd, env: process.env };

      return new Promise(function(resolve, reject) {
        var child =
          execFile(nodePath, nodeArgs, childOptions);
        if (process.env.BUGGER_PIPE_CHILD) {
          child.stdout.pipe(process.stdout);
          child.stderr.pipe(process.stderr);
        }
        var pid = child.pid;
        child.on('exit', function(exitCode) {
          if (page.pid === pid) page.pid = null;
          reject(new Error('Child exited with code ' + exitCode));
        });

        process.on('exit', function() {
          try { child.kill(); } catch (err) {}
        });

        process.on('uncaughtException', function() {
          try { child.kill(); } catch (err) {}
        });

        page.pid = child.pid;
        procByPid[page.pid] = child.pid;
        debug('Attaching debug client', page.port);
        attachToPort(page.port).then(function(agents) {
          debug('Attached');
          page.agents = agents
          resolve(page);
        });
      });
    }

    return getAvailablePort().then(launchProcess);
  };

  Pages.createFromUrl = function(urlSpec) {
    var page = new PageModel(_.defaults({
      buggerPort: Pages.buggerPort
    }, pageFromUrl(urlSpec)));
    return Pages.launchAndConnect(page).then(Pages.save);
  };

  Pages.buggerPort = 8058;

  return Pages;
};
