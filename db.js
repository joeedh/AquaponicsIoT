"use strict";

var wsock = require('./wsock');
var fs = require('fs');

exports.DB = class DB extends wsock.DBIF {
    constructor(fields) {
        super();
        
        this.fields = {};
        this.logname = "log.txt";
        this.logtick = 0;
        
        for (var field of fields) {
            this.fields[field] = {
                data : []
            };
        }
    }
    
    getFieldNames() {
        return Object.keys(this.fields);
    }
    
    getFieldMeta(field) {
        var cpy = {};
        for (var k in this.fields[field]) {
            if (k == "data") {
                continue;
            }
            
            cpy[k] = this.fields[k];
        }
        
        return cpy;
    }
    
    getFieldRecent(field, count) {
        var data = this.fields[field].data;
        
        if (data.length < count) {
            return data.slice(0, data.length);
        } else {
            return data.slice(data.length-count, data.length);
        }
    }
    
    getFieldData(field, start, end) {
        var data = this.fields[field].data;
        var ret = {
            data : []
        };
        
        for (var d of data) {
            if (d.time >= start && d.time <= end) {
                ret.data.push(d);
            }
        }
        
        return ret;
    }
    
    addFieldData(field, time, value) {
        this.fields[field].data.push({
            time  : time,
            value : parseFloat(value)
        });
    }
}
