'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;

var PREFIX = 'linagora.io.';

var mailerModule = new AwesomeModule(PREFIX + 'mailer', {
  dependencies: [
    new Dependency(Dependency.TYPE_ABILITY, 'logger', 'logger')
  ],

  states: {
    lib: function(dependencies, callback) {
      var lib = require('./module')(dependencies);
      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      return callback();
    },

    start: function(dependencies, callback) {

      var logger = dependencies('logger');
      var webserver = dependencies('webserver').application;

      this.lib.start(webserver, function(err) {
        if (err) {
          logger.warn('Module failed to start', err);
        }
        callback.apply(this, arguments);
      });
    }
  }
});

/**
 *
 * @type {AwesomeModule}
 */
module.exports = mailerModule;
