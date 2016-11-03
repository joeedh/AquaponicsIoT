define(['framework/tinyrequire'], function() {
  "use strict";

  window.require = tinyrequire.require;

  tinyrequire.require(["framework/util", "client"], function(util, client) {
    tinyrequire.sort();
    tinyrequire.exec();
  });


  tinyrequire.sort();
  tinyrequire.exec();
})