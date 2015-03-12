'use strict';

var expect = require('expect');

var Irken = require('irken');

var plugins = [
{
  register: require('../')
}
];

describe('bs2-serial', function(){

  var app;

  beforeEach(function(done){
    app = new Irken();
    done();
  });

  it('#registers plugin and exposes board in default namespace', function(done){

    app.register(plugins, function(err){
      expect(err).toNotExist();
      expect(app.bs2serial).toExist();
      done();
    });
  });

  it('#registers plugin and exposes board in optional namespace', function(done){

    var plugins = [
    {
      register: require('../'),
      options: {namespace: 'tacos'}
    }
    ];

    app.register(plugins, function(err){
      expect(app.tacos).toExist();
      done();
    });
  });

  it('#bootload errors on no path', function(done){

    var options = {};

    app.register(plugins, function(err){
      app.bs2serial.bootload({}, function(err){
        expect(err).toExist();
        expect(err.message).toEqual('Options error: no path');
        done();
      });
    });
  });

  it('#bootload errors on no program data', function(done){

    var options = {
      path: '/dev/tacos',
    };

    app.register(plugins, function(err){
      app.bs2serial.bootload(options, function(err){
        expect(err).toExist();
        expect(err.message).toEqual('Options error: no program data');
        done();
      });
    });
  });

  it('#bootload errors on no board', function(done){

    var options = {
      path: '/dev/tacos',
      memory: {
        data: 'filthy human binary'
      }
    };

    app.register(plugins, function(err){
      app.bs2serial.bootload(options, function(err){
        expect(err).toExist();
        expect(err.message).toEqual('Options error: no board');
        done();
      });
    });
  });

  it('#getrevisions returns an object', function(done){

    var options = {
      path: '/dev/tacos',
      memory: {
        data: 'filthy human binary'
      }
    };

    app.register(plugins, function(err){
      app.bs2serial.getRevisions(function(err, revisions){
        expect(err).toNotExist();
        expect(revisions).toBeAn('object');
        done();
      });
    });
  });
});
