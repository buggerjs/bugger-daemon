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

var respond = require('quinn-respond');
var PROTOCOL_VERSION = require('bugger-agents/package.json').protocolVersion;

var PageController = require('./page');

module.exports = function(buggerd) {
  var page = new PageController(buggerd.Pages);

  return function handleApiRequest(req) {
    var parsed = url.parse(req.url, true);
    var pathname = parsed.pathname.replace(/\/$/, '');

    // Simple string paths first
    switch (pathname) {
      case '/json':
      case '/json/list':
        return page.index(req);

      case '/json/new':
        return page.create(req, {
          url: parsed.search.substr(1) || null
        });

      case '/json/version':
        return respond.json({
          'Browser': 'node/' + process.version.substr(1),
          'Protocol-Version': PROTOCOL_VERSION
        });
    }

    return respond.text('Not implemented').status(501);
  };
};
