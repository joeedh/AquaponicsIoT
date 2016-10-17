"use strict";

var wsock = require('./wsock');
var fs = require('fs');
var ALARMFILE = "./alarms.json";

class Alarm {
  constructor(name, field, trigger, cmp, phone, email, message) {
    this.enabled = true;
    this.name = name;
    this.field = field;
    this.trigger = trigger;
    this.cmp = cmp;
    this.phone = phone === undefined ? "" : phone;
    this.email = email === undefined ? "" : email;
    this.message = message === undefined ? "Alarm was triggered" : message;
    this.enabled = true;
  }

  loadJSON(obj) {
    for (var k in obj) {
      this[k] = obj[k];
    }

    return this;
  }

  toJSON() {
    return {
      name: this.name,
      field: this.field,
      trigger: this.trigger,
      cmp: this.cmp,
      phone : this.phone,
      email : this.email,
      message : this.message,
      enabled : this.enabled
    }
  }
}

exports.DB = class DB extends wsock.DBIF {
    constructor(fields) {
        super();

        this.alarms = {};
        this.fields = {};
        this.logname = "log.txt";
        this.logtick = 0;
        
        for (var field of fields) {
            this.fields[field] = {
                data : []
            };
        }

        this._load();
    }

    _exists(path) {
      try {
        fs.readFileSync(path);
        return true;
      } catch(error) {
        return false;
      }
    }

    _load() {
      if (this._exists(ALARMFILE)) {
        console.log("loading alarms");

        var buf = fs.readFileSync(ALARMFILE, "ascii");
        var alarms;

        try {
          alarms = JSON.parse(buf);
        } catch (error) {
          console.log("Failed to parse alarms file!");
          //throw new Error("failed to parse alarms file");
        }

        if (alarms !== undefined) {
          for (var k in alarms) {
            var alarm = new Alarm();
            alarms[k] = alarm.loadJSON(alarms[k]);
          }

          this.alarms = alarms;
        }
      }
    }
    getAlarms() {
      return this.alarms;
    }

    //XXX need to cleanup addAlarm, possibly combined with saveAlarm into an updateOrAddAlarm()

    addAlarm(name, field, trigger, cmp, phone, email, message) {
      this.alarms[name] = new Alarm(name, field, trigger, cmp, phone, email, message);
    }

    saveAlarm(alarm) {
      //for this implementation, alarm is not wrapped data.
      //so, do nothing here
    }

    save() {
      var buf = JSON.stringify(this.alarms);

      try {
        fs.writeFileSync(ALARMFILE, buf);
      } catch (error) {
        console.log("WARNING: failed to write alarm file");
        //throw new Error("WARNING: failed to write alarm file");
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
