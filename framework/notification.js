var _notification = undefined;
define([
  "util", "vectormath"
], function(util, vectormath) {
  'use strict';

  var exports = _notification = {};

  var Note = exports.Note = class Note {
    constructor() {
      this.dead = false;
      this.time = 0;
      this.alive = 0; //0 means forever
    }

    on_tick() {
    }

    on_remove() {

    }
  };

  var NoteManager = exports.NoteManager = class NoteManager {
    constructor() {
      this.notes = [];
    }
  };

  return exports;
});
