'use strict';

var map = require('lodash.map');
var bs2 = require('bs2-programmer');

var Board = require('./lib/board');

function bs2serial(app, opts, cb){

  if(!app.conveyor){
    throw new Error('Register error: conveyor not found in app namespace');
  }

  map(bs2.revisions, function(revision) {
    var board = new Board(revision);
    app.conveyor.addBoard(revision.name, board);
  });

  cb();
}

module.exports = bs2serial;
