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

var ConcatStream = require('concat-stream');
var http = require('http');
var buggerd = require('../../lib/bugger-daemon');

module.exports = function getTestServer() {
  function makeRequest(opts, cb, errCb) {
    if ('string' === typeof opts) {
      if (opts.indexOf('/') === 0) {
        opts = 'http://127.0.0.1:8050' + opts;
      }
    } else if (opts != null && 'object' === typeof opts) {
      if (opts.port == null) {
        opts.port = 8050;
      }
    }

    var req = http.request(opts, function(res) {
      res.pipe(new ConcatStream(function(body) {
        var json;
        try {
          json = JSON.parse(body);
        } catch (err) {
          // ignore
        }
        try {
          cb(null, json, res, body);
        } catch (err) {
          if (errCb) { errCb(err); }
        }
      })).on('error', function(err) { cb(err); });
    }).on('error', cb);

    if ('object' === typeof opts) {
      if (opts['data'] != null) {
        req.write(JSON.stringify(opts['data']));
      }
    }
    req.end();

    return req;
  };

  var server;
  beforeEach(function(done) {
    server = buggerd().httpServer
    .listen(8050, '127.0.0.1', function() {
      return done();
    });
  });

  afterEach(function(done) {
    server.on('close', done);
    server.close();
  });

  return {
    request: makeRequest
  }
}
