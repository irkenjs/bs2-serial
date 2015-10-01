'use strict';

var _ = require('lodash');
var util = require('util');
var bs2 = require('bs2-programmer');
var nodefn = require('when/node');
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
    error: !TModuleRec.Succeeded ? TModuleRec.Error : null,
    raw: TModuleRec
  };

  return program;
}

function generateEmptyPort(port, err){
  return {
    name: null,
    path: port,
    type: 'bs2',
    match: false,
    program: null,
    displayError: err,
    board: {
      path: port
    }
  };
}

function listPorts(options){
  var reject = _.get(options, 'reject') || [];
  var predicate = reject;
  if(Array.isArray(reject)){
    predicate = function(port){
      return _.some(reject, function(entry){
        if(typeof entry === 'string'){
          return port === entry;
        }
        return entry.test(port);
      });
    };
  }
  return Bs2SerialProtocol.listPorts()
    .then(function(portList){
      return _.reject(portList, predicate);
    });
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

  reemit(this._protocol, this, ['terminal', 'transmit', 'open', 'close']);

  var self = this;
  this._programmer.on('bootloadProgress', function(progress){
    self.emit('progress', progress);
  });
}

util.inherits(Board, EventEmitter);

Board.search = function(options, cb){
  var revisions = _.keys(bs2.revisions);
  var result = listPorts(options)
    .then(function(portList){
      return bluebird.reduce(portList, function(boardList, path){

        var protocol = new Bs2SerialProtocol({ path: path });
        return bluebird.reduce(revisions, function(current, rev){
          if(current.revision){
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
            .otherwise(function(err){
              if(err.message === 'Serialport not open.'){
                //workaround for generic browser-serialport errors
                //TODO improve error messages in browser-serialport
                err = new Error('Port could not be opened.');
              }
              return {
                displayError: err.message
              };
            });

        }, {})
        .then(function(board){
          if(board.revision != null){
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
          }else{
            boardList.push(generateEmptyPort(path, board.displayError));
          }
          return boardList;
        });
      }, [])
      .then(function(boards){
        return _.sortBy(boards, 'name');
      });
    });

  return nodefn.bindCallback(result, cb);
};

Board.prototype.bootload = function(program, cb){
  if(typeof program === 'string'){
    program = internalCompile(program);
  }
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
  return this._protocol.isOpen();
};

Board.prototype.write = function(data, cb){
  if(typeof data === 'number'){
    data = new Buffer([data]);
  }else if(Array.isArray(data) || typeof data === 'string'){
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

Board.prototype.setBaudrate = function(baudrate, cb){
  return this._protocol.setBaudrate(baudrate, cb);
};

Board.getRevisions = function(){
  return bs2.revisions;
};

module.exports = Board;
