"use strict";

var config = require("./config");
var logger = require("./logger");

var SMSIF = exports.SMSIF = class SMSIF {
  sendSMS(number, message) {
    throw new Error("implement me, should return a promise");
  }
}


var TwilioSMS = exports.TwilioSMS = class TwilioSMS {
  constructor(cfg) {
    if (cfg === undefined) {
      cfg = config;
    }

    this.config = cfg;
    this.user = cfg.TwilioUser;
    this.pass = cfg.TwilioPassword;
    this.phone = cfg.TwilioNumber;
  }

  send(number, message) {
    logger.debug("Sending SMS");

    var cfg = this.config;

    return new Promise((function(accept, reject) {
      // Twilio Credentials
      var accountSid = cfg.TwilioSID;
      var authToken = cfg.TwilioAuthToken;
        //require the Twilio module and create a REST client
      var client = require('twilio')(accountSid, authToken);
      client.messages.create({
        to: number,
        from: cfg.TwilioNumber,
        body: message,
      }, function (err, message) {
        if (err !== null && err !== undefined) {
          var msg = "Error sending SMS: " + err + ": " + message.sid;

          logger.error(msg);
          reject(msg);
        } else {
          accept();
        }
      });
    }).bind(this));
  }
};

exports.manager = new TwilioSMS(config);
