'use strict';

var Board = require('./lib/board');

function bs2serial(app, opts, cb){

  var namespace = opts.namespace || 'bs2serial';

  var board = new Board();

  app.expose(namespace, board);

  cb();
}

module.exports = bs2serial;
