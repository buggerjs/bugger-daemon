#!/usr/bin/env node

require('../index')
.createServer()
.listen(8058, '127.0.0.1', function() {
  var address = this.address();
  console.log('bugger-daemon listening:', address);
  console.log('Press Ctrl+C to quit.');
});
