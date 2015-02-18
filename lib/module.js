'use strict';

/**
 *
 * @param {hash} dependencies
 * @param {Function} callback
 * @return {*}
 */
module.exports = function(dependencies, callback) {

  var config = dependencies('config');
  var logger = dependencies('logger');

  var lib = {};

  var start = function(webserver, callback) {
    lib.started = true;
    return callback();
  };

  lib.start = start;

  return callback(null, lib);
};
