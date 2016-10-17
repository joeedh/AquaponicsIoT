"use strict";

var fs = require('fs');

exports._log = function _log(type, msg) {
  var path = "log_" + type + ".txt";

  var line = (""+new Date()) + ": " + msg + "\n";
  fs.appendFileSync(path, line);

  console.log(line);
};

exports.log = function log(msg) {
  exports._log('log', msg);
};

exports.warn = function warn(msg) {
  exports._log('warn', msg);
};

exports.error = function error(msg) {
  exports._log('error', msg);
};

exports.access = function access(msg) {
  exports._log('access', msg);
};

//TODO: in the future, should write to a circular file that's limited in sizes.
exports.debug = function debug(msg) {
  exports._log('debug', msg);
}