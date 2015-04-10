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

    var options = {
      path: '/dev/tacos',
      revision: 'bs2'
    };

    app.register(plugins, function(){
      // TODO: it doesn't make sense to getRevisions when you defined
      // one in the options to the constructor
      var board = new app.bs2serial(options);
      board.getRevisions(function(err, revisions){
        expect(err).toNotExist();
        expect(revisions).toBeAn('object');
        done();
      });
    });
  });
});
