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

var _ = require('lodash');

var PageModel = require('./model');
var pageFromUrl = require('./url').pageFromUrl;

module.exports = function() {
  var store = {};
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

  Pages.createFromUrl = function(urlSpec) {
    var page = new PageModel(_.defaults({
      buggerPort: Pages.buggerPort
    }, pageFromUrl(urlSpec)));
    return Pages.save(page);
  };

  Pages.buggerPort = 8058;

  return Pages;
};
