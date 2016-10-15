var _slicer = undefined;

define([
  "util", "vectormath", "math", "simplemesh", "webgl", "parseutil", "const", "trigrid", "sampling"
], function(util, vectormath, math, simplemesh, webgl, parseutil, cconst, trigrid, sampling) {
  "use strict";
  
  var exports = _slicer = {};
  
  var Vector2 = vectormath.Vector2;
  var Vector3 = vectormath.Vector3, Vector4 = vectormath.Vector4, Matrix4 = vectormath.Matrix4;

  var isect_tmps = util.cachering.fromConstructor(Vector3, 512);
  var isect_rets = util.cachering.fromConstructor(Vector3, 64);

  var SliceTypes = exports.SliceTypes = {
    VERTEX : 1,
    EDGE   : 2,
    POLY   : 4
  };
  
  var SliceElem = exports.SliceElem = class SliceElem {
    constructor(type) {
      SliceElem.init(this, type);
    }
    
    [Symbol.keystr]() {
      return "" + this.eid;
    }
    
    static init(e, type) {
      e.flag = e.index = 0;
      e.eid = -1;
      e.type = type;
    }
  };
  
  var SliceVertex = exports.SliceVertex = class SliceVertex extends Vector3 {
    constructor(co) {
      super(co);
      
      SliceElem.init(this, SliceTypes.VERTEX);
      this.edges = [];
    }
    
    other_edge(e) {
      if (this.edges.length !== 2) {
        throw new Error("other_edge is only valid for 2-valence vertices.");
      }
      
      if (e === this.edges[0])
        return this.edges[1];
      if (e === this.edges[1])
        return this.edges[0];
      
      return undefined;
    }
  };
  util.mixin(SliceVertex, SliceElem);
  
  var SliceEdge = exports.SliceEdge = class SliceEdge extends SliceElem {
    constructor(v1, v2) {
      super(SliceTypes.EDGE);
      
      this.v1 = v1;
      this.v2 = v2;

      this.no = new Vector3();

      if (v1 !== undefined) {
        this.calc_normal();
      }
    }

    calc_normal() {
      this.no.load(this.v1).sub(this.v2).normalize();
      var t = this.no[0]; this.no[0] = this.no[1]; this.no[1] = -t;
    }

    other_vertex(v) {
      if (v === this.v1)
        return this.v2;
      else if (v === this.v2)
        return this.v1;
      
      return undefined;
    }
    
    static _hash(v1, v2) {
      var min = Math.min(v1.eid, v2.eid);
      var max = Math.max(v1.eid, v2.eid);
      
      return min + (max<<19);
      //return "E"+min + ":" + max;
    }
    
    hash() {
      return SliceEdge._hash(this.v1, this.v2);
    }
  };
  
  var SlicePoly = exports.SlicePoly = class SlicePoly extends SliceElem {
    constructor() {
      super(SliceTypes.POLY);
      
      this.verts = [];
      this.edges = [];
      this.min = new Vector3();
      this.max = new Vector3();
    }
  };
  
  var Slice = exports.Slice = class Slice {
    constructor(z, thickness, slicei, totslice) {
      this.z = z;
      this.slicei = slicei;
      this.totslice = totslice;
      this.thickness = thickness;

      this.stencilmesh = new simplemesh.SimpleMesh();
      this.stencilmesh.add_island(false);
      this.stencilmesh.add_island(false);
      this.support_tris = [];

      this.mm = new math.MinMax(3);
      this.cent = new Vector3();
      this.size = new Vector3(); //mm.max-mm.min
      this.totstage = _appstate.params.totstage;
      
      this.verts = [];
      this.edges = [];
      this.polys = [];
      
      this.eidgen = new util.IDGen();
      this.eidmap = {};
      
      this.edgehash = new util.hashtable;
    }

    genSVG(stage) {
      var aspect = _appstate.params.aspect;

      var vb = "0 0 " + aspect + " 1";

      var s = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"" + vb + "\">\n";
      var patterns;

      if (_appstate.params.dohatch) {
        //XXX fix me! hand-coded by eye!

        patterns = [];
        var hw = _appstate.params.hatch_width;
        var tothatch = _appstate.params.totstage;

        var hwid = 0.025 / (tothatch);

        //patternTransform
        for (var i=0; i<tothatch; i++) {
          var x1 = 0.025 * i / (tothatch);
          var x2 = x1 + hwid;

          var rot = this.slicei*_appstate.params.hatch_rot;

          patterns.push([
            '<defs>',
            '<pattern id="hatch" width="0.025" height="0.025" patternUnits="userSpaceOnUse" patternTransform="rotate(' + rot + ')">',
            '<polygon points="X1,0 X1,0.05 X2,0.05 X2,0" fill="white"/>'.replace(/X1/g, "" + x1).replace(/X2/g, "" + x2),
            '</pattern>',
            '</defs>'
          ].join("\n"));
        }

        s += '$PATTERNS\n';
      }

      s += '  <rect x="0" y="0" width="' + aspect + '" height="1" fill="black" />\n';

      var polys = [];
      var visit = new util.set();

      function getloop(v, poly) {
        if (visit.has(v)) {
          return;
        }

        visit.add(v);
        poly.push(v);

        for (var e of v.edges) {
          var v2 = e.other_vertex(v);
          getloop(v2, poly);
        }
      }
      getloop = getloop.bind(this);

      for (var v of this.verts) {
        if (!visit.has(v)) {
          var poly = [];

          getloop(v, poly);

          polys.push(poly);
        }
      }

      var co = new Vector3();
      var camera = _appstate.camera;
      s += "  <g>\n";

      for (var vs of polys) {
        var d = ""

        for (var i=0; i<vs.length; i++) {
          var v = vs[i];

          co.load(v).multVecMatrix(camera.rendermat);
          co[0] = (co[0]*0.5 + 0.5)*aspect;
          co[1] = co[1]*0.5 + 0.5;

          if (i == 0) {
            d += " M"
          } else {
            d += " L"
          }

          d += " " + co[0].toFixed(5) + " " + co[1].toFixed(5);
        }

        var fill = _appstate.params.dohatch ? "url(#hatch)" : "white";

        s += '    <path d="' + d + '" stroke="white" stroke-width="0.0035" />\n';

        if (_appstate.params.doinfill) {
          s += '    <path d="' + d + '" fill="' + fill + '" />\n';
        }
      }

      s += "  </g>\n  <g>\n";

      function tf(x, y) {
        co[0] = x;
        co[1] = y;
        co[2] = this.z;

        co.multVecMatrix(camera.rendermat);
        co[0] = (co[0] * 0.5 + 0.5) * aspect;
        co[1] = co[1] * 0.5 + 0.5;

        return co;
      }
      tf = tf.bind(this);

      var stri = this.support_tris;
      for (var i=0; i<stri.length; i += 9) {
        var d = "M " + tf(stri[i], stri[i+1])[0] + " " + tf(stri[i], stri[i+1])[1];

        //XXX mean!
        d   += " L " + tf(stri[i+3], stri[i+4])[0] + " " + tf(stri[i+3], stri[i+4])[1];
        d   += " L " + tf(stri[i+6], stri[i+7])[0] + " " + tf(stri[i+6], stri[i+7])[1];

        s += '    <path d="' + d + '" fill="white" />\n';
      }

      s += "  </g>\n</svg>\n";

      if (_appstate.params.dohatch)
        return [s, patterns];
      else
        return s;
    }

    destroy() {
      this.stencilmesh.destroy();
    }

    load(b) {
      for (var k in b) {
        this[k] = b[k];
      }
      
      return this;
    }

    pointFilled(p) {
      p = isect_tmps.next().load(p);

      var ret = this.trigrid.isectPoint(p);
      if (ret.length > 0) {
        return true;
      }

      var p2 = isect_tmps.next().load(this.mm.max).addScalar(1.0);
      var verts = this.verts, wind = 0;

      for (var i=0; i<verts.length; i++) {
        var v1 = verts[i], v2 = verts[(i+1) % verts.length];

        if (math.line_line_cross(v1, v2, p, p2)) {
          wind++;
        }
      }

      return wind & 1;
    }
    
    make_vertex(co) {
      var v = new SliceVertex(co);
      
      //ensure non-undefined z
      if (v[2] == undefined)
        v[2] = 0.0;
      
      v.eid = this.eidgen.next();
      this.verts.push(v);
      this.eidmap[v.eid] = v;
      
      return v;
    }
    
    make_edge(v1, v2) {
      if (v1 === undefined || v2 === undefined) {
        throw new Error("make_edge: v1/v2 cannot be undefined");
      }
      
      var hash = SliceEdge._hash(v1, v2);
      
      if (this.edgehash.has(hash)) {
        return this.edgehash.get(hash);
      }
      
      var e = new SliceEdge(v1, v2);
      e.eid = this.eidgen.next();
      
      this.edges.push(e, e);
      this.eidmap[e.eid] = e;

      this.edgehash.set(e.hash(), e);
      v1.edges.push(e);
      v2.edges.push(e);

      e.calc_normal();

      return e;
    }

    flip_edge(e) {
      var t = e.v1;
      e.v1 = e.v2;
      e.v2 = t;

      e.calc_normal();
    }

    kill_vertex(v) {
      if (v.eid == -2) {
        console.log("kill_vertex was called twice\n");
        return;
      }
      
      for (var i=0; i<v.edges.length; i++) {
        this.kill_edge(v.edges[0]);
      }
      
      this.verts.remove(v);
      delete this.eidmap[v.eid];
      
      v.eid = -2;
    }
    
    kill_edge(e) {
      if (e.eid == -2) {
        console.log("kill_edge was called twice");
        return;
      }
      
      e.v1.edges.remove(e);
      e.v2.edges.remove(e);

      this.edgehash.remove(e.hash());
      this.edges.remove(e);
      delete this.eidmap[e.eid];
    }
    
    isect_edges(v1, v2) {
      var ret = [];
      var mindis = 1e17;
      
      for (var e of this.edges) {
        if (e.v1 === v1 || e.v2 === v2)
          continue;
        
        var p = math.line_line_isect(v1, v2, e.v1, e.v2);
        if (p === math.COLINEAR_ISECT) {
          p = e.v1.vectorDistance(v2) < e.v2.vectorDistance(v2) ? e.v1 : e.v2;
        } 
        
        if (p) {
          ret.push(new Vector3(p));
        }
      }
      
      return ret.length == 0 ? undefined : ret;
    }
    
    draw(screen, params, gl, stage, skipinfill) {
      this.totstage = params.totstage;

      stage = stage === undefined ? 0 : stage;

      var z = this.z;
      var boundary_only = !params.doinfill;
      var hatchoff = stage / this.totstage;

      function setUniforms(mesh) {
        screen.camera.bind(mesh.uniforms);
        mesh.uniforms.calibrate = _appstate.bgtex; //XXX

        mesh.uniforms.uHatchWidth = params.hatch_width;
        mesh.uniforms.uHatchSpacing = params.hatch_spacing;
        mesh.uniforms.uHatchRot = params.hatch_rot;
        mesh.uniforms.uShellWidth = params.shell_width;
        mesh.uniforms.uAspect = screen.camera.aspect;
        mesh.uniforms.uZ = z;
        mesh.uniforms.uHatchOff = hatchoff;

        if (typeof _appstate !== "undefined") {
          mesh.uniforms.uWinSize = [screen.canvas.width, screen.canvas.height];
        }

        for (var island of mesh.islands) {
          screen.camera.bind(island.uniforms);
          island.uniforms.calibrate = _appstate.bgtex; //XXX
        }
      }

      var dohatch = params.dohatch;
      dohatch = dohatch && this.slicei < this.totslice-5;
      
      if (dohatch) {//} && stage != this.totstage-1) {
        params.hatch_spacing = params.totstage == 1 ? 0.0 : 1.0/(params.totstage-1);
        this.stencilmesh.islands[0].program = gl.hatch_shader;
      } else {
        this.stencilmesh.islands[0].program = gl.simple_shader;
      }

      //XXX
      //this.stencilmesh.uniforms.uFrame = _appstate.frame;

      this.stencilmesh.uniforms.calibrate = _appstate.bgtex; //XXX
      this.stencilmesh.islands[1].program = gl.simple_shader;
      this.stencilmesh.program = gl.hatch_shader;

      setUniforms(this.stencilmesh);

      gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.DEPTH_TEST);

      this.stencilmesh.islands[1].draw(gl);

      if (boundary_only || skipinfill) {
        return;
      }

      this.stencilmesh.uniforms.alpha = 0.0;
      
      gl.clearStencil(0);
      gl.clear(gl.STENCIL_BUFFER_BIT);
      
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.STENCIL_TEST);
      
      gl.stencilMask(255);
      
      gl.stencilFunc(gl.NOTEQUAL, 128, 255);
      gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);
              
      this.stencilmesh.draw(gl);
      
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      gl.stencilFunc(gl.EQUAL, 2, 3);
      
      gl.enable(gl.DEPTH_TEST);
      
      //gl.disable(gl.STENCIL_TEST);
      gl.enable(gl.BLEND);

      var b = params.brightness;
      this.stencilmesh.uniforms.uColor = [b, b, b];

      this.stencilmesh.uniforms.alpha = 1.0;
      this.stencilmesh.draw(gl);
      
      gl.disable(gl.STENCIL_TEST);
    }
  }
  
  function box(m, v, w) {
    w = w === undefined ? 0.015 : w;
    m.line([v[0]-w, v[1]-w, v[2]], [v[0]-w, v[1]+w, v[2]]);
    m.line([v[0]-w, v[1]+w, v[2]], [v[0]+w, v[1]+w, v[2]]);
    m.line([v[0]+w, v[1]+w, v[2]], [v[0]+w, v[1]-w, v[2]]);
    m.line([v[0]+w, v[1]-w, v[2]], [v[0]-w, v[1]-w, v[2]]);
  }
  
  var SliceSet = exports.SliceSet = class SliceSet {
    constructor(mesh) {
      this.mesh = mesh;
      this.slices = [];
      this.mm = new math.MinMax(3);

      this.buckets = new Array(cconst.TOTBUCKETS);
      for (var i=0; i<this.buckets.length; i++) {
        this.buckets[i] = [];
      }

      this.calcMinMax();
      this.bucketizeTris();

      this.vismesh = new simplemesh.SimpleMesh();
      this.vismesh.loadRender(this.mesh);
      this.vismesh.uniforms.uColor = [0, 0, 0];
      this.vismesh.uniforms.calibrate = _appstate.bgtex; //XXX
    }

    bucketizeTris() {
      console.log("bucketizeTris(). . .");

      var totbucket = this.buckets.length;

      this.forEachTri(function(tri) {
        var minz = Math.min(Math.min(tri[0][2], tri[1][2]), tri[2][2]);
        var maxz = Math.max(Math.max(tri[0][2], tri[1][2]), tri[2][2]);

        minz = (minz - this.mm.min[2]) / (this.mm.max[2] - this.mm.min[2]);
        maxz = (maxz - this.mm.min[2]) / (this.mm.max[2] - this.mm.min[2]);

        minz = ~~(minz*totbucket*0.9999999999);
        maxz = ~~(maxz*totbucket*0.9999999999);

        for (var i=minz; i<=maxz; i++) {
          this.buckets[i].push(tri.index);
        }
      }, this);
    }

    forEachBucketTri(z, cb, thisvar) {
      var bucketz = (z - this.mm.min[2]) / (this.mm.max[2] - this.mm.min[2]);
      bucketz = ~~(bucketz*this.buckets.length*0.99999999);

      var v1 = fet_vs[0], v2 = fet_vs[1], v3 = fet_vs[2];
      var cos = this.mesh.islands[0].tri_cos;

      var bucket = this.buckets[bucketz];

      if (bucket === undefined) {
        _appstate.console.log("Bad Z " + z + " " + bucketz + "!");
        return;
      }

      for (var bi=0; bi<bucket.length; bi++) {
        var i = bucket[bi];
        fet_vs.index = i;

        v1[0] = cos[i++]; v1[1] = cos[i++]; v1[2] = cos[i++];
        v2[0] = cos[i++]; v2[1] = cos[i++]; v2[2] = cos[i++];
        v3[0] = cos[i++]; v3[1] = cos[i++]; v3[2] = cos[i++];

        cb.call(thisvar, fet_vs);
      }
    }

    forEachTri(cb, thisvar, z) {
      var v1 = fet_vs[0], v2 = fet_vs[1], v3 = fet_vs[2];
      var cos = this.mesh.islands[0].tri_cos;

      for (var i=0; i<cos.length; ) {
        fet_vs.index = i;

        v1[0] = cos[i++]; v1[1] = cos[i++]; v1[2] = cos[i++];
        v2[0] = cos[i++]; v2[1] = cos[i++]; v2[2] = cos[i++];
        v3[0] = cos[i++]; v3[1] = cos[i++]; v3[2] = cos[i++];

        cb.call(thisvar, fet_vs);
      }
    }

    //flip edges to follow dominant winding
    //so polygon draw algorithms work properly
    order_edges(slice) {
      var visit = new util.set();
      var evisit = new util.set();
      var newedges = [];

      for (var v of slice.verts) {
        if (visit.has(v) || v.edges.length == 0) {
          continue;
        }

        var loop = [], eloop=[];

        visit.add(v);

        var e2 = v.edges[0];
        var v2 = e2.v1;
        var _i = 0;
        var wind = 0;
        var cent = new Vector3();
        var totcent=0;

        do {
          cent.add(v2);
          totcent++;
          loop.push(v2);
          eloop.push(e2);

          if (v2 !== e2.v1) {
            slice.flip_edge(e2);
          }

          if (v2.edges.length != 2) {
            _appstate.console.trace("WARNING: nonmanifold geometry detected");
            break;
          }

          if (_i++ > 10000) {
            _appstate.console.log("infinite loop detected!");
            break;
          }

          visit.add(v2);

          v2 = e2.other_vertex(v2);

          if (v2.edges.length != 2) {
            //_appstate.console.log("eek! non-manifold vertex?", v2.edges.length, v2);
            break;
          }
          e2 = v2.other_edge(e2);
        } while (v2 !== v);

        if (totcent == 0)
          continue;

        //calculate winding
        cent.divScalar(totcent);

        for (var i=1; i<loop.length-1; i++) {
          var v1 = loop[i], v2 = loop[(i+1)%loop.length];

          wind += math.winding(loop[0], v1, v2) ? 1 : -1;
        }

        //enforce winding
        if (wind > 0) {
          //flip
          for (e of eloop) {
            slice.flip_edge(e);
          }

          eloop.reverse();
        }

        for (var e of eloop) {
          newedges.push(e);
        }
      }

      this.edges = newedges;
    }

    make_boundary(slice) {
      var v1 = new Vector3(), v2 = new Vector3(), v3 = new Vector3(), v4 = new Vector3();
      var n1 = new Vector3(), n2 = new Vector3();
      var width = _appstate.params.shell_width;

      var tgmin = new Vector3(this.mm.min).subScalar(15.0);
      var tgmax = new Vector3(this.mm.max).addScalar(15.0);
      slice.trigrid = new trigrid.TriGrid(tgmin, tgmax);

      var island = slice.stencilmesh.islands[1];

      var laste = slice.edges[slice.edges.length-1];
      var inv = 0, tidx = 0;

      for (var e of slice.edges) {
        v1.load(e.v1);
        v2.load(e.v2);

        if (e.v1.edges.length != 2 || e.v2.edges.length != 2) {
          _appstate.console.log("Warning: slice is not 1-manifold");
          laste = e;
          continue;
        }

        var e1 = e.v1.other_edge(e);
        var e2 = e.v2.other_edge(e);

        /*
        e1.no.load(e1.v2).sub(e1.v1).normalize();
        var t = e1.no[0]; e1.no[0] = e1.no[1]; e1.no[1] = t;
        e2.no.load(e2.v2).sub(e2.v1).normalize();
        var t = e2.no[0]; e2.no[0] = e2.no[1]; e2.no[1] = t;
        //*/

        if (e1 === undefined || e2 === undefined) {
          _appstate.console.log("eek!");

          n1.load(e.no).mulScalar(width);
          n2.load(n.no).mulScalar(width);
        } else {
          n1 = math.corner_normal(e1.no, e.no, width);
          n2 = math.corner_normal(e.no, e2.no, width);

          /*
          var lv1 = e1.v1, lv2 = e.v1, lv3 = e.v2, lv4 = e2.v2;
          var w1 = e1.no[0]*e.no[1] - e1.no[1]*e.no[0];
          var w2 = e.no[0]*e2.no[1] - e.no[1]*e2.no[0];

          if (w1 >= 0) {
            e1.no.negate(), e.no.negate();
            n1 = math.corner_normal(e1.no, e.no, width);
            e1.no.negate(), e.no.negate();
          } else {
            n1 = math.corner_normal(e1.no, e.no, width);
          }

          if (w2 >= 0) {
            e2.no.negate(), e.no.negate();
            n2 = math.corner_normal(e.no, e2.no, width);
            e2.no.negate(), e.no.negate();
          } else {
            n2 = math.corner_normal(e.no, e2.no, width);
          }//*/
        }

        v1.load(e.v1);
        v2.load(e.v2);
        v3.load(e.v2).sub(n2);
        v4.load(e.v1).sub(n1);

        slice.trigrid.add(v1, v2, v3, tidx), tidx += 9;
        slice.trigrid.add(v1, v3, v4, tidx), tidx += 9;

        island.tri(v1, v2, v3);
        island.tri(v1, v3, v4);
        laste = e;
      }
    }
    //make fan for drawing complex
    //polygons via stencil buffer
    make_fan(slice) {
      var vm = slice.stencilmesh;

      slice.mm.reset();
      for (var v of slice.verts) {
        slice.mm.minmax(v);
      }

      var start = new Vector3(slice.mm.min);
      start.subScalar(1000.023424);
      start[2] = slice.z;

      for (var e of slice.edges) {
        vm.tri(start, e.v1, e.v2);
        /*
        vm.line(start, e.v1, e.v2);
        vm.line(e.v1, e.v2, start);
        vm.line(e.v2, start, e.v1);
        //*/
      }
    }

    close_loops(slice) {
      var dellist = [];
      var ignore = new util.set();

      for (var v1 of slice.verts) {
        if (ignore.has(v1))
          continue;

        if (v1.edges.length == 0) {
          _appstate.console.log("warning, isolated vertex");
          dellist.push(v1);
        } else if (v1.edges.length == 1) {
          _appstate.console.log("open loop!");
          var v2 = v1, e2 = v1.edges[0];

          var _i = 0;

          while (1) {
            v2 = e2.other_vertex(v2);

            if (_i++ > 100000) {
              console.log("infinite loop detected");
              break; //eek!
            }

            if (v2.edges.length == 2) {
              e2 = v2.other_edge(e2);
            } else {
              break;
            }
          }

          if (v1 === v2 || e2 == v1.edges[0]) {
            _appstate.console.log("eek!! error in close_loops()!");
            continue;
          }

          var ps = slice.isect_edges(v1, v2);

          if (!ps) {
            slice.make_edge(v1, v2);
          } else { //eek, intersection!
            //_appstate.console.log("ISECT!", ps);
            for (var si=0; si<2; si++) {
              var mindis = 1e17;
              var minp = undefined;
              var v = si ? v2 : v1;

              for (var i=0; i<ps.length; i++) {
                var p = ps[i];

                var dis = p.vectorDistance(v);

                if (minp === undefined || dis < mindis) {
                  mindis = dis;
                  minp = p;
                }
              }

              minp = slice.make_vertex(minp);
              ignore.add(minp);

              slice.make_edge(v, minp);
              //console.log("MINP", minp)
            }

            ignore.add(v1);
            ignore.add(v2);
          }
          //console.log("v1, v2:", v1, v2);
        }
      }

      for (var v of dellist) {
        slice.kill_vertex(v);
      }
    }

    collapse_zero_edges(slice) {
      for (var e of slice.edges) {
        if (e.v1.vectorDistance(e.v2) > 0.001) {
          continue;
        }

        _appstate.console.log("zero-length edge!");

        var v1 = e.v1, v2 = e.v2;

        slice.kill_edge(e);

        //merge v1 and v2
        for (var e2 of v2.edges) {
          if (e2.v1 === v2) {
            e2.v1 = v1;
          } else {
            e2.v2 = v1;
          }

          v1.edges.push(v1);
        }

        //make sure kill_vertex doesn't destroy edges too
        v2.edges = [];

        slice.kill_vertex(v2);
      }
    }

    make_support(i1, i2, p) {
      var ssize = _appstate.params.supportsize*0.5; //convert from diameter to radius
      var slice;

      var _tri = [0, 0, 0], this2 = this;
      function circle(mesh, p, r, z) {
        var steps = 6, t = -Math.PI, dt = (Math.PI*2.0) / steps;
        var vs = [];

        for (var i=0; i<steps; i++, t += dt) {
          var x = Math.cos(t)*r + p[0];
          var y = Math.sin(t)*r + p[1];

          vs.push([x, y, z]);
        }

        for (var i=1; i<vs.length-1; i++) {
          var i2 = (i+1) % vs.length;

          mesh.tri(vs[0], vs[i], vs[i2]);

          _tri[0] = vs[0];
          _tri[1] = vs[1];
          _tri[2] = vs[2];

          for (var j=0; j<3; j++) {
            for (var k=0; k<3; k++) {
              slice.support_tris.push(_tri[j][k]);
            }
          }

          slice.trigrid.add(_tri, 0);
        }
      }

      for (var i=i1; i<i2; i++) {
        slice = this.slices[i];

        circle(slice.stencilmesh, p, ssize, slice.z);
      }
    }

    make_supports() {
      var slices = this.slices;

      for (var slice of slices) {
        slice.stencilmesh.setIsland(1);
      }

      function check(i, p) {
        var starti = i;

        i--;
        while (i > 0) {
          if (slices[i].pointFilled(p)) {
            break;
          }
          i--;
        }

        return i;
      }

      var p = new Vector3();

      var this2 = this;
      function* support_task() {
        for (var i=0; i<slices.length; i++) {
          yield i;

          var slice = slices[i];

          _appstate.console.log("making supports for slice " + (i+1) + " of " + slices.length);

          //for (var j=0; j<slice.verts.length; j++) {
          for (var e of slice.edges) {
            //var v1 = slice.verts[j], v2 = slice.verts[(j+1)%slice.verts.length];
            var v1 = e.v1, v2 = e.v2;

            var dis = (v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]);
            dis = dis != 0.0 ? Math.sqrt(dis) : 0.0;

            var steps = ~~(1 + dis / 0.7);
            var t = 0, dt = 1.0 / steps;

            for (var k = 0; k < steps; k++, t += dt) {
              p.load(v1).interp(v2, t);

              var endi = check(i, p);

              if (endi < i - 1) {
                this2.make_support(endi, i, p);
              }
            }
          }
        }

        for (var slice of slices) {
          slice.stencilmesh.setIsland(0);
        }
      }

      return support_task();
    }

    sliceone(z, thickness, slicei, totslice) {
      var vismesh = this.vismesh;
      var slice = new Slice(z, thickness, slicei, totslice);
      this.slices.push(slice);

      this.find_edges(z, slice);
      this.remove_doubles(slice);
      this.order_edges(slice);
      this.collapse_zero_edges(slice);

      //for (var v of slice.verts) {
        //console.log(v.edges.length);

        //if (v.edges.length > 1) {
          //box(this.vismesh, v, 0.005*v.edges.length);
        //}
      //}

      this.close_loops(slice);

      this.make_fan(slice);
      this.make_boundary(slice);

      for (var e of slice.edges) {
        this.vismesh.line(e.v1, e.v2);
      }

      //set stencilmesh and copy gl parameters from this.mesh
      slice.stencilmesh.loadRender(this.mesh);
      this.stencilmesh = slice.stencilmesh;

      for (var e of slice.edges) {
        this.vismesh.line(e.v1, e.v2);
      }

      return slice;
    }

    remove_doubles(slice) {
      var size = 64;
      var vmap = new util.hashtable();
      var newslice = new Slice(slice.z, slice.thickness, slice.slicei, slice.totslice);

      var fac = Math.max(Math.max(slice.size[0], slice.size[1]), slice.size[2]);
      var threshold = 0.005;

      var visit = new Uint8Array(slice.eidgen._cur);
      visit.fill(0, 0, visit.length);

      for (var v1 of slice.verts) {
        var nv1 = undefined;

        if (visit[v1.eid])
          continue;

        for (var v2 of slice.verts) {
          if (v1 === v2 || visit[v2.eid]) {
            continue;
          }

          var dis = Vector2.prototype.vectorDistance.call(v1, v2); //v1.vectorDistance(v2);

          if (dis <= threshold) {
            if (nv1 === undefined) {
              nv1 = newslice.make_vertex(v1);
            }

            visit[v2.eid] = 1;
            vmap.set(v2, nv1);
          }
        }

        if (nv1 !== undefined) {
          visit[v1.eid] = 1;
          vmap.set(v1, nv1);
        }
      }

      for (var v of slice.verts) {
        if (!vmap.has(v)) {
          vmap.set(v, newslice.make_vertex(v));
        }
      }

      for (var e1 of slice.edges) {
        var v1 = vmap.get(e1.v1), v2 = vmap.get(e1.v2);

        if (v1 === v2) {
          continue;
        }

        var e2 = newslice.make_edge(v1, v2);
      }

      slice.load(newslice);
    }

    find_edges(z, slice) {
      var v1 = new Vector3(), v2 = new Vector3();
      var p1 = new Vector3(), p2 = new Vector3(), p3 = new Vector3(), p4 = new Vector3();
      var z = slice.z, thickness = slice.thickness;

      function axisisect(a, b) {
        var div = (a[2] - z) - (b[2] - z);

        if (div === 0) {
          return 0.0;
        }

        return (a[2] - z) / div;
      }

      this.forEachBucketTri(z, function(vs) {
        var bits = 0;
        bits += vs[0][2] <= z;
        bits += vs[1][2] <= z;
        bits += vs[2][2] <= z;

        var inside = vs[0][2] <= z;
        inside |= (vs[1][2] <= z)<<1;
        inside |= (vs[2][2] <= z)<<2;

        if (bits != 1 && bits != 2) {
          return;
        }

        /*
          0

        1   2
        */

        switch (inside) {
          /*
            1

          0   0
          */
          case 1:
            v1.load(vs[0]).interp(vs[1], axisisect(vs[0], vs[1]));
            v2.load(vs[0]).interp(vs[2], axisisect(vs[0], vs[2]));
            break;
          /*
            0

          1   0
          */
          case 2:
            v1.load(vs[1]).interp(vs[0], axisisect(vs[1], vs[0]));
            v2.load(vs[1]).interp(vs[2], axisisect(vs[1], vs[2]));
            break;
          /*
            0

          0   1
          */
          case 4:
            v1.load(vs[2]).interp(vs[0], axisisect(vs[2], vs[0]));
            v2.load(vs[2]).interp(vs[1], axisisect(vs[2], vs[1]));
            break;
          /*
            0

          1   1
          */
          case 6:
            v1.load(vs[0]).interp(vs[1], axisisect(vs[0], vs[1]));
            v2.load(vs[0]).interp(vs[2], axisisect(vs[0], vs[2]));
            break;
          /*
            1

          1   0
          */
          case 3:
            v1.load(vs[2]).interp(vs[0], axisisect(vs[2], vs[0]));
            v2.load(vs[2]).interp(vs[1], axisisect(vs[2], vs[1]));
            break;
          /*
            1

          0   1
          */
          case 5:
            v1.load(vs[1]).interp(vs[0], axisisect(vs[1], vs[0]));
            v2.load(vs[1]).interp(vs[2], axisisect(vs[1], vs[2]));
            break;
        }

        var sv1 = slice.make_vertex(v1);
        var sv2 = slice.make_vertex(v2);

        slice.make_edge(sv1, sv2);

        this.vismesh.line(sv1, sv2);

        if (bits == 1 || bits == 2) {
          //console.log("inside: ", inside);

          /*
          this.vismesh.line(vs[0], vs[1]);
          this.vismesh.line(vs[1], vs[2]);
          this.vismesh.line(vs[2], vs[0]);
          //*/
        }

        //find slice min/max
        slice.mm.reset();

        for (var v of slice.verts) {
          slice.mm.minmax(v);
        }

        slice.mm.min = new Vector3(slice.mm.min);
        slice.mm.max = new Vector3(slice.mm.max);
        slice.cent.load(slice.mm.min).add(slice.mm.max).mulScalar(0.5);
        slice.size.load(slice.mm.max).sub(slice.mm.min);
      }, this);
    }

    calcMinMax() {
      var mm = this.mm = new math.MinMax(3);

      this.forEachTri(function(vs) {
        mm.minmax(vs[0]);
        mm.minmax(vs[1]);
        mm.minmax(vs[2]);
      }, this);
    }

    slice(z, thickness, slicei, totslice) {
      z = z === undefined ? 0.0 : z;

      return this.sliceone(z, thickness, slicei, totslice);
    }

    destroy() {
      for (var slice of this.slices) {
        slice.destroy();
      }

      this.vismesh.destroy();
    }

    vis() {
      return this.vismesh;
    }
    
    stencil() {
      return this.stencilmesh;
    }
    
    draw(screen, params, gl, stage, skipinfill) {
      for (var slice of this.slices) {
        slice.draw(screen, params, gl, stage, skipinfill);
      }
    }
  }
  
  var fet_vs = [new Vector3(), new Vector3(), new Vector3()];

  exports.forEachSlice = function(mesh, cb, thisvar) {
    var thickness = _appstate.params.thickness;
    var z = 0.0;

    var sset = new SliceSet(mesh);

    var mm = new math.MinMax(3);
    sset.forEachTri(function(vs) {
      mm.minmax(vs[0]);
      mm.minmax(vs[1]);
      mm.minmax(vs[2]);
    });

    var z1 = mm.min[2], z2 = mm.max[2];
    var steps = ~~((z2 - z1) / thickness);
    var z = z1, dz = (z2-z1) / (steps-1);

    var accept, reject;
    var promise = new Promise(function(accept2, reject2) {
      accept = accept2;
      reject = reject2;
    });

    //supports require information on frames in the future, so
    //slice 'em all, then do callback
    if (_appstate.params.dosupport) {
      for (var i=0; i<steps; i++, z += dz) {
        _appstate.console.log("slice", i + 1, "of", steps);
        sset.slice(z, thickness, i, steps);
      }

      _appstate.jobs.run(sset.make_supports(), "slicer").then(function() {
        for (var i=0; i<steps; i++) {
          cb.call(thisvar, sset.slices[i]);
        }
        accept(sset);
      });
    } else {
      //exec callback as slicing happpens
      function* task() {
        for (var i=0; i<steps; i++, z += dz) {
          yield;

          _appstate.console.log("slice", i + 1, "of", steps);
          cb.call(thisvar, sset.slice(z, thickness, i, steps));
        }
      }

      _appstate.jobs.run(task(), "slicer").then(function() {
        accept(sset);
      });
    }

    return promise;
  }

  //thickness defaults to 0.1
  exports.slice = function(z, mesh) {
    var thickness = _appstate.params.thickness;
    z = z === undefined ? 0.0 : z;
    
    var sset = new SliceSet(mesh);
    
    var mm = new math.MinMax(3);
    sset.forEachTri(function(vs) {
      mm.minmax(vs[0]);
      mm.minmax(vs[1]);
      mm.minmax(vs[2]);
    });
    
    var z1 = mm.min[2], z2 = mm.max[2];
    var steps = ~~((z2 - z1) / thickness);
    var z = z1, dz = (z2-z1) / (steps-1);
    
    console.log("steps:", steps, z1, z2);

    var accept, reject;
    var promise = new Promise(function(accept2, reject2) {
      accept = accept2;
      reject = reject2;
    });


    function* task() {
      for (var i=0; i<steps; i++, z += dz) {
        yield;

        if (i % 5 == 0) {
          _appstate.console.log("slice", i + 1, "of", steps);
        }

        sset.slice(z, thickness, i, steps);
      }
    }

    _appstate.jobs.run(task(), "slicer").then(function() {
      _appstate.jobs.run(sset.make_supports(), "slicer").then(function() {
        accept(sset);
      });
    });

    return promise;
  };
  
  return exports;
});
