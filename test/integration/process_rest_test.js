
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
