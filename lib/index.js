'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var PREFIX = 'linagora.io.';

var mailerModule = new AwesomeModule(PREFIX + 'mailer', {
  dependencies: [
    new Dependency(Dependency.TYPE_ABILITY, 'logger', 'logger'),
    new Dependency(Dependency.TYPE_ABILITY, 'esn-config', 'esn-config')
  ],

  states: {
    lib: function(dependencies, callback) {
      var lib = require('./module')(dependencies);
      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      return callback();
    }
  }
});

/**
 *
 * @type {AwesomeModule}
 */
module.exports = mailerModule;
