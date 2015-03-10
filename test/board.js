'use strict';

var lab = exports.lab = require('lab').script();
var code = require('code');

var Board = require('../lib/board');

var hex = new Buffer([0xFF, 0x00, 0x00, 0x00, 0x00, 0x30, 0xA0, 0xC7, 0x92, 0x66, 0x48, 0x13, 0x84, 0x4C, 0x35, 0x07, 0xC0, 0x4B]);

var path = '/dev/tty.usbserial-A502BMUQ';

lab.experiment('Board', function(){

  var board;

  lab.beforeEach(function(done){
    board = new Board();
    done();
  });

  lab.test('#bootload', function(done){
    board.bootload({hex: hex, path: path}, function(error, result){
      code.expect(error).to.not.exist();
      code.expect(result).to.deep.equal({name: 'BS2', version: '1.0'});
      done();
    });
  });

});