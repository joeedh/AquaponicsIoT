var _toolsystem = undefined;

define([
  "util", "controller"
], function(util, controller) {
  'use strict';

  var exports = _toolsystem = {};

  var ToolFlags = exports.ToolFlags = {
  };

  var UndoFlags = exports.UndoFlags = {
    NO_UNDO : 1
  };

  /*
   static tooldef() {return {
   uiname   : "Tool",
   is_modal : false,
   inputs   : {}
   outputs  : {}
   flag     : 0
   undoflag : 0
   icon     :
   }}
   */

  var ToolProperty = exports.ToolProperty = class ToolProperty {
    constructor(name, uiname, description, category) {
      this.category = category;
      this.name = name === undefined ? "unnamed" : name;
      this.uiname = uiname === undefined ? this.name : uiname;
      this.description = description === undefined ? "" : description;
      this.flag = this.undoflag = 0;
      this.icon = -1;
      this.listeners = [];
      this.numrange = [0, 10000];
      this.stepsize = 0.01;
    }

    static _getToolProps(obj) {
      if (obj._toolprops === undefined) {
        obj._toolprops = {};
      }

      return obj._toolprops;
    }

    range(min, max) {
      this.numrange = [min, max];
      return this;
    }

    step(stepsize) {
      this.stepsize = stepsize;
    }

    //creates integer properties for obj,
    //stores it in obj._toolprops, which it creates itself
    static makeInt(obj, name, defaultval, uiname, description, category) {
      obj[name] = defaultval;
      ToolProperty._getToolProps(obj)[name] = new IntProperty(name, uiname, description, category);

      return ToolProperty._getToolProps(obj)[name];
    }

    //creates float properties for obj,
    //stores it in obj._toolprops, which it creates itself
    static makeFloat(obj, name, defaultval, uiname, description, category) {
      obj[name] = defaultval;
      ToolProperty._getToolProps(obj)[name] = new FloatProperty(name, uiname, description, category);

      return ToolProperty._getToolProps(obj)[name];
    }

    //creates float properties for obj,
    //stores it in obj._toolprops, which it creates itself
    static makeBool(obj, name, defaultval, uiname, description, category) {
      obj[name] = defaultval;
      ToolProperty._getToolProps(obj)[name] = new BoolProperty(name, uiname, description, category);

      return ToolProperty._getToolProps(obj)[name];
    }

    //creates float properties for obj,
    //stores it in obj._toolprops, which it creates itself
    static makeString(obj, name, defaultval, uiname, description, category) {
      obj[name] = defaultval;
      ToolProperty._getToolProps(obj)[name] = new StringProperty(name, uiname, description, category);

      return ToolProperty._getToolProps(obj)[name];
    }

    addListener(cb, thisvar) {
      this.listeners.push([cb, thisvar]);
    }

    removeListener(cb, thisvar) {
      for (var i=0; i<this.listeners.length; i++) {
        if (this.listeners[i][0] === cb && this.listeners[i][1] === thisvar) {
          this.listeners.pop_i(i);
          return;
        }
      }

      console.log("failed to remove listener", cb, thisvar);
    }

    update(old_data, data) {
      for (var l of this.listeners) {
        if (l[1] !== undefined) {
          l[0].call(l[1], this, old_data, data);
        } else {
          l[0](old_data, data);
        }
      }
    }

    get data() {
      return this._data;
    }

    set data(val) {
      var old = this._data;
      this._data = val;

      this.update(old, val);
    }

    copyTo(dst) {
      dst.flag = this.flag;
      dst.undoflag = this.undoflag;
      dst.icon = this.icon;
      dst.description = this.description;
    }

    copy() {
      var ret = new this.constructor(this.data);
      this.copyTo(ret);

      return ret;
      //throw new Error("implement me!");
    }
  }

  class IntProperty extends ToolProperty {};
  class FloatProperty extends ToolProperty {};
  class StringProperty extends ToolProperty {};
  class BoolProperty extends ToolProperty {};

  class EnumProperty extends ToolProperty {
    constructor(data, map, uimap) {
      //array? then put into {ENUM1 : 0, ENUM2, 1} form
      if (map instanceof Array) {
        var map2 = {}
        var uimap2 = {};

        for (var i=0; i<map.length; i++) {
          map2[map[i]] = i;
          if (uimap !== undefined)
            uimap2[uimap[i]] = i;
        }

        map = map2;
        uimap = uimap !== undefined ? uimap2 : undefined;
      }

      this.keys = map;
      this.vals = {};
      this.uivals = {};

      for (var k in map) {
        var ui;

        this.vals[map[k]] = k;
      }

      if (uimap === undefined) {
        uimap = {};

        for (var k in map) {
          var i = map[k];

          k = k[0].toUpperCase() + k.toLowerCase().slice(1, k.length);
          k = k.replace(/_/g, " ");

          uimap[k] = i;
        }
      }

      for (var k in uimap) {
        this.uivals[uimap[k]] = this.vals[k];
      }
    }

    set data(val) {
      if (val === undefined) { //ignore assignments to undefined
        return;
      }

      if (typeof val == "string" || val instanceof String) {
        val = this.keys[val];
      }

      if (val === undefined) { //bad string
        throw new Error("bad enum value", arguments[0], "should be one of: ", this.keys);
      }

      super._data = val;
    }
  }

  class FlagProperty extends EnumProperty {
    //almost identiy to one in EnumProperty, except it skips
    //a check
    set data(val) {
      if (val === undefined) { //ignore assignments to undefined
        return;
      }

      if (typeof val == "string" || val instanceof String) {
        val = this.keys[val];
      }

      super._data = val;
    }
  }

  exports.ToolProperty = ToolProperty;
  exports.IntProperty = IntProperty;
  exports.FloatProperty = FloatProperty;
  exports.StringProperty = StringProperty;
  exports.BoolProperty = BoolProperty;
  exports.EnumProperty = EnumProperty;
  exports.FlagProperty = FlagProperty;

  var ToolOp = exports.ToolOp = class ToolOp {
    constructor() {
      var def = this.constructor.toolDef();

      this.uiname = def.uiname;
      this.is_modal = def.is_modal;
      this.inputs = {};
      this.outputs = {};
      this.undoflag = def.undoflag;
      this.flag = def.flag;
      this.icon = def.icon;

      for (var k in def.inputs) {
        this.inputs[k] = def.inputs[k].copy();
      }

      for (var k in def.outputs) {
        this.outputs[k] = def.outputs[k].copy();
      }
    }

    static toolDef() {return {
      uiname   : "(unnamed tool)",
      is_modal : false,
      inputs   : {},
      outputs  : {},
      undoflag : 0,
      flag     : 0,
      icon     : -1
    }}

    undoPre(ctx) {
      this._undo = ctx.undo_save();
    }

    undo(ctx){
      ctx.undo_restore(this._undo);
    }

    //don't access ui state here
    exec(ctx) {
    }

    //can we run in this ctx?
    canRun(ctx) {
      return true;
    }

    //for modal tools
    modalPre(ctx) {
    }

    startModal(ctx) {
      var events = [
        "mousedown", "mouseup", "mousemove",
        "keydown"
      ];

      this._modals = {};

      var this2 = this;
      function make_func(e) {
        var key = "on_" + e;

        return function(event) {
          return this2[key](event);
        }
      }

      for (var e of events) {
        var func = make_func(e);

        window.addEventListener(e, func);
        this._modals[e] = func;
      }
    }

    endModal(ctx) {
      if (this._modals === undefined) {
        console.log("warning, bad call to end_modal()");
        return;
      }

      for (var k in this._modals) {
        window.removeEventListener(k, this._modals[k]);
      }

      delete this._modals;
      this.is_modal = false;
    }

    draw(g) {
    }

    on_tick(e) {
    }

    on_mousedown(e) {
    }

    on_mousemove(e) {
    }

    on_mouseup(e) {
    }

    on_keydown(e) {
    }
  }

  var ToolStack = exports.ToolStack = class ToolStack {
    constructor(appstate, ctx) {
      this.undostack = [];
      this.undocur = -1;
      this.ctx = ctx
      this.appstate = appstate
    }

    exec_tool(tool, ctx) {
      ctx = ctx === undefined ? this.ctx : ctx;

      //push undo stack
      this.undostack.push(tool);
      this.undocur++;

      //calc tool undo data
      tool.undoPre(ctx);

      //run tool
      if (tool.is_modal) {
        tool.start_modal(ctx);
      } else {
        tool.exec(ctx);
      }

      ctx.cad.remake_canvas();
      window.redraw_all();
    }

    undo() {
      if (this.undocur >= 0) {
        this.undostack[this.undocur].undo(this.ctx)
        this.undocur--;
      } else {
        console.log("no more items to undo");
      }
    }

    redo() {
      if (this.undocur < this.undostack.length-1) {
        this.undocur++;

        //re-execute tool
        this.undostack[this.undocur].exec(this.ctx);
      } else {
        console.log("no more items left to redo");
      }
    }
  }

  return exports;
});
