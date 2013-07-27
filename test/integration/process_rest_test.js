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

var expect = require('expect.js');

var getTestServer = require('../helpers/test_server');

describe('/processes resource', function() {
  var testServer = getTestServer();

  it('starts of with an empty process list', function(done) {
    testServer.request('/processes', function(err, json, res, body) {
      if (err != null) return done(err);
      expect(json).to.eql([]);
      done();
    }, done);
  });

  it('supports registering a process', function(done) {
    testServer.request({
      path: '/processes/42',
      method: 'PUT',
      data: {
        pid: 54,
        pwd: '/usr/local/my_app',
        script: 'app.js',
        params: [ '--port=8080' ]
      }
    }, function(err, json, res) {
      if (err != null) return done(err);
      expect(json).to.eql({ success: true });

      testServer.request('/processes', function(err, json, res, body) {
        if (err != null) return done(err);
        expect(json).to.be.an('object');
        expect(json.length).to.be(1);
        expect(json[0].pid).to.be(42);
        expect(json[0].pwd).to.be('/usr/local/my_app');
        expect(json[0].title).to.be('app.js --port=8080');
        expect(json[0].websocket).to.be('/processes/42');
        done();
      }, done);
    }, done);
  });
});
