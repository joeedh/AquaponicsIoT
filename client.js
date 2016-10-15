//global alias to module
//this is for debugging purposes only, do not reference this variable in code
var _client = undefined;

define([
    
], function() {
    'use strict';
    
    var exports = _client = {};
    
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
        }
    }
    
    exports.APIClient = class APIClient {
        constructor(ws) {
            this.ws = ws;
            this.clients = {};
            this.idgen = 0;
            
            var this2 = this;
            this.ws.onmessage = function(msg) {
                this2.on_message.apply(this2, arguments);
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
                
                this2.ws.send(JSON.stringify(cmd));
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
    }
    
    exports.AppState = class AppState {
        constructor() {
            this.canvas = document.getElementById("temperature");
            this.size = [this.canvas.width, this.canvas.height];
            this.g = this.canvas.getContext("2d"); //draw context
            
            this.graphs = {};
            this.ws = new WebSocket("ws://" + document.location.host + "/data");
            
            this.api = new exports.APIClient(this.ws);
            this.start = (new Date()).valueOf();
            
            this.addGraph(new Graph("Temp", Units.C_TIME, "green"));
            this.addGraph(new Graph("PH", Units.C_TIME, "orange"));
            this.addGraph(new Graph("ORP", Units.C_TIME, "red"));
            //this.graphs["Temp"].setData([[0, 1], [1, 100], [2, 12], [3, 88], [4, 72], [5, -66]]);
        }
        
        updateGraph(field) {
            var graph = this.graphs[field];
            this.api.command("getFieldRecent", {field : field, count : 50}).then(
                
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
        
        updateGraphs() {
            for (var k in this.graphs) {
                this.updateGraph(k);
            }
        }
        
        addGraph(graph) {
            this.graphs[graph.name] = graph;
        }
        
        removeGraph(graph) {
            delete this.graphs[graph.name];
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
            
            for (var k in this.graphs) {
                var graph = this.graphs[k];
                graph.draw(g);
            }
            
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
    }, 550);
    
    return exports;
});
