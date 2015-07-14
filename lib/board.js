'use strict';

var _ = require('lodash');
var util = require('util');
var bs2 = require('bs2-programmer');
var bluebird = require('bluebird');
var Bs2Programmer = bs2.Programmer;
var reemit = require('re-emitter');
var bs2tokenizer = require('pbasic-tokenizer');
var EventEmitter = require('events').EventEmitter;
var Bs2SerialProtocol = require('bs2-serial-protocol');

function internalCompile(source){
  var TModuleRec = bs2tokenizer.compile(source, false);

  var program = {
    data: TModuleRec.PacketBuffer.slice(0, TModuleRec.PacketCount * 18),
    name: TModuleRec.TargetModuleName,
    error: !TModuleRec.Succeeded ? TModuleRec.Error : null
  };

  return program;
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

  reemit(this._protocol, this, ['terminal', 'open', 'close']);

  var self = this;
  this._programmer.on('bootloadProgress', function(progress){
    self.emit('progress', progress);
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
          program: null
        };
        if(options.source){
          details.program = internalCompile(options.source);
          details.match = details.program.name === board.name;
        }
        boardList.push(details);
      }
      return boardList;
    });

  }, []).nodeify(cb);
};

Board.prototype.bootload = function(program, cb){
  if(program && program.error){
    return bluebird.reject(program.error).nodeify(cb);
  }
  if(!program || !program.data){
    return bluebird.reject(new Error('Options error: no program data')).nodeify(cb);
  }

  return this._programmer.bootload(program.data, cb);
};

Board.compile = function(source){
  return internalCompile(source);
};

Board.prototype.isOpen = function(){
  return !!_.get(this, '_protocol._isOpen');
};

Board.prototype.write = function(data, cb){
  if(typeof data === 'number'){
    data = new Buffer([data]);
  }else if(Array.isArray(data)){
    data = new Buffer(data);
  }
  return this._protocol.write(data, cb);
};

Board.prototype.open = function(cb){
  return this._protocol.open(cb);
};

Board.prototype.close = function(cb){
  return this._protocol.close(cb);
};

Board.getRevisions = function(){
  return bs2.revisions;
};

module.exports = Board;
