'use strict';

var nodemailer = require('nodemailer');
var emailTemplates = require('email-templates');
var path = require('path');
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
          require(data.transport.module);
        } catch (err) {
          return done(err);
        }
      }
      transport = nodemailer.createTransport(data.transport.type, data.transport.config);
      return done(null, transport);
    });
  };

  /**
   * Check if template has attachments
   *
   * @param {string} template
   * @return {boolean}
   */
  var hasAttachments = function(template) {
    return false;
  };

  /**
   * Get the template attachments as array of {filename, filepath, cid}
   *
   * @param {string} template
   * @return {array}
   */
  var attachments = function(template) {
    return [];
  };

  /**
   * Send an HTML email rendered from a template
   *
   * @param {string} from - source
   * @param {string} to - recipient (as CSV if N recipients)
   * @param {string} subject
   * @param {string} type
   * @param {hash} locals
   * @param {function} done
   * @return {*}
   */
  lib.sendHTML = function(from, to, subject, type, locals, done) {
    if (!to) {
      return done(new Error('Recipient can not be null'));
    }

    getMailTransport(function(err, transport) {
      if (err) {
        return done(err);
      }

      emailTemplates(templatesDir, function(err, template) {
        if (err) {
          return done(err);
        }

        template(type, locals, function(err, html, text) {
          if (err) {
            return done(err);
          }

          mailconfig(function(err, data) {
            if (err) {
              return done(err);
            }
            var message = {
              from: from || data.from,
              to: to,
              subject: subject,
              html: html,
              text: text
            };

            if (hasAttachments(type)) {
              message.attachments = attachments(type);
              message.forceEmbeddedImages = true;
            }
            transport.sendMail(message, function(err, response) {
              if (err) {
                logger.warn('Error while sending email %s', err.message);
                return done(err);
              }
              logger.debug('Email has been sent to %s from %s', to, from);
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
   * @param {string} from - source
   * @param {string} to - recipient (as CSV if multiple recipients)
   * @param {string} subject - the mail subject
   * @param {string} text
   * @param {function} done
   * @return {*}
   */
  lib.send = function(from, to, subject, text, done) {
    if (!to) {
      return done(new Error('Recipient can not be null'));
    }
    if (!text) {
      return done(new Error('Email content can not be null'));
    }

    getMailTransport(function(err, transport) {
      if (err) {
        return done(err);
      }

      mailconfig(function(err, data) {
        if (err) {
          return done(err);
        }

        var message = {
          from: from || data.from,
          to: to,
          subject: subject,
          text: text
        };
        transport.sendMail(message, function(err, response) {
          if (err) {
            logger.warn('Error while sending email %s', err.message);
            return done(err);
          }
          logger.debug('Email has been sent to %s from %s', to, from);
          done(null, response);
        });
      });
    });
  };

  return lib;
};
