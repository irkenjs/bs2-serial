'use strict';

var SerialPort = require('serialport').SerialPort;
var bs2 = require('bs2-programmer');
var bluebird = require('bluebird');
var bs2tokenizer = require('pbasic-tokenizer');

var serial = require('./serial');

function bootload(options, cb){

  if(!options){
    throw new Error('Options error: no options');
  }

  if(!options.path){
    throw new Error('Options error: no path');
  }

  if(!options.memory || !options.memory.data){
    throw new Error('Options error: no program data');
  }

  if(!options.board){
    throw new Error('Options error: no board');
  }

  var serialport = new SerialPort(options.path, { baudrate: 200 }, false);
  bluebird.promisifyAll(serialport);

  var result = bluebird.using(serial.open(serialport), function(){
    return serial.bootload(serialport, options);
  });

  return result.nodeify(cb);
}

function compile(options, cb){

  var TModuleRec = bs2tokenizer.compile(options.source, false);

  if(!TModuleRec.Succeeded){
    throw new Error('Compile error: ', TModuleRec.Error);
  }

  var memory = {
    data: TModuleRec.PacketBuffer.slice(0, TModuleRec.PacketCount * 18)
  };

  var result = bluebird.resolve(memory);

  return result.nodeify(cb);
}

function getRevisions(cb){
  var result = bluebird.resolve(bs2.revisions);

  return result.nodeify(cb);
}

module.exports = {
  bootload: bootload,
  compile: compile,
  getRevisions: getRevisions
};
