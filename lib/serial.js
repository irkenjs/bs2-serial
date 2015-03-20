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

function reset(serialport){
  return serialport.resetAsync().return(serialport);
}

function send(options, serialport){
  return bs2.bootload(serialport, options.board, options.memory.data);
}

function bootload(serialport, options){
  return bluebird.try(reset, serialport)
    .then(partial(send, options));
}

module.exports = {
  bootload: bootload,
  open: open,
  reset: reset,
  send: send
};
