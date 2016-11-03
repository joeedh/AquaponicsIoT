global.window = global.self = global;

var events = require('./events');
var logger = require('./logger');
var sms = require('./sms');
var config = require('./config');
var wsock = require('./wsock');

var db = exports.db = new (require('./db').DB)([
  "Temp",
  "PH",
  "ORP"
]);

/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
/*global */
/*
 A simple node.js application intended to read data from Analog pins on the Intel based development boards
 such as the Intel(R) Galileo and Edison with Arduino breakout board, and display it in a browser running on the client.

 This demonstrates use of http.createServer, and fs.

 MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
 Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.

 Steps for installing MRAA & UPM Library on Intel IoT Platform with IoTDevKit Linux* image
 Using a ssh client:
 1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
 2. opkg update
 3. opkg upgrade

 Article: https://software.intel.com/en-us/xdk-sample-creating-a-web-server
 */

// Set this to the ip address of your board (not 127.0.0.1)
//var ipAddress = '172.16.0.134'; 
//var ipAddress = '192.168.1.71';

var mraa = require('mraa'); //require mraa
var math = require('mathjs');
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

// Start by loading in some data
var fs = require('fs');

var DOCROOT = config.DOCROOT;
var aquaponicPage = fs.readFileSync(DOCROOT + 'aquaponic.html');

// Insert the ip address in the code in the page

//aquaponicPage = String(aquaponicPage).replace(/172.16.0.210/, ipAddress);
//aquaponicPage = String(aquaponicPage).replace(/192.168.1.71/, ipAddress);

//var analogPin0 = new mraa.Aio(0);
//
///**
// * Given a value, convert it to Lux
// *
// * This uses the table given in the documentation for the 
// * Grove Starter Kit Plus. We have not sought to verify these
// * values with our device. That would be worth doing if you
// * intend to rely on these values. In that case, it could also
// * be worthwhile to improve the interpolation formula
// * @param {Number} - the raw reading from the device
// */
//function getLux(analogValue) {
//  // Values taken from Grove Starter Kit for Arduino table
//  var lux;
//  var calib = [{reading:0, lux:0},
//               {reading:100, lux:0.2},  // guess - not from published table
//               {reading:200, lux:1},
//               {reading:300, lux:3},
//               {reading:400, lux:6},
//               {reading:500, lux:10},
//               {reading:600, lux:15},
//               {reading:700, lux:35},
//               {reading:800, lux:80},
//               {reading:900, lux:100}];
//  var i = 0;
//  while (i < calib.length && calib[i].reading < analogValue) {
//    i ++;
//  }
//  if (i > 0) {
//    i = i - 1;
//  }
//  // simple linear interpolation 
//  lux =  (calib[i].lux *(calib[i + 1].reading - analogValue) + calib[i + 1].lux * (analogValue - calib[i].reading))/(calib[i + 1].reading - calib[i].reading);
//  return lux;
//}

