'use strict';

var SerialPort = require('serialport').SerialPort;
var bs2 = require('bs2-programmer');
var bluebird = require('bluebird');

var serial = require('./serial');

function Board(revision){
  this.revision = revision;
}

Board.prototype.bootload = function bootload(options, cb){
  var self = this;

  if(!options){
    throw new Error('Options error: no options');
  }

  if(!options.path){
    throw new Error('Options error: no path');
  }

  if(!options.memory || !options.memory.data){
    throw new Error('Options error: no program data');
  }

  var serialport = new SerialPort(options.path, { baudrate: 200 }, false);
  bluebird.promisifyAll(serialport);

  var result = bluebird.using(serial.open(serialport), function(){
    return serial.bootload(serialport, options, self.revision);
  });

  return result.nodeify(cb);
};

//stub for now -- returns pre compiled data
Board.prototype.compile = function compile(options, cb){
  var memory = {
    data: new Buffer([0xFF, 0x00, 0x00, 0x00, 0x00, 0x30, 0xA0, 0xC7, 0x92, 0x66, 0x48, 0x13, 0x84, 0x4C, 0x35, 0x07, 0xC0, 0x4B])
  };

  var result = bluebird.resolve(memory);

  return result.nodeify(cb);
};


module.exports = Board;
