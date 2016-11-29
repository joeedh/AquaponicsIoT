"use strict";

var db = require('./db');
var logger = require('./logger');
var sms = require('./sms');
var config = require('./config');

var cmps = {
  '>' : function(a, b) { return a > b },
  '=' : function(a, b) { return a == b },
  '==' : function(a, b) { return a == b },
  '<' : function(a, b) { return a < b },
  '!=' : function(a, b) { return a != b },
};

exports.update = function(db, sensors) {
  var alarms = db.getAlarms();

  for (var k in alarms) {
    var alarm = alarms[k];

    if (!(alarm.cmp in cmps)) {
      logger.error("Alarm '" + alarm.name + "': Invalid comparison operator " + alarm.cmp + ".");
      continue;
    }

    var a = sensors[alarm.field];
    var b = alarm.trigger;
    var ok = !cmps[alarm.cmp](a, b);

    var msg;
    if (!ok && alarm.enabled) {
      logger.log("Alarm '" + alarm.name + "' triggered with value " + a + ", trigger was " + b + ".");
      msg = alarm.field + " alarm '" + alarm.name + "' triggered.  " + alarm.field + " is " + a + ".";
      alarm.enabled = false;
    } else if (ok && !alarm.enabled) {
      alarm.enabled = true;
      logger.log("Alarm '" + alarm.name + "' is no longer triggered. Value: " + a + "; trigger: " + b + ".");
      msg = alarm.field + " alarm '" + alarm.name + "' is no longer triggered; value: " + a + ".";
    } else {
      continue;
    }

    if (alarm.message) {
      msg += "\n " + alarm.message;
    }

    db.saveAlarm(alarm);
    db.save();

    if (alarm.phone) {
      sms.manager.send(alarm.phone, msg);
    }
  }
};