var temps = ['102', '102', '101', '101', '101', '100', '100', '99', '99', '98', '98', '98', '97', '97', '96', '96', '96', '95', '95', '94', '94', '94', '93', '93', '92', '92', '92', '91', '91', '91', '90', '90', '89', '89', '89', '88', '88', '88', '87', '87', '87', '86', '86', '86', '85', '85', '85', '84', '84', '84', '83', '83', '83', '82', '82', '82', '82', '81', '81', '81', '80', '80', '80', '79', '79', '79', '79', '78', '78', '78', '77', '77', '77', '77', '76', '76', '76', '75', '75', '75', '75', '74', '74', '74', '74', '73', '73', '73', '72', '72', '72', '72', '71', '71', '71', '71', '70', '70', '70', '70', '69', '69', '69', '69', '68', '68', '68', '68', '68', '67', '67', '67', '67', '66', '66', '66', '66', '65', '65', '65', '65', '64', '64', '64', '64', '64', '63', '63', '63', '63', '63', '62', '62', '62', '62', '61', '61', '61', '61', '61', '60', '60', '60', '60', '60', '59', '59', '59', '59', '59', '58', '58', '58', '58', '58', '57', '57', '57', '57', '57', '56', '56', '56', '56', '56', '55', '55', '55', '55', '55', '54', '54', '54', '54', '54', '54', '53', '53', '53', '53', '53', '52', '52', '52', '52', '52', '52', '51', '51', '51', '51', '51', '50', '50', '50', '50', '50', '50', '49', '49', '49', '49', '49', '49', '48', '48', '48', '48', '48', '48', '47', '47', '47', '47', '47', '47', '46', '46', '46', '46', '46', '46', '45', '45', '45', '45', '45', '45', '45', '44', '44', '44', '44', '44', '44', '43', '43', '43', '43', '43', '43', '43', '42', '42', '42', '42', '42', '42', '41', '41', '41', '41', '41', '41', '41', '40', '40', '40', '40', '40', '40', '40', '39', '39', '39', '39', '39', '39', '39', '38', '38', '38', '38', '38', '38', '38', '38', '37', '37', '37', '37', '37', '37', '37', '36', '36', '36', '36', '36', '36', '36', '35', '35', '35', '35', '35', '35', '35', '35', '34', '34', '34', '34', '34', '34', '34', '34', '33', '33', '33', '33', '33', '33', '33', '33', '32', '32', '32', '32', '32', '32', '32', '32', '31', '31', '31', '31', '31', '31', '31', '31', '30', '30', '30', '30', '30', '30', '30', '30', '29', '29', '29', '29', '29', '29', '29', '29', '29', '28', '28', '28', '28', '28', '28', '28', '28', '27', '27', '27', '27', '27', '27', '27', '27', '27', '26', '26', '26', '26', '26', '26', '26', '26', '26', '25', '25', '25', '25', '25', '25', '25', '25', '25', '24', '24', '24', '24', '24', '24', '24', '24', '24', '24', '23', '23', '23', '23', '23', '23', '23', '23', '23', '22', '22', '22', '22', '22', '22', '22', '22', '22', '22', '21', '21', '21', '21', '21', '21', '21', '21', '21', '21', '20', '20', '20', '20', '20', '20', '20', '20', '20', '20', '19', '19', '19', '19', '19', '19', '19', '19', '19', '19', '18', '18', '18', '18', '18', '18', '18', '18', '18', '18', '17', '17', '17', '17', '17', '17', '17', '17', '17', '17', '17', '16', '16', '16', '16', '16', '16', '16', '16', '16', '16', '16', '15', '15', '15', '15', '15', '15', '15', '15', '15', '15', '15', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '14', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '13', '12', '12', '12', '12', '12', '12', '12', '12', '12', '12', '12', '11', '11', '11', '11', '11', '11', '11', '11', '11', '11', '11', '11', '10', '10', '10', '10', '10', '10', '10', '10', '10', '10', '10', '10', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '9', '8', '8', '8', '8', '8', '8', '8', '8', '8', '8', '8', '8', '8', '7', '7', '7', '7', '7', '7', '7', '7', '7', '7', '7', '7', '7', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3']; //for temp in C

//var mraa = require('mraa'); //require mraa
//console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

var analogPin2 = new mraa.Aio(2); // setup access analog input Analog pin #2 (A2) for temp sensor
var analogPin5 = new mraa.Aio(5); // setup access analog input Analog pin #5 (A5) for ph sensor
var analogPin1 = new mraa.Aio(1); // setup access analog input Analog pin #1 (A1) for ORP sensor

var temp = 0;
var ph = 0;
var orp = 0;

//var temps = [0,0,0,0,0,0,0,0,0,0];
var raw_temps = new Array(10);
//var phs[];
//var orps[];

//fs.open('myfile', 'wx', (err, fd) => {
//  if (err) {
//    if (err.code === "EEXIST") {
//      console.error('myfile already exists');
//      return;
//    } else {
//      throw err;
//    }
//  }
//
////  writeMyData(fd);
//});


read_sensors();

function read_sensors() {
  temp = read_temp();
//    console.log(temp);

//    read_temp();
  var time_as_num = (new Date()).valueOf();
  var ph = read_ph();
  var orp = read_orp();

  console.log('temp: %s C', temp, "ph", ph, "orp", orp);

  db.addFieldData('Temp', (new Date()).valueOf(), temp);
  db.addFieldData('PH', (new Date()).valueOf(), ph);
  db.addFieldData('ORP', (new Date()).valueOf(), orp);

  fs.appendFileSync('./sensors.log', time_as_num + ": " + temp + "," + ph + "," + orp + "\n");

  events.update(db, {
    Temp: temp,
    PH: ph,
    ORP: orp
  });

  setTimeout(read_sensors, 1000);
}


function output_data(temp, ph, orp) {
  console.log('temp: %s C', therm);
}

function analog_read_temp()
//var i;
{
  var mysum = 0;
  if (raw_temps[0] === undefined) { //temps.indexOf(undefined) >= 0) {
    console.log("zero found")
    for (var i = 0, len = raw_temps.length; i < len; i++) {
      raw_temps[i] = analogPin2.read();
    }
  }
  else {
    raw_temps.push(analogPin2.read());
    raw_temps.shift();
  }
//    console.log("%s %s %s %s %s", temps[0], temps[1], temps[2], temps[3], temps[4])
  for (var i = 0, len = raw_temps.length; i < len; i++) {
    mysum = mysum + raw_temps[i];
  }
//    console.log("%s %s",mysum, temps.length)
  return (math.round(mysum / raw_temps.length))
};


function read_temp() {
//    var analogValue = analogPin2.read(); //read the value of the analog pin
  var analogValue = analog_read_temp(); //read the value of the analog pin
//    console.log(analogValue);
  var indexValue = analogValue - 121;
  //console.log(indexValue); //write the value of the analog pin to the console
  var therm = temps[indexValue];
  return (therm);
}

function read_ph() {
  var PHlevel = 0;
  var PHprobe = analogPin5.read();
  PHlevel = (0.0178 * (PHprobe) - 1.889);
//    console.log('PH: %s',PHlevel);
  return PHlevel;
}

function read_orp() {
  var mV = 0;
  var V = 0;
  var ORPprobe = 255 * analogPin1.read() / 1024;

  console.log("  >", ORPprobe);

  V = ((2.5 - (ORPprobe / 200)) / 1.037);
  mV = V * 1000;       //1V = 1000mV
//    console.log('raw: $s ORP: %s mV',ORPprobe, mV);
//    New average = old average * (n-1)/n + new value /n

  return mV;
}

if (1) {
  var http = require('http');
  var serv = http.createServer();
  var fs = require('fs');

  wsock.startServer(serv, db);
  serv.on('request',
    function (req, res) {
      var value;

      // This is a very quick and dirty way of detecting a request for the page
      // versus a request for values
      if (req.url.indexOf('aquaponic') != -1) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(aquaponicPage);
      } else if (req.url.endsWith(".js")) { //expose .js scripts
        var path = req.url;

        if (path.search(/\.\./) >= 0) {
          res.writeHead(500, {'Content-Type': 'text/plain'});
          res.end("security error");

          return;
        }

        //do a bit of normalization. . .
        while (path.startsWith("/")) {
          path = path.slice(1, path.length);
        }

        console.log("static file", path);

        //relative to current diretory. . .
        path = DOCROOT + path.trim();

        var file;

        try {
          file = fs.readFileSync(path, "ascii");
        } catch (error) {
          console.log(req);
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.end("file not found: " + path);

          return;
        }

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(file);
      } else if (req.url.indexOf('data') == -1) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end("404");
      }// else {
      //let websocket server handle it
      //}
    });

  serv.listen(config.PORT);
}