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

exports.pageFromUrl = function pageFromUrl(urlSpec) {
  // {pwd}:{script}
  var match = urlSpec.match(
    /^bugger:\/\/([^:?#]+):([^:?#]+)(\?[^:?#]+)?(#[^:?#]+)?$/
  );
  if (match) {
    var cwd = match[1];
    var script = match[2];
    var qs = match[3] ? match[3].substr(1) : '';
    var pid = match[4] ? parseInt(match[4].substr(1), 10) : null;
    return {
      cwd: cwd,
      script: script,
      pid: pid,
      args: []
    };
  } else {
    throw new Error('Invalid bugger:// url:' + urlSpec);
  }
};

exports.pageToUrl = function pageToUrl(page) {
  var urlSpec = 'bugger://' + page.cwd + ':' + page.script;
  var query = {};
  if (page.args.length) {
    query.args = JSON.stringify(page.args);
  }
  var qs = querystring.stringify(query);
  if (qs) urlSpec += '?' + qs;
  if (page.pid) urlSpec += '#' + page.pid;

  return urlSpec;
};
