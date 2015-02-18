'use strict';

var expect = require('chai').expect;

describe('The om-mailer awesome module', function() {

  it('should provide a start state', function() {
    var module = require('../../lib/index');
    expect(module.settings.states.start).to.exist;
    expect(module.settings.states.start).to.be.a('function');
  });
});

