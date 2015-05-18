'use strict';

var _ = require('lodash');
var bs2 = require('bs2-programmer');
var through = require('through2');
var bluebird = require('bluebird');
var bs2tokenizer = require('pbasic-tokenizer');
var Bs2Programmer = bs2.Programmer;
var Bs2SerialProtocol = require('bs2-serial-protocol');

function parseChunk(chunk){
  var str = '';
  for(var idx = 0; idx < chunk.length; idx++){
    var char = chunk[idx];
    if(char === 13){
      str += '\n';
    } else {
      str += String.fromCharCode(char);
    }
  }
  return str;
}

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

  if(!options.revision){
    throw new Error('Options error: no revision');
  }

  this._revision = options.revision || 'bs2';
  this._protocol = new Bs2SerialProtocol(options);
  this._programmer = new Bs2Programmer({
    protocol: this._protocol,
    revision: this._revision
  });
}

Board.search = function(portList, cb){
  var revisions = _.keys(bs2.revisions);
  return bluebird.reduce(portList, function(boardList, port){

    var protocol = new Bs2SerialProtocol({ path: port });
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
          return _.assign({ port: port }, result);
        })
        .otherwise(function(){
          return null;
        });

    }, null)
    .then(function(board){
      if(board != null){
        boardList.push(board);
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

// TODO: bring this down into the protocol level
Board.prototype.read = function(options){
  options = options || {};

  var stream = through();

  this._protocol._transport.on('data', function(chunk){
    if(options.raw){
      return stream.write(chunk);
    }

    stream.write(parseChunk(chunk));
  });

  return stream;
};

Board.prototype.compile = function(source, cb){
  var result = bluebird.try(internalCompile, source);

  return result.nodeify(cb);
};

Board.getRevisions = function(){
  return bs2.revisions;
};

module.exports = Board;
