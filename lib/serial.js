'use strict';

var bs2 = require('bs2-programmer');
var partial = require('lodash/function/partial');
var bluebird = require('bluebird');

function cleanup(serialport){
  return serialport.closeAsync();
}

function open(serialport){
  return serialport.openAsync().return(serialport).disposer(cleanup);
}

function setBrk(serialport){
  return serialport.writeAsync(new Buffer([0x00])).return(serialport);
}

function setDtr(serialport){
  return serialport.setAsync({ dtr: false }).return(serialport);
}

function clrDtr(serialport){
  return serialport.setAsync({ dtr: true }).return(serialport);
}

function clrBrk(serialport){
  return serialport.updateAsync({ baudRate: 9600 }).return(serialport);
}

function send(options, revision, serialport){
  return bs2.bootload(serialport, revision, options.memory.data);
}

function identify(revision, serialport){
  return bs2.identify(serialport, revision);
}

function bootload(serialport, options, revision){
  return bluebird.try(setBrk, serialport)
    .then(setDtr)
    .delay(2)
    .then(clrDtr)
    .delay(100) //need to wait for the setbrk byte to get out on the line
    .then(clrBrk)
    .then(partial(send, options, revision));
}

function test(serialport, revision){
  return bluebird.try(setBrk, serialport)
    .then(setDtr)
    .delay(2)
    .then(clrDtr)
    .delay(100) //need to wait for the setbrk byte to get out on the line
    .then(clrBrk)
    .then(partial(identify, revision));
}

module.exports = {
  bootload: bootload,
  open: open,
  setBrk: setBrk,
  setDtr: setDtr,
  clrDtr: clrDtr,
  clrBrk: clrBrk,
  send: send,
  test: test
};
