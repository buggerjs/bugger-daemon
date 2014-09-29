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

var querystring = require('querystring');

var uuid = require('node-uuid');
var _ = require('lodash');

module.exports = function() {
  var store = {};

  function PageModel(props) {
    props = props || {};

    this.id = props.id || PageModel.generateId();
    this.pid = props.pid || null;
    this.port = props.port || null;

    this.cwd = props.cwd;
    this.script = props.script;
    this.args = Array.isArray(props.args) ? props.args : [];

    this.description = props.description || '';
    this.faviconUrl = props.faviconUrl || '';

    this.joinedAt = props.joinedAt || Date.now();
    this.lastUpdate = props.lastUpdate || Date.now();
  };

  Object.defineProperties(PageModel.prototype, {
    title: {
      get: function() {
        return [this.script].concat(this.args.map(function(el) {
          if (el.indexOf(' ') !== -1)
            return JSON.stringify(el);
          return el;
        })).join(' ');
      }
    },

    url: {
      get: function() {
        var urlSpec = 'bugger://' + this.cwd + ':' + this.script;
        var query = {};
        if (this.args.length) {
          query.args = JSON.stringify(args);
        }
        var qs = querystring.stringify(query);
        if (qs) urlSpec += '?' + qs;
        if (this.pid) urlSpec += '#' + this.pid;
        return urlSpec;
      }
    },

    devtoolsFrontendUrl: {
      get: function() {
        return '/devtools/devtools.html?' +
               this.webSocketDebuggerUrl.replace(/^ws:\/\//, 'ws=') +
               '&amp;toolbarColor=rgba(230,230,230,1)&amp;textColor=rgba(0,0,0,1)';
      }
    },

    webSocketDebuggerUrl: {
      get: function() {
        return 'ws://127.0.0.1:' + PageModel.buggerPort + '/devtools/page/' + this.id;
      }
    }
  });

  PageModel.prototype.validate = function() {
    return true;
  };

  PageModel.prototype.toJSON = function() {
    return _.pick(this,
      'description', 'devtoolsFrontendUrl',
      'faviconUrl', 'id', 'title', 'type',
      'url', 'webSocketDebuggerUrl');
  };

  PageModel.store = function(page) {
    if (!(page instanceof PageModel)) {
      page = new PageModel(page);
    }
    page.validate();
    if (store[page.id] != null) {
      page.joinedAt = store[page.id].joinedAt;
    }
    return store[page.id] = page;
  };

  PageModel.remove = function(id) {
    delete store[id];
  };

  PageModel.all = function(skip, limit) {
    var acc = _.values(store);

    if (skip  == null || isNaN(skip)) { skip = 0; }
    if (limit == null || isNaN(limit)) { limit = acc.length; }

    return acc.slice(skip, skip + limit);
  };

  PageModel.get = function(id) {
    if (!store[id]) {
      var err = new Error('Process not found');
      err.code = 404;
      throw err;
    }
    return store[id];
  };

  PageModel.generateId = function() {
    return uuid.v1().toUpperCase();
  };

  PageModel.fromUrlSpec = function(urlSpec) {
    // {pwd}:{script}
    var match = urlSpec.match(
      /^bugger:\/\/([^:?#]+):([^:?#]+)(\?[^:?#]+)?(#[^:?#]+)?$/
    );
    if (match) {
      var cwd = match[1];
      var script = match[2];
      var qs = match[3] ? match[3].substr(1) : '';
      var pid = match[4] ? parseInt(match[4].substr(1), 10) : null;
      return new PageModel({
        cwd: cwd,
        script: script,
        pid: pid,
        args: []
      });
    } else {
      throw new Error('Invalid bugger:// url:' + urlSpec);
    }
  };

  PageModel.buggerPort = 8058;

  return PageModel;
};
