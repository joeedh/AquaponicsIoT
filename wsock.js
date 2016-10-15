"use strict";

var cconst = { 
    PORT : 1337,
    VERSION : 0.001
} //require('./const');

var DBIF = exports.DBIF = class DBIF {
    getFieldNames() {
        throw new Error("implement me!");
    }
    
    getFieldMeta(field) {
        throw new Error("implement me!");
    }
    
    getFieldData(field, start_time, end_time) {
        throw new Error("implement me!");
    }
    
    addFieldData(field, time, value) {
        throw new Error("implement me!");
    }
}

exports.handlers = {
    getMeta : function*(db, req, send) {
        var fields = db.getFieldNames();
        
        send({
            command : "getMeta",
            version : cconst.VERSION,
            fields : fields
        });
    },
    
    getFieldMeta : function*(db, req, send) {
        var meta = db.getFieldMeta(req.field);
        meta.command = "getFieldMeta";
        
        yield send(meta);
    },
    
    getFieldRecent : function*(db, req, send) {
        var field = req.field, count = req.count;
        
        console.log("field ", field, "count: ", count);
        
        yield send(db.getFieldRecent(field, count));
    }
};

var ws = require('websocket');
var http = require('http');
var fs = require('fs');

exports.startServer = function servServer(servarg, db) {
    var serv = exports.serv = !servarg ? http.createServer() : servarg;
    console.log("Listening on port", cconst.PORT);

    serv.listen(cconst.PORT);
    var wsserver = new ws.server({
        httpServer : serv,
        autoAcceptConnections:  true
    });

    exports.conn_idgen = 0;
    exports.connections = {};
    exports.db = db;

    wsserver.on('connect', function(conn) {
        conn.id = exports.conn_idgen++;
        exports.connections[conn.id] = conn;

        conn.on("message", function(e) {
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


            var job;
            var send = function(obj) {
                var msg = {
                    data : obj,
                    clientID : id
                };
                
                conn.send(JSON.stringify(msg), function() {
                    var done = job.next();

                    //if (done.done) {
                    //    conn.send(JSON.stringify({command : 'OK'}));
                    //}
                });
            }
            
            job = new exports.handlers[command](exports.db, data, send);
            job.next();

        });
    });
    
    return http;
};
