'use strict';

var assert = require('assertive');

var PageModel = require('../../../lib/page/model');

describe('page/model', function() {
  beforeEach(function() {
    this.pages = PageModel();
  });

  describe('fromUrlSpec', function() {
    describe('valid url with cwd and script', function() {
      var pageUrl = 'bugger:///tmp/my-module:example/ok.js';

      beforeEach(function() {
        this.page = this.pages.fromUrlSpec(pageUrl);
      });

      it('assigns an id', function() {
        assert.hasType(String, this.page.id);
      });

      it('parses cwd', function() {
        assert.equal('/tmp/my-module', this.page.cwd);
      });

      it('parses script', function() {
        assert.equal('example/ok.js', this.page.script);
      });

      it('can re-generate the url', function() {
        assert.equal(pageUrl, this.page.url);
      });
    });
  });
});
