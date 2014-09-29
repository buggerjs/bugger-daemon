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

var uuid = require('node-uuid');
var _ = require('lodash');

var pageToUrl = require('./url').pageToUrl;

function generateId() {
  return uuid.v1().toUpperCase();
}

function PageModel(props) {
  props = props || {};

  this.id = props.id || generateId();
  this.pid = props.pid || null;
  this.port = props.port || null;

  this.cwd = props.cwd;
  this.script = props.script;
  this.args = Array.isArray(props.args) ? props.args : [];

  this.description = props.description || '';
  this.faviconUrl = props.faviconUrl || '';

  this.joinedAt = props.joinedAt || Date.now();
  this.lastUpdate = props.lastUpdate || Date.now();

  this.buggerPort = props.buggerPort;
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
      var urlSpec = pageToUrl(this);
      return urlSpec;
    }
  },

  devtoolsFrontendUrl: {
    get: function() {
      return '/devtools/devtools.html?' +
             this.webSocketDebuggerUrl.replace(/^ws:\/\//, 'ws=') +
             '&toolbarColor=rgba(230,230,230,1)&textColor=rgba(0,0,0,1)';
    }
  },

  webSocketDebuggerUrl: {
    get: function() {
      return 'ws://127.0.0.1:' + this.buggerPort + '/devtools/page/' + this.id;
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

PageModel.buggerPort = 8058;

module.exports = PageModel;
