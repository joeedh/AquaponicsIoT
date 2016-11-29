"use strict"
var DBIF = exports.DBIF = class DBIF {
  getAlarms() {
    throw new Error("implement me!");
  }

  addAlarm(name, field, trigger, cmp) {
    throw new Error("implement me!");
  }

  updateAlarms(alarms) {
    throw new Error("implement me!");
  }

  save() {
    throw new Error("implement me!");
  }

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
