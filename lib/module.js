'use strict';

var nodemailer = require('nodemailer');
var emailTemplates = require('email-templates');
var path = require('path');
var fs = require('fs');
var templatesDir = path.resolve(__dirname + '/templates');
var transport;

/**
 *
 * @param {hash} dependencies
 * @param {hash} options
 * @return {*}
 */
module.exports = function(dependencies, options) {

  var config = dependencies('esn-config');
  var logger = dependencies('logger');

  options = options || {};
  var lib = {};

  /**
   * Set the nodemailer transport
   *
   * @param {transport} t
   */
  lib.setTransport = function(t) {
    transport = t;
  };

  /**
   * Set the templates directory
   *
   * @param {string} t
   */
  lib.setTemplatesDir = function(t) {
    templatesDir = t;
  };

  /**
   * Get the mail configuration
   *
   * @param {function} done
   * @return {*}
   */
  var mailconfig = function(done) {
    config('mail').get(function(err, data) {
      return done(err, data || options);
    });
  };
  lib.mailconfig = mailconfig;

  /**
   * Initialize the mail transport on first call else get it from cache
   *
   * @param {function} done
   * @return {*}
   */
  var getMailTransport = function(done) {
    if (transport) {
      return done(null, transport);
    }

    mailconfig(function(err, data) {
      if (err) {
        return done(err);
      }
      if (!data.transport) {
        return done(new Error('Mail transport is not configured'));
      }
      // require the nodemailer transport module if it is an external plugin
      if (data.transport.module) {
        try {
          var nodemailerPlugin = require(data.transport.module);
          transport = nodemailer.createTransport(nodemailerPlugin(data.transport.config));
        } catch (err) {
          return done(err);
        }
      } else {
        transport = nodemailer.createTransport(data.transport.config);
      }
      return done(null, transport);
    });
  };

  /**
   * Check if template has attachments.
   *
   * @param {string} template       The name of the template to check for.
   * @return {boolean}              True, if the template has attachments.
   */
  var hasAttachments = function(template) {
    try {
      return fs.statSync(path.join(templatesDir, template, 'attachments')).isDirectory();
    } catch (e) {
      return false;
    }
  };

  /**
   * Get the template attachments as an array suitable for nodemailer.
   *
   * @param {string} template       The name of the template to check for.
   * @return {array}                The array with attachment metadata.
   */
  var attachments = function(template) {
    var basepath = path.join(templatesDir, template, 'attachments');
    var files = fs.readdirSync(basepath);
    return files.map(function(p) {
      var basename = path.basename(p);
      return {
        filename: basename,
        path: path.join(basepath, p),
        cid: path.basename(p, path.extname(p)),
        contentDisposition: 'inline'
      };
    });
  };

  /**
   * Send an HTML email rendered from a template
   *
   * @param {object} message      - message object forward to nodemailer
   * @param {string} templateName - template name forward to email-templates
   * @param {object} locals       - locals object forward to email-templates
   * @param {function} done       - callback function like fn(err, response)
   * @return {*}
   */
  lib.sendHTML = function(message, templateName, locals, done) {
    if (!message.to) {
      return done(new Error('Message.to can not be null'));
    }

    getMailTransport(function(err, transport) {
      if (err) {
        return done(err);
      }

      emailTemplates(templatesDir, function(err, template) {
        if (err) {
          return done(err);
        }

        locals.juiceOptions = { removeStyleTags: false };
        locals.pretty = true;

        template(templateName, locals, function(err, html, text) {
          if (err) {
            return done(err);
          }

          mailconfig(function(err, data) {
            if (err) {
              return done(err);
            }
            message.from = message.from || data.from;
            message.html = html;
            message.text = text;

            if (hasAttachments(templateName)) {
              if (Array.isArray(message.attachments)) {
                message.attachments = message.attachments.concat(attachments(templateName));
              } else {
                message.attachments = attachments(templateName);
              }
            }
            transport.sendMail(message, function(err, response) {
              if (err) {
                logger.warn('Error while sending email %s', err.message);
                return done(err);
              }
              logger.debug('Email has been sent to %s from %s', message.to, message.from);
              done(null, response);
            });
          });
        });
      });
    });
  };

  /**
   * Send raw email to recipient
   *
   * @param {object} message - message object forward to nodemailer
   * @param {function} done  - callback function like fn(err, response)
   * @return {*}
   */
  lib.send = function(message, done) {
    if (!message.to) {
      return done(new Error('Message.to can not be null'));
    }
    if (!message.text) {
      return done(new Error('Message.text can not be null'));
    }

    getMailTransport(function(err, transport) {
      if (err) {
        return done(err);
      }

      mailconfig(function(err, data) {
        if (err) {
          return done(err);
        }

        message.from = message.from || data.from;
        transport.sendMail(message, function(err, response) {
          if (err) {
            logger.warn('Error while sending email %s', err.message);
            return done(err);
          }
          logger.debug('Email has been sent to %s from %s', message.to, message.from);
          done(null, response);
        });
      });
    });
  };

  return lib;
};
