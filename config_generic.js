//this file needs to work with both Node.js and require.js (browser)
function domodule(exports) {
  "use strict";

  exports.PORT = 1337;
  exports.VERSION =  0.001;

  exports.DOCROOT = "/node_app_slot/";
  exports.ALARMFILE = "./alarms.json";

  exports.TwilioUser = "<twillo email>";
  exports.TwilioPassword = "&IOT_AquaPonics1!";
  exports.TwilioNumber = "<twillo number>"; //phone number
  exports.TwilioSID = "<SID>";
  exports.TwilioSecret = "mysecret";
  exports.TwilioAuthToken = "<Auth Token>";
}

if (typeof exports !== undefined) {
  domodule(exports);
} else {
  define([], function() {
    "use strict";

    var exports = window._config = {};
    domodule(exports);

    return exports;
  })
}
