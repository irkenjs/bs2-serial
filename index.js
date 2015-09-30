'use strict';

var _ = require('lodash');
var board = require('./lib/board');

function bs2serial(app, opts, cb){

  var namespace = opts.namespace || 'bs2serial';

  var Board = _.clone(board);
  Board.Programmer = opts.programmer.Programmer;
  Board.Identify = opts.programmer.identify;
  Board.Revisions = opts.programmer.revisions;
  Board.Protocol = opts.protocol;
  Board.Transport = opts.transport;
  Board.Tokenizer = opts.tokenizer;

  app.expose(namespace, Board);
  app.addBoard('bs2', Board);

  cb();
}

module.exports = bs2serial;
