window.tinyrequire = {
  modules : {},
  queued : {},
  acceptqueue : {},
  loaded : {},
  read : {},

  load : function(name) {
    if (name in this.read) {
      console.trace(".load() called twice");
      return;
    }

    this.read[name] = 1;
    this.queued[name] = 1;

    var this2 = this;
    /*
    var name;

    var i = script.length-1;
    while (i >= 0 && script[i] != "/") {
      i--;
    }

    if (i >= 0 && script[i] == "/") {
      name = script.slice(i, script.length).trim();
    } else {
      name = script;
    }//*/

    var doaccept, doreject, promise = new Promise(function(accept, reject) {
      doaccept = accept, doreject = reject;
    });

    this.acceptqueue[name] = {
      accept : doaccept,
      reject : doreject
    };

    var defined = false;
    var depcb = undefined;

    window.define = function define(deps, callback) {
      window.define = undefined;

      defined = true;
      this2.define(name, deps, callback);

      if (deps.length == 0) {
        doaccept(name);
      } else {
        for (var dep of deps) {
          if (!(dep in this2.modules) && !(dep in this2.loaded) && !(dep in this2.queued)) {
            this2.queued[dep] = 1;
          }
        }
      }
    }

    //var timer = window.setInterval(function() {
    //  window.clearInterval(timer);

      var path = "/scripts/" + name + ".js"; //script;
      var node = document.createElement("script");

      delete node.async;
      node.src = path;

      function bind(name) {
        return function() {
          this2.loaded[name] = 1;
          delete this2.queued[name];

          if (!defined) {
            console.warn("Warning: " + name + ": did not call define()");
            doaccept(name);

            if (name in this2.acceptqueue) {
              delete this2.acceptqueue[name];
            }
          }

          var k = undefined;
          for (k in this2.queued) {
            break;
          }

          if (k !== undefined) {
            this2.load(k);
          }

          this2.update_acceptqueue();
        }
      }

      node.onload = bind(name);
      document.head.appendChild(node);
    //}, 50);

    return promise;
  },

  update_acceptqueue : function() {
    for (var k in this.acceptqueue) {
      var mod = this.modules[k];

      if (mod === undefined) {
        continue;
      }

      var ok = true;

      for (var dep of mod.deps) {
        if (!(dep in this.loaded)) {
          ok = false;
          break;
        }
      }

      if (ok) {
        var accept = this.acceptqueue[k];

        delete this.acceptqueue[k];
        accept.accept(k);
      }
    }
  },

  define : function(name, deps, callback) {
    this.modules[name] = {
      name : name,
      deps : deps,
      callback : callback,
      exports : undefined,
      executed : false
    };
  },

  sort : function() {
    console.log("Sorting modules. . .");

    var list = [];

    for (var k in this.modules) {
      this.modules[k].tag = 0;
    }

    var this2 = this;

    function recurse(mod) {
      for (var dep of mod.deps) {
        var pmod = this2.modules[dep];

        if (pmod === undefined) {
          console.warn("Warning: " + mod.name + ": " + "module " + dep + " does not exist");
          this2.load(dep);
          continue;
        } else if (!pmod.tag) {
          recurse(pmod);
        }
      }

      if (mod.tag) {
        console.log("module cycle!", mod);
        return;
      }

      mod.tag++;
      list.push(mod);
    }

    for (var k in this.modules) {
      var mod = this.modules[k];

      if (mod.tag)
        continue;

      recurse(mod);
    }

    var list2 = [];
    for (var mod of list) {
      list2.push(mod.name);
    }

    console.log(list2);

    this.sortlist = list;
  },

  exec : function() {
    for (var i=0; i<this.sortlist.length; i++) {
      var mod = this.sortlist[i];

      if (mod.executed) {
        continue;
      }

      var deps = [];

      for (var j=0; j<mod.deps.length; j++) {
        var dep = mod.deps[j];

        if (dep in this.modules) {
          deps.push(this.modules[dep].exports);
        } else {
          console.log("could not find", dep)
          deps.push(undefined);
        }
      }

      console.log("loading ", mod.name);

      mod.executed = true;
      mod.exports = mod.callback.apply(undefined, deps);
    }
  },

  require : function(deps, callback) {
    for (var dep of deps) {
      if (!(dep in this.queued) && !(dep in this.loaded)) {
        this.load(dep);
      }
    }

    var this2 = this;
    var timer = window.setInterval(function() {
      if (Object.keys(this2.queued).length == 0) {
        window.clearInterval(timer);

        for (var i=0; i<deps.length; i++) {
          deps[i] = deps[i] in this2.modules ? this2.modules[deps[i]] : undefined;
        }

        callback.apply(undefined, deps);
      }
    }, 15);
  }
};

