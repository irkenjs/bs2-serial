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
        register: require('conveyor')
      },
      {
        register: require('../')
      }
    ];

    done();
  });

  it('#registers boards to conveyor', function(done){

    app.register(plugins, function(){
      app.conveyor.listBoards(function(err, boards){
        expect(err).toNotExist();
        expect(boards).toExist();
        done();
      });
    });
  });

  it('#bootload throws on no path', function(done){

    var options = {};

    app.register(plugins, function(){
      app.conveyor.getBoard('BS2', function(err, board){
        function invalid(){
          board.bootload(options);
        }

        expect(invalid).toThrow(/Options error: no path/);
        done();
      });
    });
  });

  it('#bootload throws on no program data', function(done){

    var options = {
      path: '/dev/tacos'
    };

    app.register(plugins, function(){
      app.conveyor.getBoard('BS2', function(err, board){
        function invalid(){
          board.bootload(options);
        }

        expect(invalid).toThrow(/Options error: no program data/);
        done();
      });
    });
  });
});
