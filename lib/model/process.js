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

assert = require('assert');

module.exports = function() {
  var store = {};

  function ProcessModel(properties) {
    this.params = [];

    var propKey;
    for (propKey in properties) {
      this[propKey] = properties[propKey];
    }
    if (this.pid != null && typeof this.pid !== 'number') {
      this.pid = parseInt(this.pid, 10);
    }

    this.joinedAt = Date.now();
    this.lastUpdate = Date.now();

    Object.defineProperty(this, 'title', {
      get: function() {
        return [this.script].concat(this.params.map(function(el) {
          if (el.indexOf(' ') !== -1) {
            return JSON.stringify(el);
          } else {
            return el;
          }
        })).join(' ');
      }
    });

    Object.defineProperty(this, 'websocket', {
      get: function() {
        return '/processes/' + this.pid;
      }
    });

    Object.defineProperty(this, 'href', {
      get: function() {
        return 'chrome-devtools://devtools/devtools.html?ws=127.0.0.1:8058' +
               this.websocket +
               '&amp;toolbarColor=rgba(230,230,230,1)&amp;textColor=rgba(0,0,0,1)';
      }
    });
  };

  ProcessModel.prototype.validate = function() {
    assert(
      typeof this.pid === 'number' && !isNaN(this.pid) &&
      Math.floor(this.pid) === this.pid && this.pid > 0,
      'Invalid pid: ' + this.pid);
    assert(typeof this.pwd === 'string' && this.pwd.length > 0,
      'pwd has to be a non-empty string');
    assert(typeof this.script === 'string' && this.script.length > 0,
      'script has to be a non-empty string');
    assert(Array.isArray(this.params),
      'params has to be an array');
    return true;
  };

  ProcessModel.prototype.toJSON = function() {
    return {
      pid: this.pid,
      title: this.title,
      script: this.script,
      params: this.params,
      pwd: this.pwd,
      websocket: this.websocket,
      joinedAt: this.joinedAt,
      lastUpdate: this.lastUpdate,
      href: this.href
    };
  };

  ProcessModel.store = function(process) {
    if (!(process instanceof ProcessModel)) {
      process = new ProcessModel(process);
    }
    process.validate();
    if (store[process.pid] != null) {
      process.joinedAt = store[process.pid].joinedAt;
    }
    return store[process.pid] = process;
  };

  ProcessModel.remove = function(pid) {
    if (typeof pid != 'number') pid = parseInt(pid, 10);
    delete store[pid];
  };

  ProcessModel.all = function(skip, limit) {
    var acc = [];
    for (pid in store) {
      acc.push(store[pid]);
    }

    if (skip  == null || isNaN(skip)) { skip = 0; }
    if (limit == null || isNaN(limit)) { limit = acc.length; }

    return acc.slice(skip, skip + limit);
  };

  ProcessModel.get = function(pid) {
    if (typeof pid != 'number') pid = parseInt(pid, 10);

    if (store[pid] == null) {
      var err = new Error('Process not found');
      err.code = 404;
      throw err;
    }
    return store[pid];
  };

  return ProcessModel;
};
