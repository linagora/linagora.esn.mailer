'use strict';

var expect = require('chai').expect;

describe('The om-mailer awesome module', function() {

  it('should provide a start state', function() {
    var module = require('../../lib/index');
    expect(module).to.exist;
  });
});

