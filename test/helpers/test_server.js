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
    server = buggerd.createServer()
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
