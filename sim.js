global.window = global.self = global;

var events = require('./events');

//some polyfills for generating simple waveforms
Math.fract = function(f) { //saw wave
  return f - Math.floor(f);
}
Math.tent = function(f) { //triangle wave
  return 1.0 - Math.abs(Math.fract(f)-0.5)*2.0;
}

var wsock = require('./wsock');
var db = exports.db = new (require('./db').DB)([
  "Temp",
  "PH",
  "ORP"
]);

// Set this to the ip address of your board (not 127.0.0.1)
//var ipAddress = '172.16.0.134';
var ipAddress = '192.168.1.71';

// Start by loading in some data
var fs = require('fs');

var DOCROOT = "./"
var aquaponicPage = fs.readFileSync(DOCROOT + 'aquaponic.html');

// Insert the ip address in the code in the page

//aquaponicPage = String(aquaponicPage).replace(/172.16.0.210/, ipAddress);
aquaponicPage = String(aquaponicPage).replace(/192.168.1.71/, ipAddress);

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

var temps = ['102','102','101','101','101','100','100','99','99','98','98','98','97','97','96','96','96','95','95','94','94','94','93','93','92','92','92','91','91','91','90','90','89','89','89','88','88','88','87','87','87','86','86','86','85','85','85','84','84','84','83','83','83','82','82','82','82','81','81','81','80','80','80','79','79','79','79','78','78','78','77','77','77','77','76','76','76','75','75','75','75','74','74','74','74','73','73','73','72','72','72','72','71','71','71','71','70','70','70','70','69','69','69','69','68','68','68','68','68','67','67','67','67','66','66','66','66','65','65','65','65','64','64','64','64','64','63','63','63','63','63','62','62','62','62','61','61','61','61','61','60','60','60','60','60','59','59','59','59','59','58','58','58','58','58','57','57','57','57','57','56','56','56','56','56','55','55','55','55','55','54','54','54','54','54','54','53','53','53','53','53','52','52','52','52','52','52','51','51','51','51','51','50','50','50','50','50','50','49','49','49','49','49','49','48','48','48','48','48','48','47','47','47','47','47','47','46','46','46','46','46','46','45','45','45','45','45','45','45','44','44','44','44','44','44','43','43','43','43','43','43','43','42','42','42','42','42','42','41','41','41','41','41','41','41','40','40','40','40','40','40','40','39','39','39','39','39','39','39','38','38','38','38','38','38','38','38','37','37','37','37','37','37','37','36','36','36','36','36','36','36','35','35','35','35','35','35','35','35','34','34','34','34','34','34','34','34','33','33','33','33','33','33','33','33','32','32','32','32','32','32','32','32','31','31','31','31','31','31','31','31','30','30','30','30','30','30','30','30','29','29','29','29','29','29','29','29','29','28','28','28','28','28','28','28','28','27','27','27','27','27','27','27','27','27','26','26','26','26','26','26','26','26','26','25','25','25','25','25','25','25','25','25','24','24','24','24','24','24','24','24','24','24','23','23','23','23','23','23','23','23','23','22','22','22','22','22','22','22','22','22','22','21','21','21','21','21','21','21','21','21','21','20','20','20','20','20','20','20','20','20','20','19','19','19','19','19','19','19','19','19','19','18','18','18','18','18','18','18','18','18','18','17','17','17','17','17','17','17','17','17','17','17','16','16','16','16','16','16','16','16','16','16','16','15','15','15','15','15','15','15','15','15','15','15','14','14','14','14','14','14','14','14','14','14','14','13','13','13','13','13','13','13','13','13','13','13','13','12','12','12','12','12','12','12','12','12','12','12','11','11','11','11','11','11','11','11','11','11','11','11','10','10','10','10','10','10','10','10','10','10','10','10','9','9','9','9','9','9','9','9','9','9','9','9','8','8','8','8','8','8','8','8','8','8','8','8','8','7','7','7','7','7','7','7','7','7','7','7','7','7','6','6','6','6','6','6','6','6','6','6','6','6','6','5','5','5','5','5','5','5','5','5','5','5','5','5','4','4','4','4','4','4','4','4','4','4','4','4','4','3','3','3','3','3','3','3','3','3','3']; //for temp in C

//console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

var temp = 0;
var ph = 0;
var orp = 0;

//var temps = [0,0,0,0,0,0,0,0,0,0];
var raw_temps = new Array (10);
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

function read_sensors()
{
  temp = read_temp();
//    console.log(temp);

//    read_temp();
  var ph = read_ph();
  var orp = read_orp();

  //console.log('temp: %s C', temp, "ph", ph, "orp", orp);

  var time_as_num = (new Date()).valueOf();

  db.addFieldData('Temp', time_as_num, temp);
  db.addFieldData('PH', time_as_num, ph);
  db.addFieldData('ORP', time_as_num, orp);

//    writeMyData(temp,ph,orp);

  fs.appendFileSync('./sensors.log', time_as_num + ": " + temp + "," + ph + "," + orp + "\n");

  events.update(db, {
    Temp : temp,
    PH   : ph,
    ORP  : orp
  });

  /*
  fs.writeFile('\home\martin\aquaponic\aquaponic.log', temp, function(err) {
    //console.log ("temp written %s", temp);
    if(err) {
      console.error("Could not write file: %s", err);
    }
  });*/


  setTimeout(read_sensors, 1000);
}


function output_data (temp, ph, orp)
{
  //console.log('temp: %s C',therm);
}

function analog_read_temp()
//var i;
{
  return Math.random()*100.0;
};


var _rti = 0;
function read_temp()
{
  var f = _rti / 32;

  f = Math.fract(f)*0.25 + Math.tent(f*5.0)*0.5 + Math.tent(f*25.0)*0.25;

  f = (~~(f*10000))/100;
  _rti++;

  return f;
}

function read_ph()
{
  return Math.random()*5.0;

  var PHlevel = 0;
  var PHprobe = analogPin5.read();
  PHlevel = (0.0178 * (PHprobe) - 1.889);
//    console.log('PH: %s',PHlevel);
  return PHlevel;
}

function read_orp()
{
  return Math.random()*350 + 150;

  var mV = 0;
  var V = 0;
  var ORPprobe = 255 * analogPin1.read() / 1024;

  //console.log("  >", ORPprobe);

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
        } catch(error) {
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

  serv.listen(1337, ipAddress);
}