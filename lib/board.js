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

  var module = {
    data: TModuleRec.PacketBuffer.slice(0, TModuleRec.PacketCount * 18),
    name: TModuleRec.TargetModuleName,
    error: !TModuleRec.Succeeded ? TModuleRec.Error : null
  };

  return module;
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

Board.search = function(portList, options, cb){
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
        var details = {
          name: board.name,
          path: board.path,
          version: board.version,
          board: _.cloneDeep(board),
          match: false,
          data: null
        };
        if(options.source){
          var module = internalCompile(options.source);
          if(!module.error && module.name === board.name){
            _.assign(details, {
              match: true,
              data: module.data
            });
          }
        }
        boardList.push(details);
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

Board.compile = function(source){
  return internalCompile(source);
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
