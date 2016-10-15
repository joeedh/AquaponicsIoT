var _console = undefined;

define([
  "util"
], function(util) {
  'use strict';

  var exports = _console = {};

  var Console = exports.Console = class Console {
    constructor(dom_id, pos, size, bufsize) {
      this.dom_id = dom_id;
      this.dom = undefined;
      this.pos = pos !== undefined ? pos : [50, 50];
      this.size = size !== undefined ? size : [450, 150];

      this.create();

      bufsize = bufsize === undefined ? ~~(size[1]/20) : bufsize;

      this.buffer = new Array(bufsize);
      this.buffer.cur = 0;
    }

    create() {
      var dom = this.dom = document.createElement("div");

      dom.style.position = "absolute";
      dom.style["z-index"] = 100;
      dom.style.color = "white"
      dom.style.overflow = "hidden";
      dom.style["pointer-events"] = "none";
      document.body.appendChild(dom);
    }

    syncpos() {
      this.dom.style.left = this.pos[0] + "px";
      this.dom.style.top = this.pos[1] + "px";
      this.dom.style.width = this.size[0] + "px";
      this.dom.style.height = this.size[1] + "px";
    }

    _logargs() {
      var buf = "";

      for (var i=0; i<arguments.length; i++) {
        if (i > 0)
          buf += " ";
        buf += arguments[i];
      }

      this._log(buf);
    }

    _log(msg) {
      this.buffer[this.buffer.cur] = msg;
      this.buffer.cur = (this.buffer.cur + 1) % this.buffer.length;

      this.syncpos();
      this.domwrite();
    }

    log() {
      this._logargs.apply(this, arguments);
      console.log.apply(console, arguments);
    }

    trace() {
      this._logargs.apply(this, arguments);
      console.trace.apply(console, arguments);
    }

    warn() {
      this._logargs.apply(this, arguments);
      console.warn.apply(console, arguments);
    }

    domwrite() {
      var buf = "";

      for (var i=0; i<this.buffer.length; i++) {
        var line = this.buffer[(i + this.buffer.cur) % this.buffer.length];

        if (line === undefined) {
          continue;
        }

        buf += line + "<br>\n";
      }

      this.dom.innerHTML = buf;
    }
  };

  return exports;
});
