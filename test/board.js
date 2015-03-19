'use strict';

var expect = require('expect');

var Irken = require('irken');

describe('bs2-serial', function(){

  var app;
  var plugins;

  beforeEach(function(done){
    app = new Irken();

    plugins = [
      {
        register: require('../')
      }
    ];

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

    plugins = [
      {
        register: require('../'),
        options: {
          namespace: 'tacos'
        }
      }
    ];

    app.register(plugins, function(err){
      expect(err).toNotExist();
      expect(app.tacos).toExist();
      done();
    });
  });

  it('#bootload throws on no path', function(done){

    var options = {};

    app.register(plugins, function(){
      function invalid(){
        app.bs2serial.bootload(options);
      }

      expect(invalid).toThrow(/Options error: no path/);
      done();
    });
  });

  it('#bootload throws on no program data', function(done){

    var options = {
      path: '/dev/tacos'
    };

    app.register(plugins, function(){
      function invalid(){
        app.bs2serial.bootload(options);
      }

      expect(invalid).toThrow(/Options error: no program data/);
      done();
    });
  });

  it('#bootload errors on no board', function(done){

    var options = {
      path: '/dev/tacos',
      memory: {
        data: 'filthy human binary'
      }
    };

    app.register(plugins, function(){
      function invalid(){
        app.bs2serial.bootload(options);
      }

      expect(invalid).toThrow(/Options error: no board/);
      done();
    });
  });

  it('#getRevisions returns an object', function(done){

    app.register(plugins, function(){
      app.bs2serial.getRevisions(function(err, revisions){
        expect(err).toNotExist();
        expect(revisions).toBeAn('object');
        done();
      });
    });
  });
});
