'use strict';

var com = require('serialport');
var when = require('when');
var nodefn = require('when/node');

var bs2 = require('bs2-programmer');

function Board(){
}

Board.prototype.bootload = function bootload(options, cb){
  return nodefn.bindCallback(when.promise(function(resolve, reject) {

    var serialPort;

    if(!options){
      return reject(new Error('Options error: no options'));
    }

    if(!options.path)
    {
      return reject(new Error('Options error: no path'));
    }

    if(!options.memory || !options.memory.data)
    {
      return reject(new Error('Options error: no program data'));
    }

    if(!options.board)
    {
      return reject(new Error('Options error: no board'));
    }

    function open(){
      return when.promise(function(resolve, reject) {
        serialPort = new com.SerialPort(options.path, { baudrate: 200 }, function(err){
          if(err){ return reject(err); }
          return resolve();
        });
      });
    }

    function setDtr(){
      return when.promise(function(resolve, reject) {
        serialPort.set({dtr: false}, function(err){
          if(err){ return reject(err); }
          return resolve();
        });
      });
    }

    function clrDtr(){
      return when.promise(function(resolve, reject) {
        serialPort.set({dtr: true}, function(err){
          if(err){ return reject(err); }
          return resolve();
        });
      });
    }

    function setBrk(){
      return when.promise(function(resolve, reject) {
        serialPort.write(new Buffer([0x00]), function(err){
          if(err){ return reject(err); }
          return resolve();
        });
      });
    }

    function clrBrk(){
      return when.promise(function(resolve, reject) {
        serialPort.update({baudRate: 9600}, function(err){
          if(err){ return reject(err); }
          return resolve();
        });
      });
    }

    function send(){
      return bs2.bootload(serialPort, options.board, options.memory.data);
    }

    function close(){
      return when.promise(function(resolve, reject) {

        serialPort.on('error', function(err){
          return reject(err);
        });

        serialPort.on('close', function(){
          return resolve();
        });

        serialPort.close();
      });
    }

    var promise = open()
    .then(setBrk)
    .then(setDtr)
    .delay(2)
    .then(clrDtr)
    .delay(100) //need to wait for the setbrk byte to get out on the line
    .then(clrBrk)
    .then(send)
    .finally(close)
    .then(function(result){
      return resolve(result);
    },
    function(error){
      return reject(error);
    });

  }), cb);
};

//stub for now -- returns pre compiled data
Board.prototype.compile = function bootload(options, cb){
  return nodefn.bindCallback(when.promise(function(resolve, reject) {

    var memory =  {
      data: new Buffer([0xFF, 0x00, 0x00, 0x00, 0x00, 0x30, 0xA0, 0xC7, 0x92, 0x66, 0x48, 0x13, 0x84, 0x4C, 0x35, 0x07, 0xC0, 0x4B])
    };

    return resolve(memory);
  }), cb);
};

Board.prototype.getRevisions = function getRevisions(cb){
  return nodefn.bindCallback(when.promise(function(resolve, reject) {

      return resolve(bs2.revisions);
  }), cb);
};

module.exports = Board;