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

  it('constructor throws on no path', function(done){

    var options = {};

    app.register(plugins, function(){
      function invalid(){
        new app.bs2serial(options);
      }

      expect(invalid).toThrow(/Options error: no path/);
      done();
    });
  });

  it('constructor errors on no revision', function(done){

    var options = {
      path: '/dev/tacos'
    };

    app.register(plugins, function(){
      function invalid(){
        new app.bs2serial(options);
      }

      expect(invalid).toThrow(/Options error: no revision/);
      done();
    });
  });

  it('#bootload throws on no program data', function(done){

    var options = {
      path: '/dev/tacos',
      revision: 'bs2'
    };

    var memory = {};

    app.register(plugins, function(){
      function invalid(){
        var board = new app.bs2serial(options);
        board.bootload(memory);
      }

      expect(invalid).toThrow(/Options error: no program data/);
      done();
    });
  });

  it('#getRevisions returns an object', function(done){

    app.register(plugins, function(){
      expect(app.bs2serial.getRevisions()).toBeAn('object');
      done();
    });
  });

  it('#search processes port list and returns any found boards', function(done){
    this.timeout(30000);

    app.register(plugins, function(err){
      expect(err).toNotExist();
      expect(app.bs2serial).toExist();
      expect(app.bs2serial.search).toExist();
      app.bs2serial.search(['/dev/tty.usbserial-A502BMX2', '/dev/zero'], function(error, results){
        expect(error).toNotExist();
        expect(results).toExist();
        done(error);
      });
    });
  });
});
