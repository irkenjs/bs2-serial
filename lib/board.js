'use strict';

var com = require('serialport');
var when = require('when');
var nodefn = require('when/node');

var bs2 = require('bs2-programmer');

function Board(){
}

Board.prototype.bootload = function bootload(options, cb){
  
  if(!options){
    return(cb('Options error: no options'));
  }

  if(!options.hasOwnProperty('path'))
  {
    return cb('Options error: no path');
  }

  if(!options.hasOwnProperty('memory') || !options.memory.hasOwnProperty('data'))
  {
    return cb('Options error: no program data');
  }

  if(!options.hasOwnProperty('board'))
  {
    return cb('Options error: no board');
  }

  var serialPort = new com.SerialPort(options.path, {
    baudrate: 200
  }, false);

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


  var promise = nodefn.lift(serialPort.open.bind(serialPort))()
  .then(setDtr)
  .delay(2)
  .then(clrDtr)
  .then(setBrk)
  //should only return once byte was written? but find a delay necessary anyway
  .delay(100)
  .then(clrBrk)
  .then(send)
  .finally(close);

  return nodefn.bindCallback(promise, cb);
};

//stub for now -- returns pre compiled data
Board.prototype.compile = function bootload(options, cb){
  var memory =  {
    data: new Buffer([0xFF, 0x00, 0x00, 0x00, 0x00, 0x30, 0xA0, 0xC7, 0x92, 0x66, 0x48, 0x13, 0x84, 0x4C, 0x35, 0x07, 0xC0, 0x4B])
  };
  cb(null, memory);
};

Board.prototype.getRevisions = function getRevisions(cb){
  cb(null, bs2.revisions);
};

module.exports = Board;