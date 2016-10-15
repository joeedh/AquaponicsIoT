var _sampling;
define([
  "util", "vectormath", "math"
], function(util, vectormath, math) {
  'use strict';

  var exports = _sampling = {};
  var Vector3 = vectormath.Vector3;

  var poff = [
    [-1, -1],
    [-1, 0],
    [-1, 1],

    [0, 1],
    [1, 1],
    [1, 0],

    [1, -1],
    [0, -1]
  ];

  var scache = {};

  //dimen is optional, 2;
  //radial is optional, false.
  var getSearchOff = exports.getSearchOff = function getSearchOff(n, dimen, radial) {
    radial = !!radial;

    dimen = dimen === undefined ? 2 : dimen;
    var key = n + ":" + dimen + ":" + radial;

    if (key in scache) {
      return scache[key];
    }

    function recurse(i, depth, point) {
      point = point.slice(0, point.length);
      point.push(i);

      if (depth == 0) {
        var iszero = true;
        var sum = 0;

        for (var i=0; i<point.length; i++) {
          sum += point[i]*point[i];

          if (point[i]) {
            iszero = false;
          }
        }

        if (radial && sum > n) {
          return;
        }

        if (!iszero) {
          ret.push(point);
        }
        return;
      } else {
        for (var i=-n; i<=n; i++) {
          recurse(i, depth-1, point);
        }
      }
    }

    var ret = [];

    for (var i=-n; i<=n; i++) {
      recurse(i, dimen-1, []);
    }

    scache[key] = ret;

    return ret;
  };

  var Point = exports.Point = class Point extends Array {
    constructor(dimen, r) {
      super(dimen);

      this.length = dimen

      for (var i=0; i<dimen; i++) {
        this[i] = 0;
      }

      this.r = r;
    }

    load(b) {
      for (var i=0; i<this.length; i++) {
        this[i] = b[i];
      }

      this.r = b.r;

      return this;
    }

    add(b) {
      for (var i=0; i<this.length; i++) {
        this[i] += b[i];
      }

      return this;
    }

    copy() {
      return new Point().load(this);
    }

    distanceTo(p) {
      var sum = 0;

      for (var i=0; i<this.length; i++) {
        sum += this[i]-p[i];
      }

      sum = sum != 0.0 ? Math.sqrt(sum) : 0.0;
      return sum;
    }
  };

  var Poisson = exports.Poisson = class Poisson {
    //dimen is optional, 2
    constructor(dimen, totpoint) {
      dimen = dimen === undefined ? 2 : dimen;

      this.dimen = dimen;
      this.totpoint = totpoint;
      this.points = [];

      if (dimen == 2) {
        this.r = 1 / Math.sqrt(totpoint);
      } else if (dimen == 3) {
        this.r = 1 / Math.cbrt(totpoint);
      } else {
        this.r = 1 / Math.pow(totpoint, 1.0/dimen);
      }
    }

    gen(seed) {
      var r = this.r;
      var steps = this.totpoint, dimen = this.dimen, ps = this.points;
      var p = new Point(dimen, r), p3 = new Point(dimen, r);

      var random = new util.MersenneRandom();
      if (seed != undefined) {
        random.seed(seed);
      }

      var poff = getSearchOff(1, dimen, false);

      for (var i=0; i<steps; i++) {
        for (var j=0; j<dimen; j++) {
          p[j] = random.random();
        }

        var ok = true;

        for (var j=0; ok && j<ps.length; j++) {
          var p2 = ps[j];

          for (var k=0; k<poff.length+1; k++) {
            if (k == poff.length) {
              p3.load(p);
            } else {
              p3.load(p).add(poff[k]);
            }

            var dis = p2.distanceTo(p3);

            if (dis < r) {
              ok = false;
              break;
            }
          }
        }

        if (ok) {
          ps.push(p.copy());
        }
      }
    }
  };

  return exports;
});
