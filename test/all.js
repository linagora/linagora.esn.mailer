'use strict';

var mockery = require('mockery');
var path = require('path');
var tmp = 'tmp';

before(function() {
  var basePath = path.resolve(__dirname + '/..');
  var tmpPath = path.resolve(basePath, tmp);
  this.testEnv = {
    tmp: tmpPath,
    basePath: basePath
  };
  process.env.NODE_ENV = 'test';
});

beforeEach(function() {
  mockery.enable({warnOnReplace: false, warnOnUnregistered: false, useCleanCache: true});
  mockery.registerMock('./logger', require('./fixtures/logger-noop')());
  this.helpers = {};

});

afterEach(function() {
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
});
