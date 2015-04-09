'use strict';

var bs2 = require('bs2-programmer');
var bluebird = require('bluebird');
var bs2tokenizer = require('pbasic-tokenizer');
var Bs2SerialProtocol = require('bs2-serial-protocol');

function internalCompile(options){
  var TModuleRec = bs2tokenizer.compile(options.source, false);

  if(!TModuleRec.Succeeded){
    throw new Error('Compile error: ' + TModuleRec.Error);
  }

  var memory = {
    data: TModuleRec.PacketBuffer.slice(0, TModuleRec.PacketCount * 18)
  };

  return memory;
}

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

  var protocol = new Bs2SerialProtocol({ path: options.path });

  var bs2Options = {
    protocol: protocol,
    revision: options.board
  };

  return bs2.bootload(options.memory.data, bs2Options, cb);
}

function compile(options, cb){
  var result = bluebird.try(internalCompile, options);

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
