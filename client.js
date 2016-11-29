//global alias to module
//this is for debugging purposes only, do not reference this variable in code
var _client = undefined;
var name_val;

requirejs.config({
  waitSeconds : 45
});

define([
  "framework/util", "framework/controller"
], function(util, controller) {
    'use strict';

    console.log("started");

    var exports = _client = {};

    var GraphLayout = exports.GraphLayout = class GraphLayout {
      constructor() {
        this.size = [0, 0];
        this.graphs = [];
      }

      add(graph) {
        this.graphs.push(graph);
      }

      remove(graph) {
        this.graphs.remove(graph);
      }

      draw(canvas, g) {
        for (var graph of this.graphs) {
          graph.draw(g);
        }

        this.drawLegend(canvas, g);
//***          
        this.showvalues(canvas, g);  
//***          
      }

      drawLegend(canvas, g) {
        var x = 1.05;
        var y = 0.5;

        g.save();
        g.lineWidth *= 5.0;
        g.font="50px Ariel";

        for (var graph of this.graphs) {
          var w = 0.4, h = 0.05;              
            
          _appstate.drawText(g, graph.name, x, y, graph.color);

          y += 0.1;
        }

        g.restore();
      }

//*** mm
      showvalues(canvas, g) {
//        var x = 1.05;
//        var y = 0.5;
        var x = 1.2;
        var y = 0.5;

        g.save();
        g.lineWidth *= 5.0;
        g.font="50px Ariel";

        for (var graph of this.graphs) {
          var w = 0.4, h = 0.05;              
            
//          _appstate.drawText(g, 123, x, y, graph.color);
  //          var a = graph.data[0];
//          _appstate.drawText(g, a[1], x, y, graph.color);
          _appstate.drawText(g, graph.data[0], x, y, graph.color);

          y += 0.1;
        }

        g.restore();
      }
//***        
        
        
        
      update(appstate) {
        for (var graph of this.graphs) {
          graph.update(appstate);
        }
      }
    }

    var unit = exports.unit = function unit(name, xscale, yscale) {
        var ret = {};
        
        ret.scale = [xscale, yscale];
        ret.name = name;
        
        return ret;
    }
    
    var Units = {
        C_TIME : unit("C/s", 1.0/60, 1.0/100)
    };
    
    var Graph = exports.Graph = class Graph {
        constructor(name, unit, color) {
            this.unit = unit;
            this.color = color;
            this.name = name;
            this.data = [];
            this.off = [0, 0];
        }
        
        setData(data) {
            this.data = data;
            
            return this;
        }
        
        draw(g) {
            g.save();
            g.lineWidth *= 2;
            
            g.beginPath();
            g.rect(-1, -1, 2, 2);
            g.closePath();
            g.clip();
            
            g.strokeStyle = this.color;
            g.beginPath();
            
            var first = 1;
            
            var minx=1e17, maxx=-1e17;
            for (var data of this.data) {
                var x = data[0]*this.unit.scale[0];
                minx = Math.min(minx, x);
                maxx = Math.max(maxx, x);
            }
            
            if (maxx > 1.0) {
                this.off[0] = -maxx + 1.0;
            }
            
            for (var data of this.data) {
                
//**                
//                console.log("this is a test");            
                
                var x = this.off[0] + data[0]*this.unit.scale[0];
                var y = this.off[1] + data[1]*this.unit.scale[1];
                
                if (first) {
                    g.moveTo(x, y);
                    first = 0;
                } else {
                    g.lineTo(x, y);
                }
            }
            
            g.stroke();
            g.restore();
//****            
//            _appstate.drawText(g, data[0]*this.unit.scale[0], x, y, graph.color);           
        }

      update(appstate) {
        var graph = this;

        appstate.api.command("getFieldRecent", {field : this.name, count : 50}).then(
          function(res) {
            var data = [];
            var i = 0;

            for (var d of res){
              var x = i; //(res.time - start) / 1000;
              var y = d.value;

              data.push([x, y]);
              i++;
            }

            graph.setData(data);
            window.redraw_all();
          });
      }
    }
    
    exports.APIClient = class APIClient {
        constructor(ws) {
            this.ws = ws;
            this.clients = {};
            this.idgen = 0;

            this.queue = [];
            
            var this2 = this;
            this.ws.onmessage = function(msg) {
                this2.on_message.apply(this2, arguments);
            }
        }

        flush() {
          try {
            for (var msg of this.queue) {
              this.ws.send(msg);
            }

            this.queue = [];
          } catch(msg) {
            console.log("failed to flush queue");
          }
        }

       _send(msg) {
         if (this.ws.readyState != 1) {
           this.queue.push(msg);
         } else {
           this.ws.send(msg);
         }
       }

        command(cmd, args) {
            args = args === undefined ? {} : args;
            
            cmd = {
                command : cmd
            };
            for (var k in args) {
                cmd[k] = args[k];
            }
            cmd.clientID = this.idgen++;
            
            var this2 = this;
            
            this.clients[cmd.clientID] = cmd;
            cmd.promise = new Promise(function(accept, reject) {
                cmd.accept = accept;
                cmd.reject = reject;

                this2._send(JSON.stringify(cmd));
            });
            
            return cmd.promise;
        }
        
        on_message(msg) {
            var data = msg.data;
            
            try {
                data = JSON.parse(data);
            } catch(error) {
                console.error(data);
                console.error("^^^^^^^^");
                console.error("Failed to parse data");
                return;
            }
            
            var id = data.clientID;
            
            if (id === undefined || !(id in this.clients)) {
                console.error("bad client id", id);
                return;
            }
            
            this.clients[id].accept(data.data);
            delete this.clients[id];
        }

        update() {
          if (this.ws.readyState == 1) {
            this.flush();
          }
        }
    }
    
    exports.AppState = class AppState {
        constructor() {
            this.alarms = {};
            this.manager = new GraphLayout();
            this.canvas = document.getElementById("temperature");
            this.size = [this.canvas.width, this.canvas.height];
            this.g = this.canvas.getContext("2d"); //draw context
            
            this.ws = new WebSocket("ws://" + document.location.host + "/data");
            
            this.api = new exports.APIClient(this.ws);
            this.start = (new Date()).valueOf();
            
            this.addGraph(new Graph("Temp", Units.C_TIME, "green"));
            this.addGraph(new Graph("PH", Units.C_TIME, "orange"));
            this.addGraph(new Graph("ORP", Units.C_TIME, "red"));
            //this.graphs["Temp"].setData([[0, 1], [1, 100], [2, 12], [3, 88], [4, 72], [5, -66]]);

            this.makeGUI();
        }

        _fieldsEnum() {
          var ret = {};

          for (var graph of this.manager.graphs) {
            ret[graph.name] = graph.name;
          }

          return ret;
        }

        
        // get the allarm settings 
        
        
        makeGUI() {
          this._new_alarm_name = "";
          this._new_alarm_field = "";
          this._new_alarm_trigger = 0;
          this._new_alarm_cmp = "<";

          if (this.gui !== undefined) {
            this.gui.destroy();
            this.gui = undefined;
          }

          this.gui = new controller.GUI("Options", this);
          var panel = this.gui.panel("Alarms");
          panel.open();

          var panel2 = panel.panel("New Alarm");
          panel2.open();

          var CmpEnum = {
            ">" : ">",
            "<" : "<"
          };

          panel2.textbox("Name", "appstate._new_alarm_name");
          panel2.enum("Field", "appstate._new_alarm_field", this._fieldsEnum());
          panel2.slider("Trigger", "appstate._new_alarm_trigger", -500, 800);
          panel2.enum("Mode", "appstate._new_alarm_cmp", CmpEnum);

          panel2.button("Create Alarm", function() {
            var alarm = {
                trigger : _appstate._new_alarm_trigger,
                cmp : _appstate._new_alarm_cmp,
                field : _appstate._new_alarm_field,
                name : _appstate._new_alarm_name
            };
              
            console.log("saving alarm ", alarm.name);
            this2.api.command("addAlarm", alarm).then(function() {
              console.log("Successfully updated alarm", alarm.name);
              _appstate.makeGUI();
            });
          }, this);

          var this2 = this;

          this.api.command("getAlarms").then(function(alarms) {
            this2.alarms = alarms;
            this2._alarms = {};

            //dumb hack.  this version of my controller.js doesn't have
            //lists property implemented.
            //so sick of writing these stupid controller.js libraries.

            //so, convert to an object with sanitized names
            for (var k in alarms) {
              k = k.replace(/[ \n\r\t\b\v-+:<>/\&!@#$%]/g, "_");
              this2._alarms[k] = alarms[k];
            }

            console.log("alarms", alarms);

            function bind(k) {
              var alarm = this2._alarms[k1];
              var k = alarm.name;

              var panel2 = panel.panel(k);
              panel2.open();

              var path = "appstate._alarms." + k;
              panel2.enum("Field", path + ".field", this2._fieldsEnum());
              panel2.slider("Trigger", path + ".trigger", -500, 800);
              panel2.enum("Mode", path + ".cmp", CmpEnum);
              panel2.textbox("Phone #", path + ".phone");
              panel2.textbox("Email", path + ".email");
              panel2.textbox("Message", path + ".message");

              panel2.button("Save", function() {
                console.log("saving alarm ", alarm.name);
                this2.api.command("addAlarm", alarm).then(function() {
                  console.log("Successfully updated alarm", alarm.name);
                });
              })
            }

            for (var k1 in this2._alarms) {
              bind(k);
            }
          });
        }

        updateGraphs() {
           this.manager.update(this);
        }
        
        addGraph(graph) {
            this.manager.add(graph);
        }
        
        removeGraph(graph) {
          this.manager.remove(graph);
        }
        on_resize() {
            
        }
        
        checksize() {
            var goal = [window.innerWidth, window.innerHeight];
            if (this.size[0] != goal[0] || this.size[1] != goal[1]) {
                console.log("resize!");
                
                this.size[0] = goal[0];
                this.size[1] = goal[1];
                
                this.canvas.width = this.size[0];
                this.canvas.height=  this.size[1];
                
                this.on_resize();
            }
        }

        drawText(g, text, x, y, color) {
          g.fillStyle = g.strokeStyle = color;

          var scale = _appstate.size[0];
          g.scale(1/scale, -1/scale);
          g.fillText(text, x*scale, y*-scale);
          g.scale(scale, -scale);
        }

        draw() {
            var g = this.g;
            
            this.checksize();
            
            g.save();
            g.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            g.lineWidth = 2.0 / this.size[0];
            g.scale(this.size[0]*0.5, this.size[1]*0.5);
            g.translate(0.5, 0.5);
            
            g.scale(1, -1);
            g.translate(0.0, -0.7);
            
            g.beginPath();
            g.rect(0, 0, 1, 1);
            g.stroke();

            this.manager.draw(this.canvas, g);

            g.restore();
        }
    }
    
    function dodraw() {
        exports.animreq = undefined;
        _appstate.draw();
    }
    
    exports.animreq = undefined;
    window.redraw_all = function() {
        if (exports.animreq) {
            return;
        }
        
        exports.animreq = requestAnimationFrame(dodraw);
    }
    
    window._appstate = new exports.AppState();
    window.redraw_all();
    
    console.log("app start");
    
    setInterval(function() {
        _appstate.updateGraphs();
        _appstate.api.update();
    }, 550);
    
    return exports;
});
