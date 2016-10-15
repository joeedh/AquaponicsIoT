var _screen = undefined;

define([
  "util", "vectormath", "math", "simplemesh", "webgl", "printer"
], function(util, vectormath, math, simplemesh, webgl, printer) {
  'use strict';

  var exports = _screen = {};

  //var patch_canvas2d = canvas_patch.patch_canvas2d;
  var Vector2 = vectormath.Vector2, Vector3 = vectormath.Vector3;
  var Vector4 = vectormath.Vector4, Matrix4 = vectormath.Matrix4;

  var sin=Math.sin, cos=Math.cos, abs=Math.abs, log=Math.log,
    asin=Math.asin, exp=Math.exp, acos=Math.acos, fract=Math.fract,
    sign=Math.sign, tent=Math.tent, atan2=Math.atan2, atan=Math.atan,
    pow=Math.pow, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil,
    min=Math.min, max=Math.max, PI=Math.PI, E=2.718281828459045;

  var unproject_p = new Vector3();

  var proj_cache_vs = util.cachering.fromConstructor(Vector4, 512);
  var unproj_cache_vs = util.cachering.fromConstructor(Vector4, 512);

  var ScreenBase = exports.ScreenBase = class ScreenBase {
    constructor(canvas, window_id) {
      this.winid = window_id;
      this.canvas = canvas;
      this.drawstack = [];
      this.customDraw = undefined;

      var this2 = this;
      this._dodraw = function() {
        this2.animreq = undefined;
        this2.draw();
      };

      this.animreq = undefined;

      this.size = new Vector2();
      this.aspect = 1.0;

      this.camera = new webgl.Camera();
      this.camstack = [];
      this._postdraws = [];
    }

    postdraw(cb, thisvar) {
      this._postdraws.push([cb, thisvar]);
    }

    pushCamera() {
      this.camstack.push(this.camera.copy());
    }

    popCamera() {
      this.camera = this.camstack.pop();
    }

    pushDraw(draw) {
      if (this.customDraw !== undefined) {
        this.drawstack.push(this.customDraw);
      }

      this.customDraw = draw;
    }

    reload_shaders() {
      var gl = this.gl;

      gl.simple_shader = webgl.ShaderProgram.load_shader("simpleshader");
      gl.hatch_shader = webgl.ShaderProgram.load_shader("hatchshader");

      gl.simple_shader.then(function() {
        console.log("shader loaded");
        window.redraw_all();
      });
    }

    popDraw() {
      if (this.drawstack.length > 0) {
        this.customDraw = this.drawstack.pop();
      } else {
        this.customDraw = undefined;
      }
    }

    screenoff() {
      this.canvas.style.visibility = "hidden";
    }

    screenon() {
      this.canvas.style.visibility = "visible";
    }

    normalize_screenco(p) {
      p[0] = (p[0]/this.size[0]-0.5)*2.0;
      p[1] = (p[1]/this.size[1]-0.5)*2.0;

      return p;
    }

    denormalize_screenco(p) {
      p[0] = (p[0]+1.0)*0.5*this.size[0];
      p[1] = (p[1]+1.0)*0.5*this.size[1];

      return p;
    }

    unproject(p, not_normalized) {
      var orig = p;

      p = unproj_cache_vs.next().load(p);

      if (p[2] == undefined)
        p[2] = 0.0;
      p[3] = 1.0;

      if (not_normalized)
        this.normalize_screenco(p);

      p.multVecMatrix(this.camera.irendermat);
      var w = p[3];
      p.mulScalar(1.0/w);

      orig[0] = p[0];
      orig[1] = p[1];
      if (orig.length > 2)
        orig[2] = p[2];
      if (orig.length > 3)
        orig[3] = w;

      return w;
    }

    project(p, not_normalized) {
      var orig = p;

      p = proj_cache_vs.next().load(p);

      if (p[2] == undefined)
        p[2] = 0.0;
      p[3] = 1.0;

      if (not_normalized)
        this.normalize_screenco(p);

      p.multVecMatrix(this.camera.rendermat);
      var w = p[3];
      p.mulScalar(1.0/w);

      orig[0] = p[0];
      orig[1] = p[1];
      if (orig.length > 2)
        orig[2] = p[2];
      if (orig.length > 3)
        orig[3] = w;

      return w;
    }

    //primary is 0, secondary is 1
    moveToScreen(primary_or_secondary, make_fullscreen, errorcb, successcb) {
      if (errorcb === undefined) {
        errorcb = function(msg) {
          console.warn("Error in moveToScreen:", msg);
        }
      }

      chrome.system.display.getInfo((function(displays) {
        if (displays.length == 1 && primary_or_secondary) {
          errorcb("No secondary display");
          return;
        } else if (displays.length > 2) {
          errorcb("Too many displays");
          return;
        }

        for (var i=0; i<displays.length; i++) {
          if (!displays[i].isPrimary == !!primary_or_secondary) {
            break;
          }
        }

        if (i == displays.length) {
          errorcb("Couldn't find display");
          return;
        }

        var display = displays[i], area = display.workArea;
        var win = chrome.app.window.get(this.winid);

        //ok.  if window is correct, it's *current* bounds
        //will be set to display.bounds, even though we set
        //them to .workArea below.  this is because we went
        //fullscreen.
        var ok = win.outerBounds.left == display.bounds.left;
        ok = ok && win.outerBounds.top == display.bounds.top;
        ok = ok && win.outerBounds.width == display.bounds.width;
        ok = ok && win.outerBounds.height == display.bounds.height;

        console.log("Work area:", display.workArea);

        if (!ok) {
          win.restore();

          win.outerBounds.left = area.left;
          win.outerBounds.top = area.top;
          win.outerBounds.width = area.width;
          win.outerBounds.height = area.height;

          if (make_fullscreen) {
            win.fullscreen();
          }
        } else if (make_fullscreen && !win.isFullscreen()) {
          win.fullscreen();
        }

        if (successcb !== undefined) {
          successcb();
        }
      }).bind(this));
    }

    draw() { //returns true if child draw should be blocked
      this.size[0] = this.canvas.width;
      this.size[1] = this.canvas.height;

      if (this.gl === undefined) {
        return false;
      }

      var aspect = this.aspect = this.canvas.width / this.canvas.height;
      this.camera.regen_mats(aspect);

      if (this.customDraw) {
        console.log("custom draw");

        this.customDraw(this.gl);
        return true;
      }

      return false;
    }

    firePostDraws() {
      var postdraws = this._postdraws;
      this._postdraws = [];

      for (var item of postdraws) {
        item[0].call(item[1], this.gl);
      }
    }

    redraw_all() {
      if (this.animreq !== undefined) {
        return;
      }

      this.animreq = requestAnimationFrame(this._dodraw);
    }
  };

  return exports;
});

