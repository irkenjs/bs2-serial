'use strict';

var _ = require('lodash');
var util = require('util');
var bs2 = require('bs2-programmer');
var bluebird = require('bluebird');
var Bs2Programmer = bs2.Programmer;
var bs2tokenizer = require('pbasic-tokenizer');
var EventEmitter = require('events').EventEmitter;
var Bs2SerialProtocol = require('bs2-serial-protocol');

function internalCompile(source){
  var TModuleRec = bs2tokenizer.compile(source, false);

  if(!TModuleRec.Succeeded){
    throw new Error('Compile error: ' + TModuleRec.Error);
  }

  var memory = {
    data: TModuleRec.PacketBuffer.slice(0, TModuleRec.PacketCount * 18)
  };

  return memory;
}

function Board(options){
  if(!options){
    throw new Error('Options error: no options');
  }

  if(!options.path){
    throw new Error('Options error: no path');
  }

  EventEmitter.call(this);

  this._revision = options.revision || 'bs2';
  this._protocol = new Bs2SerialProtocol(options);
  this._programmer = new Bs2Programmer({
    protocol: this._protocol,
    revision: this._revision
  });

  var self = this;

  this._programmer.on('bootloadProgress', function(progress){
    self.emit('progress', progress);
  });

  this._protocol.on('terminal', function(evt){
    self.emit('terminal', evt);
  });
}

util.inherits(Board, EventEmitter);

Board.search = function(portList, cb){
  var revisions = _.keys(bs2.revisions);
  return bluebird.reduce(portList, function(boardList, path){

    var protocol = new Bs2SerialProtocol({ path: path });
    return bluebird.reduce(revisions, function(current, rev){
      if(current){
        return current;
      }

      var boardOpts = {
        protocol: protocol,
        revision: rev
      };

      return bs2.identify(boardOpts)
        .then(function(result){
          return _.assign({ path: path, revision: rev }, result);
        })
        .otherwise(function(){
          return null;
        });

    }, null)
    .then(function(board){
      if(board != null){
        boardList.push({
          name: board.name,
          path: board.path,
          board: {
            path: board.path,
            revision: board.revision
          }
        });
      }
      return boardList;
    });

  }, []).nodeify(cb);
};

Board.prototype.bootload = function(memory, cb){
  if(!memory || !memory.data){
    throw new Error('Options error: no program data');
  }

  return this._programmer.bootload(memory.data, cb);
};

Board.prototype.compile = function(source, cb){
  var result = bluebird.try(internalCompile, source);

  return result.nodeify(cb);
};

Board.prototype.isOpen = function(){
  return !!_.get(this, '_protocol._isOpen');
};

Board.prototype.close = function(cb){
  return this._protocol.close(cb);
};

Board.getRevisions = function(){
  return bs2.revisions;
};

module.exports = Board;
