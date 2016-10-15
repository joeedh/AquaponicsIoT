var _trigrid = undefined;
define([
  "util", "vectormath", "const", "math"
], function(util, vectormath, cconst, math) {
  'use strict';

  var exports = _trigrid = {};

  var Vector3 = vectormath.Vector3, Matrix4 = vectormath.Matrix4, Vector2 = vectormath.Vector2;

  //for linked list
  var LREF= 0, LNEXT= 1, LTOT=2;
  //for triangle grid
  var TFLAG= 0, THEAD= 1, TTOT = 2;
  //for triangle list
  var RTOT = 3*3 + 1;

  function linklist_append(item, list, head) {
    list[list.cur++] = item;
    list[list.cur++] = head;

    return list.cur - LTOT;
  }

  var CellFlags = exports.CellFlags = {
    SELECT : 1,
    FULLY_COVERED : 2
  };

  var isect_tmps = util.cachering.fromConstructor(Vector3, 64);
  var isect_rets = new util.cachering(function() {
    return [new Vector3(), 0];
  }, 1024);
  var isect_rets2 = util.cachering.fromConstructor(Array, 64);

  var worldToGridRets = util.cachering.fromConstructor(Vector3, 64);
  var gridToWorldRets = util.cachering.fromConstructor(Vector3, 64);

  var TriGrid = exports.TriGrid = class TriGrid {
    //size is optional, 512
    constructor(min, max, size) {
      size = size == undefined ? 64 : size;

      this.gridsize = size;
      this.grid = new Float64Array(size*size*TTOT);
      this.grid.fill(-1, 0, this.grid.length);
      this.refs = new Float64Array(size*size*LTOT);
      this.refs.cur = 0;
      this.tris = [];
      this._tmpmm = new math.MinMax(3);

      this.min = new Vector3(min);
      this.max = new Vector3(max);
    }

    reset(min, max) {
      this.grid.fill(-1, 0, this.grid.length);
      this.refs.cur = 0;
      this.tris.length = 0;

      if (min !== undefined) {
        this.min.load(min);
        this.max.load(max);
      }

      return this;
    }

    worldToGrid(x, y, z) {
      var ret = worldToGridRets.next();

      ret[0] = ~~(this.gridsize * (x - this.min[0]) / (this.max[0] - this.min[0]));
      ret[1] = ~~(this.gridsize * (y - this.min[1]) / (this.max[1] - this.min[1]));
      ret[2] =  z;

      return ret;
    }

    gridToWorld(gx, gy, z) {
      var ret = gridToWorldRets.next();

      ret[0] = gx / this.gridsize, ret[1] = gy / this.gridsize, ret[2] = z;

      ret[0] = ret[0]*(this.max[0]-this.min[0]) + this.min[0];
      ret[1] = ret[1]*(this.max[1]-this.min[1]) + this.min[1];

      return ret;
    }

    add(tri, tidx) {
      var mm = this._tmpmm;
      var grid = this.grid, size = this.gridsize;

      this.tris.push(tri[0]);
      this.tris.push(tri[1]);
      this.tris.push(tri[2]);
      this.tris.push(tidx);

      mm.reset();
      mm.minmax(tri[0]);
      mm.minmax(tri[1]);
      mm.minmax(tri[2]);

      var p1 = this.worldToGrid(mm.min[0], mm.min[1], mm.min[2]);
      var p2 = this.worldToGrid(mm.max[0], mm.max[1], mm.max[2]);

      var x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1];

      for (var i=x1; i<=x2; i++) {
        for (var j=y1; j<=y2; j++) {
          var gidx = (j*size + i)*TTOT;

          if (grid[gidx] === undefined) {
            console.log("EEK!", gidx, x1, y1, x2, y2, tri);
            continue;
          }

          if (grid[gidx].flag == -1) {
            grid[gidx].flag = 0;
          }

          grid[gidx + THEAD] = linklist_append(tidx, this.refs, grid[gidx+THEAD]);
        }
      }
    }

    _loadTri(i, v1, v2, v3) {
      var tris = this.tris;

      v1[0] = tris[i++];
      v1[1] = tris[i++];
      v1[2] = tris[i++];

      v2[0] = tris[i++];
      v2[1] = tris[i++];
      v2[2] = tris[i++];

      v3[0] = tris[i++];
      v3[1] = tris[i++];
      v3[2] = tris[i++];

      return tris[i++]; //stored index
    }

    isectPoint(p) {
      var gp = this.worldToGrid(p[0], p[1], p[2]);
      var size = this.gridsize, grid=this.grid;

      var gidx = (gp[1]*size + gp[0])*TTOT;
      var refs = this.refs;
      var ref = grid[gidx+THEAD];

      var v1 = isect_tmps.next().zero();
      var v2 = isect_tmps.next().zero();
      var v3 = isect_tmps.next().zero();

      var ret = isect_rets2.next();
      ret.length = 0;

      var _i = 0;
      while (ref != undefined && ref >= 0) {
        if (_i++ > 1000) {
          console.trace("infinite loop!");
          break;
        }

        var tidx = this._loadTri(refs[ref+LREF], v1, v2, v3);
        if (math.point_in_tri(p, v1, v2, v3)) {
          var ret2 = isect_rets.next();

          ret2[0].load(p);
          ret2[0][2] = v1[0][2]; //triangles are flat planes with respect to z, so no need to calc interpolated point

          ret2[1] = tidx;

          ret.push(ret2);
        }

        ref = refs[ref+LNEXT];
      }

      return ret;
    }
  }

  return exports;
});
