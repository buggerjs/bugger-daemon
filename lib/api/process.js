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

var respond = require('quinn-respond');

module.exports = function ProcessResource(ProcessModel, respond) {
  respond || (respond = require('./respond'));
  ProcessModel || (ProcessModel = require('../model/process')());
  var ConcatStream = require('concat-stream');

  var STATUS_CODES = require('http').STATUS_CODES;

  function processWithPid(pid, req, res) {
    switch (req.method) {
      case 'GET':
        var process;
        try {
          process = ProcessModel.get(pid);
        } catch (err) {
          return respond.error(res, err);
        }
        return respond.json(res, process);
      case 'PUT':
        return req.pipe(new ConcatStream(function(body) {
          var process;
          try {
            process = JSON.parse(body);
            process.pid = pid;
          } catch (err) {
            err.context = (body || '').toString();
            return respond.error(res, err, 400);
          }

          try {
            process = ProcessModel.store(process);
          } catch (err) {
            return respond.error(res, err, 400);
          }
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Location': '/processes/' + process.pid
          });
          return res.end(JSON.stringify({ success: true }));
        }));
      case 'DELETE':
        store.remove(pid);
        return res.end('OK');
      default:
        return respond.error(res, 405);
    }
  };

  function processList(req, res) {
    var skip = req.parsedUrl.query.skip,
        limit = req.parsedUrl.query.limit;

    if (skip != null) { skip = parseInt(skip, 10); }
    if (limit != null) { limit = parseInt(limit, 10); }
    return respond.json(res, ProcessModel.all(skip, limit));
  };

  function sourceMap(pid, mapId, req, res) {
    return res.end('SourceMap ' + pid + ', ' + mapId);
  };

  return function(req, res) {
    var pid = req.parsedUrl.segments.shift();
    if (pid != null) {
      var subResource = req.parsedUrl.segments.shift();
      if (subResource == null) {
        return processWithPid(pid, req, res);
      } else {
        switch (subResource) {
          case 'source-maps':
            var mapId = req.parsedUrl.segments.shift();
            return sourceMap(pid, mapId, req, res);
          default:
            return respond.error(res, 404);
        }
      }
    } else {
      return processList(req, res);
    }
  };
};
