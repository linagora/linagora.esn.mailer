'use strict';

var expect = require('chai').expect,
  mockery = require('mockery');

describe('The om-mailer module', function() {

  it('should contains all needed properties.', function() {

    var deps = function(name) {
    };

    require('../../lib/module')(deps, function(err, server) {
      expect(server).to.exist;
      expect(server).to.be.an.Object;
      expect(server).to.have.property('pub');
      expect(server.pub).to.be.null;
      expect(server).to.have.property('started');
      expect(server.started).to.be.false;
      expect(server).to.have.property('start');
      expect(server.start).to.be.a.Function;
    });
  });

});
