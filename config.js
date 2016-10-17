//this file needs to work with both Node.js and require.js (browser)
function domodule(exports) {
  "use strict";

  exports.TwilioUser = "joeedh@gmail.com";
  exports.TwilioPassword = "&IOT_AquaPonics1!";
  exports.TwilioNumber = "19165426093"; //phone number
  exports.TwilioSID = "AC64931f4dd2d1a18a4f33fbffe98f5479";
  exports.TwilioSecret = "mysecret";
  exports.TwilioAuthToken = "53191ecbcb85d46dc8385a75fc7a303c";
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
