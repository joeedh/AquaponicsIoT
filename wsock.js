"use strict";

var config = require('./config');

exports.handlers = {
  getAlarms: function (db, req, send) {
    console.log("getAlarms called");

    send(db.getAlarms());
  },

  addAlarm : function(db, req, send) {
    var alarms = db.getAlarms();
    var name = req.name, trigger = req.trigger, cmp = req.cmp, field = req.field;
    var phone = req.phone, email = req.email, message = req.message;

    if (name === undefined || trigger === undefined || cmp === undefined || field === undefined) {
      console.log(req);
      send.error("Missing field");
      return;
    }

    db.addAlarm(name, field, trigger, cmp, phone, email, message);
    db.save();

    send([]);
  },

  getMeta: function (db, req, send) {
    var fields = db.getFieldNames();

    send({
      command: "getMeta",
      version: config.VERSION,
      fields: fields
    });
  },

  getFieldMeta: function (db, req, send) {
    var meta = db.getFieldMeta(req.field);
    meta.command = "getFieldMeta";

    /*yield*/
    send(meta);
  },

  getFieldRecent: function (db, req, send) {
    var field = req.field, count = req.count;

    //console.log("field ", field, "count: ", count);

    /*yield*/
    send(db.getFieldRecent(field, count));
  }
};

var ws = require('websocket');
var http = require('http');
var fs = require('fs');

exports.startServer = function servServer(servarg, db) {
  var serv = exports.serv = !servarg ? http.createServer() : servarg;
  console.log("Listening on port", config.PORT);

  serv.listen(config.PORT);
  var wsserver = new ws.server({
    httpServer: serv,
    autoAcceptConnections: true
  });

  exports.conn_idgen = 0;
  exports.connections = {};
  exports.db = db;

  wsserver.on('connect', function (conn) {
    conn.id = exports.conn_idgen++;
    exports.connections[conn.id] = conn;

    conn.on("message", function (e) {
      try {
        var data = JSON.parse(e.utf8Data);
      } catch (error) {
        console.log("Error parsing", e.utf8Data);
        return;
      }

      var command = data.command;
      var id = data.clientID;

      if (command === undefined || !(command in exports.handlers)) {
        console.log("bad command '" + command + "'");
        return;
      }


      //var job;
      var send = function (obj) {
        var msg = {
          data: obj,
          clientID: id
        };

        conn.send(JSON.stringify(msg), function () {
          //var done = job.next();
        });
      };

      send.error = function(msg) {
        console.log("Error:", msg);

        var err = {
          command : "ERROR",
          clientID : id,
          message : msg
        };

        conn.send(JSON.stringify(err), function() {
          //kill job!!
        });
      };

      //XXX stupid node is being bugger with generators
      //do, comment out generator code and just kill job after first run
      exports.handlers[command](exports.db, data, send);

      //job = new exports.handlers[command](exports.db, data, send);
      //job.next();

    });
  });

  return http;
};
