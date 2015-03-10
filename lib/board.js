'use strict';

var com = require('serialport');
var when = require('when');
var nodefn = require('when/node');

var bs2 = require('bs2-programmer');

function Board(){
}

Board.prototype.bootload = function bootload(options, cb){

  if(!options.hex){
    options.hex = new Buffer([0xFF, 0x00, 0x00, 0x00, 0x00, 0x30, 0xA0, 0xC7, 0x92, 0x66, 0x48, 0x13, 0x84, 0x4C, 0x35, 0x07, 0xC0, 0x4B]);
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

  function bootload(){
    return bs2.bootload(serialPort, bs2.revisions.bs2, options.hex);
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
  .then(bootload)
  .finally(close);

  return nodefn.bindCallback(promise, cb);
}

module.exports = Board;