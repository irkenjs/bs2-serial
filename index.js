'use strict';

var board = require('./lib/board');

function bs2serial(app, opts, cb){

  var namespace = opts.namespace || 'bs2serial';

  app.expose(namespace, board);

  cb();
}

module.exports = bs2serial;
