var _stl = undefined;

define([
  "util", "vectormath", "math", "simplemesh", "webgl", "parseutil"
], function(util, vectormath, math, simplemesh, webgl, parseutil) {
  "use strict";

  var exports = _stl = {};

  var Vector3 = vectormath.Vector3;

  var _ret = [];

  var fne_set = ['+', '-', 'e', 'E', '.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  var tmp = {};
  for (var i=0; i<fne_set.length; i++) {
    tmp[fne_set[i]] = 1;
  }
  fne_set = tmp;
  window.fne_set = fne_set;

  var _fne_ret = {
    index : 0,
    0 : "",
    length : 1
  };

  function fast_num_exp(str) {

    for (var i=0; i<str.length; i++) {
      if (!(str[i] in fne_set)) {
        break;
      }
    }

    if (i == 0)
      return undefined;

    var ret = _fne_ret;

    ret.index = 0;
    ret[0] = str.slice(0, i);
    ret.length = 1;

    if (isNaN(parseFloat(ret[0]))) {
      return undefined; //final check
    }

    return ret;
  }
  window.fast_num_exp = fast_num_exp;

  var makeparser = function parser() {
    function tf(name, regexp, callback) {
      return new parseutil.tokdef(name, regexp, callback);
    }

    var tokens = [
      tf("SOLID", /solid([ \t]?.*?((\n)|(\r\n)))?/),
      tf("ENDSOLID", /endsolid([ \t]?.*?((\n)|(\r\n)))?/),
      tf("FACET", /facet/),
      tf("OUTER", /outer/),
      tf("LOOP", /loop/),
      tf("VERTEX", /vertex/),
      tf("ENDLOOP", /endloop/),
      tf("ENDFACET", /endfacet/),

      /*
      tf("NUM_EXP", undefined, undefined, fast_num_exp, function(t) {
        t.value = parseFloat(t.value);
        t.type = "NUM";

        return t;
      }),
      //*/

      /*//attempt at a faster one
      tf("NUM_EXP", /[0-9+-.]+[eE][0-9+-.]+/, function(t) {
        t.value = parseFloat(t.value);
        t.type = "NUM";

        return t;
      }),
      //*/

      /*original
      tf("NUM_EXP", /[+-]?[0-9]*\.e[+-]?[0-9]+/, function(t) {
        t.value = parseFloat(t.value);
        t.type = "NUM";

        return t;
      }),//*/
      //*
      /*tf("NUM_INT", /([+-]?[0-9]+)/, function(t) {
        t.value = parseInt(t.value);//(?!\.)
        t.type = "NUM";
        return t;
      }),//*/
      //*
      tf("NUM", /[\-\+]?[0-9]+([0-9\+\-\.eE]*)/, function(t) {
        t.value = parseFloat(t.value);
        t.type = "NUM";

        return t;
      }),//*/
      //tf("ID", /[a-zA-Z_$]+[a-zA-Z0-0_$]*/),
      tf("NORMAL", /normal/),
      tf("WS", /[ \t]+/, function(t) {
        //drop token by not returning it
      }),
      tf("NL", /[\n\r]+/, function(t) {
        for (var i=0; i<t.value.length; i++) {
          if (t.value[i] == "\n") {
            t.lexer.lineno++;
          }
        }

        return t;
      })
    ];

    var lexer = new parseutil.lexer(tokens, function(t) {
      console.log("syntax error!", t, "\n");
    });

    var mesh = undefined;
    var n = new Vector3();
    var vs = [new Vector3(), new Vector3(), new Vector3()];
    var lastprint = util.time_ms();
    var _j = 0;

    function p_Facet(p) {
      p.expect("FACET");

      if (p.peeknext().value == "normal") {
        p.next();

        n[0] = p.expect("NUM");
        n[1] = p.expect("NUM");
        n[2] = p.expect("NUM");
      } else {
        n.zero();
        n[2] = 1;
      }

      p.expect("NL");
      p.expect("OUTER"), p.expect("LOOP"), p.expect("NL");

      vs.used = 0;

      while (!p.at_end() && p.peek_i(0).type != "ENDLOOP") {
        //console.log(p.peeknext())
        p.expect("VERTEX");

        if (vs[vs.used] === undefined) {
          vs.length = Math.max(vs.length, vs.used+1);
          vs[vs.used] = new Vector3();
        }

        var v = vs[vs.used];

        v[0] = p.expect("NUM");
        //if (p.peek_i(0) == undefined || p.peek_i(0).type != "NUM") {
        //  console.log("eek! p.peek_i(0):", p.peek_i(0), p, p.lexer, p.lexer.lexdata.length);
        //}

        v[1] = p.expect("NUM");
        v[2] = p.expect("NUM");

        vs.used++;

        p.expect("NL");
      }

      if (util.time_ms() - lastprint > 500) {
        console.log(_j, "vs length: " + vs.used);
        lastprint = util.time_ms();
      }

      if (vs.used == 3) {
        /*
        mesh.line(vs[0], vs[1]);
        mesh.line(vs[1], vs[2]);
        mesh.line(vs[2], vs[0]);
        */

        var tri = mesh.tri(vs[0], vs[1], vs[2]);
        tri.normals(n, n, n);
      } else {
        console.log("eek! non-triangle detected!");
      }

      _j++;

      p.expect("ENDLOOP"), p.expect("NL");
      p.expect("ENDFACET"), p.expect("NL");
    }

    function p_Solid(p) {
      var name = p.expect("SOLID"); //solid consumes newline
      p.optional("NL")

      var _i = 0;
      while (!p.at_end()) {
        var t = p.peeknext();

        if (t.type == "FACET") {
          p_Facet(p);
        } else {
          break;
        }

        if (_i++ > 11) {
        //  break; //XXX
        }
      }

      p.expect("ENDSOLID");
      p.optional("NL");
    }

    function p_Root(p) {
      mesh = new simplemesh.SimpleMesh();

      console.log("root!\n");

      while (!p.at_end()) {
        p_Solid(p);

        break; //XXX
      }

      return mesh;
    }

    var p = new parseutil.parser(lexer, function(t) {
      console.log("error:", t);
      throw new Error(""+t);
    });

    p.start = p_Root;

    return p;
  }

  var parser = exports.parser = makeparser();

  var load_ascii = exports.load_ascii = function(buf, print_tokens) {
    console.log("ascii!");

    if (!buf.endsWith("\n")) {
      buf += "\n"
    }

    parser.print_tokens = print_tokens;

    if (print_tokens) {
      var s = "\nTokens:\n\n";
      var l = parser.lexer;

      l.input(buf);
      var t = l.next();
      while (t !== undefined) {
        s += "\t" + t.type + ": " + t.value + "\n";
        t = l.next();
      }

      console.log(s);
    }

    return parser.parse(buf);
  }


  var load_binary = exports.load_binary = function(arraybuffer) {
    console.log("binary!");

    var mesh = new simplemesh.SimpleMesh();

    var dview = new DataView(arraybuffer);
    var _cur = 0;

    var endian = true;

    function read_bytes(n) {
      _cur += n;
      return new Uint8Array(dview.buffer.slice(_cur - n, _cur));
    }

    function read_int() {
      _cur += 4;
      return dview.getInt32(_cur-4, endian);
    }

    function read_short() {
      _cur += 2;
      return dview.getUint16(_cur-2, endian);
    }

    function read_float() {
      _cur += 4;
      return dview.getFloat32(_cur-4, endian);
    }

    function read_vec3() {
      var ret = new Vector3();

      ret[0] = read_float();
      ret[1] = read_float();
      ret[2] = read_float();

      return ret;
    }

    var header = read_bytes(80);
    var tottri = read_int();

    console.log("tottri: ", tottri);

    for (let i=0; i<tottri; i++) {
      if (_cur + 12*4+2 >= dview.buffer.byteLength) {
        console.log("Truncated STL file");
        break;
      }

      var n = read_vec3();

      var v1 = read_vec3();
      var v2 = read_vec3();
      var v3 = read_vec3();

      var attrsize = read_short();

      var tri = mesh.tri(v1, v2, v3);
      tri.normals(n, n, n);
    }

    return mesh;
  }

  var load_stl = exports.load_stl = function(buf, print_tokens) {
    var str;
    if (typeof buf != "string") {
      str = ""

      var ubuf = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;

      for (var i = 0; i < ubuf.length; i++) {
        str += String.fromCharCode(ubuf[i]);
      }
    } else {
      str = buf;
    }

    if (str.startsWith("solid ")) {
      return load_ascii(str, print_tokens);
    } else {
      if (typeof buf == "string") {
        var buf2 = new Uint8Array(buf.length);

        for (var i = 0; i < buf.length; i++) {
          buf2[i] = buf.charCodeAt(i);
        }

        buf = buf2.buffer;
      } else if (!(buf instanceof ArrayBuffer) && buf.buffer !== undefined) {
        buf = buf.buffer;
      } else if (Array.isArray(buf)) {
        buf = new Uint8Array(buf).buffer;
      }

      return load_binary(buf);
    }
  }

  return exports;
});
