//*
define(["tinyrequire"], function() {
  'use strict';

  console.log("loading modules");

  tinyrequire.require(['polyfill'], function(app) {
    tinyrequire.require(['app'], function(app) {
      console.log("Loaded app!", Object.keys(tinyrequire.queued));

      tinyrequire.sort();
      tinyrequire.exec();
    });
  });
});
//*/

/*
define(["polyfill"], function() {
  require(["parseutil", "vectormath", "app"], function() {

    //circular dependency debugger
    var rmods = requirejs.s.contexts._;
    var mods = {};

    for (var k in rmods.defined) {
      mods[k] = {
        deps : []
      };
    }

    for (var k in rmods.defined) {
      var mod = rmods[k];

    }
    for (var k in mods.defined) {
      if (mods[k] === undefined) {
        throw new Error("module " + k + " failed to load");
      }
    }
  });
});//*/