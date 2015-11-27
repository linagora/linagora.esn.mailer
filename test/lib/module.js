'use strict';

var expect = require('chai').expect,
    fs = require('fs'),
    path = require('path');

var from = 'from@baz.org';

describe('The om-mailer module', function() {

  function getModule(dependencies, options) {
    return require('../../lib/module')(dependencies, options);
  }

  var modules = {};
  var deps = function(name) {
    return modules[name];
  };

  beforeEach(function() {
    var get = function(callback) {
      callback(null, {});
    };
    modules['esn-config'] = function() {return {get: get};};
    modules.logger = require('../fixtures/logger-noop')();
  });

  describe('The send fn', function() {
    it('should fail if message.to is not defined', function(done) {
      var email = getModule(deps, {});
      email.transport = function() {
      };
      var message = {
        from: from,
        to: null,
        subject: 'The subject',
        text: 'Hello'
      };
      email.send(message, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail if message.text and message.html are not defined', function(done) {
      var email = getModule(deps, {});
      email.transport = function() {
      };
      var message = {
        from: from,
        to: 'foo@bar.com',
        subject: 'The subject',
        text: null,
        html: null
      };
      email.send(message, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call the transport layer when all data is valid and message.text is defined', function(done) {
      var email = getModule(deps, {});
      var called = false;
      email.setTransport({
        sendMail: function(message, cb) {
          called = true;
          return cb();
        }
      });
      var message = {
        from: from,
        to: 'foo@bar.com',
        subject: 'The subject',
        text: 'Hello'
      };
      email.send(message, function(err) {
        expect(err).to.not.exist;
        expect(called).to.be.true;
        done();
      });
    });

    it('should call the transport layer when all data is valid and message.html is defined', function(done) {
      var email = getModule(deps, {});
      var called = false;
      email.setTransport({
        sendMail: function(message, cb) {
          called = true;
          return cb();
        }
      });
      var message = {
        from: from,
        to: 'foo@bar.com',
        subject: 'The subject',
        html: '<b>Hello</b>'
      };
      email.send(message, function(err) {
        expect(err).to.not.exist;
        expect(called).to.be.true;
        done();
      });
    });

    it('should call the transport layer when all data is valid', function(done) {
      var email = getModule(deps, {});
      var called = false;
      email.setTransport({
        sendMail: function(message, cb) {
          called = true;
          return cb();
        }
      });
      var message = {
        from: from,
        to: 'foo@bar.com',
        subject: 'The subject',
        text: 'Hello',
        html: '<b>Hello</b>'
      };
      email.send(message, function(err) {
        expect(err).to.not.exist;
        expect(called).to.be.true;
        done();
      });
    });

    it('should send email with sendmail mock (pickup)', function(done) {
      var self = this;

      var email = getModule(deps, {});
      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));
      email.setTransport(transport);

      var message = {
        from: from,
        to: 'foo@bar.com',
        subject: 'The subject',
        text: 'Hello from node'
      };
      email.send(message, function(err, response) {
        expect(err).to.not.exist;
        expect(fs.existsSync(response.path)).to.be.true;

        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.text).to.have.string(message.text);
          done();
        });
        fs.createReadStream(response.path).pipe(mailparser);
      });
    });

    it('should send email with from as name <address>', function(done) {
      var self = this;

      var email = getModule(deps, {});

      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));
      email.setTransport(transport);
      var name = 'Foo Bar';
      var address = 'foo@baz.org';
      var source = name + '<' + address + '>';

      var message = {
        from: source,
        to: 'foo@bar.com',
        subject: 'The subject',
        text: 'Hello from node'
      };
      email.send(message, function(err, response) {
        expect(err).to.not.exist;
        expect(fs.existsSync(response.path)).to.be.true;

        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.text).to.have.string(message.text);
          expect(mail_object.from[0].name).to.equal(name);
          expect(mail_object.from[0].address).to.equal(address);
          done();
        });
        fs.createReadStream(response.path).pipe(mailparser);
      });
    });

    it('should send email with to as name <address>', function(done) {
      var self = this;

      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));

      var email = getModule(deps, {});

      email.setTransport(transport);
      var name = 'Foo Bar';
      var address = 'foo@baz.org';
      var to = name + '<' + address + '>';

      var message = {
        from: from,
        to: to,
        subject: 'The subject',
        text: 'Hello from node'
      };
      email.send(message, function(err, response) {
        expect(err).to.not.exist;
        expect(fs.existsSync(response.path)).to.be.true;

        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.text).to.have.string(message.text);
          expect(mail_object.to[0].name).to.equal(name);
          expect(mail_object.to[0].address).to.equal(address);
          done();
        });
        fs.createReadStream(response.path).pipe(mailparser);
      });
    });

    describe('With unconfigured module', function() {
      var deps;
      beforeEach(function() {

        var modules = {};
        deps = function(name) {
          return modules[name];
        };

        var get = function(callback) {
          callback(null, {});
        };
        modules['esn-config'] = function() {return {get: get};};
        modules.logger = require('../fixtures/logger-noop')();
      });

      it('should fail when transport is not defined', function(done) {
        var email = getModule(deps, {});
        var message = {
          from: from,
          to: 'to@foo.com',
          subject: 'None',
          text: 'Hello'
        };
        email.send(message, function(err, message) {
          expect(err).to.exist;
          done();
        });
      });
    });

    describe('with unknown external mail transport', function() {
      var deps;
      beforeEach(function() {
        var modules = {};
        deps = function(name) {
          return modules[name];
        };

        var mail = {
          transport: {
            module: 'nodemailer-unknownmodule',
            type: 'bar',
            config: {
            }
          }
        };
        var get = function(callback) {
          callback(null, mail);
        };
        modules['esn-config'] = function() {return {get: get};};
        modules.logger = require('../fixtures/logger-noop')();
      });

      it('should fail on send', function(done) {

        var email = getModule(deps, {});
        var templates = path.resolve(__dirname + '/../fixtures/templates/');
        email.setTemplatesDir(templates);
        var message = {
          from: from,
          to: 'to@foo.com',
          subject: 'None',
          text: 'Hello'
        };
        email.send(message, function(err, message) {
          expect(err).to.exist;
          done();
        });
      });
    });
  });

  describe('The sendHTML fn', function() {
    it('should fail when message.to is undefined', function(done) {
      var email = getModule(deps, {});

      var type = 'foobar';
      var message = {
        from: from,
        to: null,
        subject: 'The subject'
      };
      email.sendHTML(message, type, {}, function(err, message) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail when template does not exist', function(done) {
      var self = this;

      var email = getModule(deps, {});

      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));
      var templates = path.resolve(__dirname + '/../fixtures/templates/');

      email.setTransport(transport);
      email.setTemplatesDir(templates);

      var type = 'foobar';
      var message = {
        from: from,
        to: 'to@foo.com',
        subject: 'The subject'
      };
      email.sendHTML(message, type, {}, function(err, message) {
        expect(err).to.exist;
        done();
      });
    });

    it('should generate and send a prettified HTML', function(done) {
      var self = this;
      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));
      var templates = path.resolve(__dirname + '/../fixtures/templates/');
      var email = getModule(deps, {});

      email.setTransport(transport);
      email.setTemplatesDir(templates);

      var type = 'confirm_url';
      var locals = {
        link: 'http://localhost:8080/confirm/123456789',
        name: {
          first: 'foo',
          last: 'bar'
        }
      };

      var message = {
        from: from,
        to: 'to@foo.com',
        subject: 'The subject'
      };
      email.sendHTML(message, type, locals, function(err, message) {
        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(locals.pretty).to.be.true;
          done();
        });
        fs.createReadStream(message.path).pipe(mailparser);
      });
    });

    it('should generate and send HTML email from existing template', function(done) {
      var self = this;

      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));
      var templates = path.resolve(__dirname + '/../fixtures/templates/');

      var email = getModule(deps, {});

      email.setTransport(transport);
      email.setTemplatesDir(templates);

      var type = 'confirm_url';
      var locals = {
        link: 'http://localhost:8080/confirm/123456789',
        name: {
          first: 'foo',
          last: 'bar'
        }
      };

      var message = {
        from: from,
        to: 'to@foo.com',
        subject: 'The subject'
      };
      email.sendHTML(message, type, locals, function(err, message) {
        expect(err).to.not.exist;
        expect(fs.existsSync(message.path)).to.be.true;
        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.html).to.have.string(locals.link);
          expect(mail_object.html).to.have.string(locals.name.first);
          expect(mail_object.html).to.have.string(locals.name.last);
          done();
        });
        fs.createReadStream(message.path).pipe(mailparser);
      });
    });

    it('should generate and send HTML email from existing template with attachments in attachments folder', function(done) {
      var self = this;

      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));
      var templates = path.resolve(__dirname + '/../fixtures/templates/');

      var email = getModule(deps, {});

      email.setTransport(transport);
      email.setTemplatesDir(templates);

      var type = 'template_with_attachment';

      var message = {
        from: from,
        to: 'to@foo.com',
        subject: 'The subject'
      };
      email.sendHTML(message, type, {}, function(err, message) {
        expect(err).to.not.exist;
        expect(fs.existsSync(message.path)).to.be.true;
        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.attachments).to.have.length(1);
          var attachment = mail_object.attachments[0];
          expect(attachment.contentType).to.equal('image/png');
          expect(attachment.fileName).to.equal('logo.png');
          expect(attachment.contentDisposition).to.equal('inline');
          expect(attachment.transferEncoding).to.equal('base64');
          done();
        });
        fs.createReadStream(message.path).pipe(mailparser);
      });
    });

    it('should generate and send HTML email from existing template with attachments given with content field', function(done) {
      var self = this;

      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));
      var templates = path.resolve(__dirname + '/../fixtures/templates/');
      var attachmentContent = fs.readFileSync(path.resolve(__dirname + '/../fixtures/logo.png'));

      var email = getModule(deps, {});

      email.setTransport(transport);
      email.setTemplatesDir(templates);

      var type = 'template_simple';

      var message = {
        from: from,
        to: 'to@foo.com',
        subject: 'The subject',
        attachments: [{
          filename: 'logo.png',
          content: attachmentContent
        }]
      };
      email.sendHTML(message, type, {}, function(err, message) {
        expect(err).to.not.exist;
        expect(fs.existsSync(message.path)).to.be.true;
        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.attachments).to.have.length(1);
          var attachment = mail_object.attachments[0];
          expect(attachment.contentType).to.equal('image/png');
          expect(attachment.fileName).to.equal('logo.png');
          expect(attachment.contentDisposition).to.equal('attachment');
          expect(attachment.transferEncoding).to.equal('base64');
          done();
        });
        fs.createReadStream(message.path).pipe(mailparser);
      });
    });

    it('should generate and send HTML email from existing template with attachments by ' +
      'concating attachments from attachments folder and given attachments parameter', function(done) {
      var self = this;

      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));
      var templates = path.resolve(__dirname + '/../fixtures/templates/');
      var attachmentContent = fs.readFileSync(path.resolve(__dirname + '/../fixtures/logo.png'));

      var email = getModule(deps, {});

      email.setTransport(transport);
      email.setTemplatesDir(templates);

      var type = 'template_with_attachment';

      var message = {
        from: from,
        to: 'to@foo.com',
        subject: 'The subject',
        attachments: [{
          filename: 'logo2.png',
          contents: attachmentContent
        }]
      };
      email.sendHTML(message, type, {}, function(err, message) {
        expect(err).to.not.exist;
        expect(fs.existsSync(message.path)).to.be.true;
        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.attachments).to.have.length(2);
          var attachment1 = mail_object.attachments[0];
          expect(attachment1.contentType).to.equal('image/png');
          expect(attachment1.fileName).to.equal('logo.png');
          expect(attachment1.contentDisposition).to.equal('inline');
          expect(attachment1.transferEncoding).to.equal('base64');
          var attachment2 = mail_object.attachments[1];
          expect(attachment2.contentType).to.equal('image/png');
          expect(attachment2.fileName).to.equal('logo2.png');
          expect(attachment2.contentDisposition).to.equal('attachment');
          done();
        });
        fs.createReadStream(message.path).pipe(mailparser);
      });
    });

    it('should generate and send HTML email from existing template with attachments by ' +
      'ignoring map-marker attachment from attachments folder when location is not defined', function(done) {
      var self = this;

      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));
      var templates = path.resolve(__dirname + '/../fixtures/templates/');

      var email = getModule(deps, {});

      email.setTransport(transport);
      email.setTemplatesDir(templates);

      var type = 'template_with_attachment';

      var message = {
        from: from,
        to: 'to@foo.com',
        subject: 'The subject'
      };

      var locals = {
        filter: function(filename) {
          switch (filename) {
            case 'logo.png':
              return false;
            default:
              return true;
          }
        }
      };
      email.sendHTML(message, type, locals, function(err, message) {
        expect(err).to.not.exist;
        expect(fs.existsSync(message.path)).to.be.true;
        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.attachments).to.be.undefined;
          done();
        });
        fs.createReadStream(message.path).pipe(mailparser);
      });
    });

    it('should generate and send HTML email from existing template with attachments by ' +
      'concating all attachments from attachments folder when filter is not defined', function(done) {
      var self = this;

      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));
      var templates = path.resolve(__dirname + '/../fixtures/templates/');

      var email = getModule(deps, {});

      email.setTransport(transport);
      email.setTemplatesDir(templates);

      var type = 'template_with_attachment';

      var message = {
        from: from,
        to: 'to@foo.com',
        subject: 'The subject'
      };

      var locals = {
      };
      email.sendHTML(message, type, locals, function(err, message) {
        expect(err).to.not.exist;
        expect(fs.existsSync(message.path)).to.be.true;
        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.attachments).to.have.length(1);
          var attachment1 = mail_object.attachments[0];
          expect(attachment1.contentType).to.equal('image/png');
          expect(attachment1.fileName).to.equal('logo.png');
          expect(attachment1.contentDisposition).to.equal('inline');
          expect(attachment1.transferEncoding).to.equal('base64');
          done();
        });
        fs.createReadStream(message.path).pipe(mailparser);
      });
    });

    it('should generate and send HTML email from existing template with attachments by ' +
      'concating map-marker attachment from attachments folder when location is defined', function(done) {
      var self = this;

      var nodemailer = require('nodemailer');
      var transport = nodemailer.createTransport(require('nodemailer-pickup-transport')({directory: self.testEnv.tmp}));
      var templates = path.resolve(__dirname + '/../fixtures/templates/');

      var email = getModule(deps, {});

      email.setTransport(transport);
      email.setTemplatesDir(templates);

      var type = 'template_with_attachment';

      var message = {
        from: from,
        to: 'to@foo.com',
        subject: 'The subject'
      };

      var locals = {
        filter: function(filename) {
          switch (filename) {
            case 'logo.png':
              return true;
            default:
              return true;
          }
        }
      };
      email.sendHTML(message, type, locals, function(err, message) {
        expect(err).to.not.exist;
        expect(fs.existsSync(message.path)).to.be.true;
        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.attachments).to.have.length(1);
          var attachment1 = mail_object.attachments[0];
          expect(attachment1.contentType).to.equal('image/png');
          expect(attachment1.fileName).to.equal('logo.png');
          expect(attachment1.contentDisposition).to.equal('inline');
          expect(attachment1.transferEncoding).to.equal('base64');
          done();
        });
        fs.createReadStream(message.path).pipe(mailparser);
      });
    });

    describe('with configured ESN', function() {
      var deps;
      beforeEach(function() {

        var modules = {};
        deps = function(name) {
          return modules[name];
        };

        var mail = {
          transport: {
            module: 'nodemailer-pickup-transport',
            config: {
              directory: this.testEnv.tmp
            }
          }
        };
        var get = function(callback) {
          callback(null, mail);
        };
        modules['esn-config'] = function() {return {get: get};};
        modules.logger = require('../fixtures/logger-noop')();
      });

      it('should send an email', function(done) {
        var email = getModule(deps, {});
        var templates = path.resolve(__dirname + '/../fixtures/templates/');
        email.setTemplatesDir(templates);

        var type = 'confirm_url';
        var locals = {
          link: 'http://localhost:8080/confirm/123456789',
          name: {
            first: 'foo',
            last: 'bar'
          }
        };

        var message = {
          from: from,
          to: 'to@foo.com',
          subject: 'The subject'
        };
        email.sendHTML(message, type, locals, function(err, message) {
          expect(err).to.not.exist;
          expect(fs.existsSync(message.path)).to.be.true;
          var MailParser = require('mailparser').MailParser;
          var mailparser = new MailParser();
          mailparser.on('end', function(mail_object) {
            expect(mail_object.html).to.have.string(locals.link);
            expect(mail_object.html).to.have.string(locals.name.first);
            expect(mail_object.html).to.have.string(locals.name.last);
            done();
          });
          fs.createReadStream(message.path).pipe(mailparser);
        });
      });
    });
  });
});
