//WARNING: AUTO-GENERATED FILE! DO NOT EDIT!
var _vectormath = undefined; //for debugging purposes only

define(['util', 'matrixmath'], function(util, matrixmath) {
  'use strict';

  var exports = _vectormath = {};

  //forward matrix exports
  for (var k in matrixmath) exports[k] = matrixmath[k];

  var sqrt=Math.sqrt, PI=Math.PI, sin=Math.sin, cos=Math.cos, asin=Math.asin, acos=Math.acos, atan = Math.atan,  atan2=Math.atan2;
  var floor=Math.floor, ceil=Math.ceil, min=Math.min, max=Math.max, fract = function(f) { return f - Math.floor(f);};

  var Vector2 = exports.Vector2 = class Vector2 extends Array {
    constructor(b) {
      super(2);
      this.length = 2;
  
      if (b !== undefined) this.load(b);
      else this.zero();
    }
  
    load(b) {
      if (b === undefined) return this;
  
      this[0] = b[0];
      this[1] = b[1];
  
      return this;
    }
  
    vectorDotDistance(b) {
      var d0 = this[0]-b[0];
      var d1 = this[1]-b[1];
      return (d0*d0 + d1*d1);
    };
  
    vectorDistance(b) {
      var d0 = this[0]-b[0];
      var d1 = this[1]-b[1];
      return sqrt(d0*d0 + d1*d1);
    };
  
    vectorLength() {
      var dot = this[0]*this[0] + this[1]*this[1];
  
      return dot != 0.0 ? Math.sqrt(dot) : 0.0;
    }
  
    normalize() {
      var dot = this[0]*this[0] + this[1]*this[1];
  
      if (dot <= 0.000001) return this;
      this.mulScalar(1.0/Math.sqrt(dot));
  
      return this;
    }
  
    normalizedDot(b) {
      var l1 = this[0]*this[0] + this[1]*this[1]
      var l2 = b[0]*b[0] + b[1]*b[1]
      
      l1 = l1 != 0.0 ? Math.sqrt(l1) : 0.0;
      l2 = l2 != 0.0 ? Math.sqrt(l2) : 0.0;
      l1 = l1 == 0.0 ? 1.0 : 1.0 / l1;
      l2 = l2 == 0.0 ? 1.0 : 1.0 / l2;
      
      return (this[0]*b[0] + this[1]*b[1])*l1*l2;
    }
  
    dot(b) {
      return this[0]*b[0] + this[1]*b[1];
    }
  
    zero() {
      this[0] = 0.0;
      this[1] = 0.0;
      return this;
    }
  
    negate() {
      this[0] = -this[0];
      this[1] = -this[1];
      return this;
    }
  
    combine(b, u, v) {
      this[0] = this[0]*u + this[0]*v;
      this[1] = this[1]*u + this[1]*v;
      return this;
    }
  
    interp(b, t) {
      this[0] = this[0] + (b[0] - this[0])*t;
      this[1] = this[1] + (b[1] - this[1])*t;
      return this;
    }
  
    add(b) {
      this[0] = this[0] + b[0];
      this[1] = this[1] + b[1];
      return this;
    }
  
    addFac(b, f) {
      this[0] = this[0] + b[0]*f;
      this[1] = this[1] + b[1]*f;
      return this;
    }
  
    fract() {
      this[0] = Math.fract(this[0]);
      this[1] = Math.fract(this[1]);
      return this;
    }
  
    sub(b) {
      this[0] = this[0] - b[0];
      this[1] = this[1] - b[1];
      return this;
    }
  
    mul(b) {
      this[0] = this[0] * b[0];
      this[1] = this[1] * b[1];
      return this;
    }
  
    div(b) {
      this[0] = this[0] / b[0];
      this[1] = this[1] / b[1];
      return this;
    }
  
    mulScalar(b) {
      this[0] = this[0] * b;
      this[1] = this[1] * b;
      return this;
    }
  
    divScalar(b) {
      this[0] = this[0] / b;
      this[1] = this[1] / b;
      return this;
    }
  
    addScalar(b) {
      this[0] = this[0] + b;
      this[1] = this[1] + b;
      return this;
    }
  
    subScalar(b) {
      this[0] = this[0] - b;
      this[1] = this[1] - b;
      return this;
    }
  
    ceil() {
      this[0] = Math.ceil(this[0])
      this[1] = Math.ceil(this[1])
      return this;
    }
  
    floor() {
      this[0] = Math.floor(this[0])
      this[1] = Math.floor(this[1])
      return this;
    }
  
    abs() {
      this[0] = Math.abs(this[0])
      this[1] = Math.abs(this[1])
      return this;
    }
  
    min() {
      this[0] = Math.min(this[0])
      this[1] = Math.min(this[1])
      return this;
    }
  
    max() {
      this[0] = Math.max(this[0])
      this[1] = Math.max(this[1])
      return this;
    }
  
    clamp(min, max) {
      this[0] = min(max(this[0], max), min)
      this[1] = min(max(this[1], max), min)
      return this;
    }
  
    rot2d(th) {
      var x = this[0];
      var y = this[1];
  
      if (axis == 1) {
        this[0] = x * cos(A) + y*sin(A);
        this[1] = y * cos(A) - x*sin(A);
      } else {
        this[0] = x * cos(A) - y*sin(A);
        this[1] = y * cos(A) + x*sin(A);
      }
    
      return this;
    }
  
  }
  var Vector3 = exports.Vector3 = class Vector3 extends Array {
    constructor(b) {
      super(3);
      this.length = 3;
  
      if (b !== undefined) this.load(b);
      else this.zero();
    }
  
    load(b) {
      if (b === undefined) return this;
  
      this[0] = b[0];
      this[1] = b[1];
      this[2] = b[2];
  
      return this;
    }
  
    vectorDotDistance(b) {
      var d0 = this[0]-b[0];
      var d1 = this[1]-b[1];
      var d2 = this[2]-b[2];
      return (d0*d0 + d1*d1 + d2*d2);
    };
  
    vectorDistance(b) {
      var d0 = this[0]-b[0];
      var d1 = this[1]-b[1];
      var d2 = this[2]-b[2];
      return sqrt(d0*d0 + d1*d1 + d2*d2);
    };
  
    vectorLength() {
      var dot = this[0]*this[0] + this[1]*this[1] + this[2]*this[2];
  
      return dot != 0.0 ? Math.sqrt(dot) : 0.0;
    }
  
    normalize() {
      var dot = this[0]*this[0] + this[1]*this[1] + this[2]*this[2];
  
      if (dot <= 0.000001) return this;
      this.mulScalar(1.0/Math.sqrt(dot));
  
      return this;
    }
  
    normalizedDot(b) {
      var l1 = this[0]*this[0] + this[1]*this[1] + this[2]*this[2]
      var l2 = b[0]*b[0] + b[1]*b[1] + b[2]*b[2]
      
      l1 = l1 != 0.0 ? Math.sqrt(l1) : 0.0;
      l2 = l2 != 0.0 ? Math.sqrt(l2) : 0.0;
      l1 = l1 == 0.0 ? 1.0 : 1.0 / l1;
      l2 = l2 == 0.0 ? 1.0 : 1.0 / l2;
      
      return (this[0]*b[0] + this[1]*b[1] + this[2]*b[2])*l1*l2;
    }
  
    dot(b) {
      return this[0]*b[0] + this[1]*b[1] + this[2]*b[2];
    }
  
    zero() {
      this[0] = 0.0;
      this[1] = 0.0;
      this[2] = 0.0;
      return this;
    }
  
    negate() {
      this[0] = -this[0];
      this[1] = -this[1];
      this[2] = -this[2];
      return this;
    }
  
    combine(b, u, v) {
      this[0] = this[0]*u + this[0]*v;
      this[1] = this[1]*u + this[1]*v;
      this[2] = this[2]*u + this[2]*v;
      return this;
    }
  
    interp(b, t) {
      this[0] = this[0] + (b[0] - this[0])*t;
      this[1] = this[1] + (b[1] - this[1])*t;
      this[2] = this[2] + (b[2] - this[2])*t;
      return this;
    }
  
    add(b) {
      this[0] = this[0] + b[0];
      this[1] = this[1] + b[1];
      this[2] = this[2] + b[2];
      return this;
    }
  
    addFac(b, f) {
      this[0] = this[0] + b[0]*f;
      this[1] = this[1] + b[1]*f;
      this[2] = this[2] + b[2]*f;
      return this;
    }
  
    fract() {
      this[0] = Math.fract(this[0]);
      this[1] = Math.fract(this[1]);
      this[2] = Math.fract(this[2]);
      return this;
    }
  
    sub(b) {
      this[0] = this[0] - b[0];
      this[1] = this[1] - b[1];
      this[2] = this[2] - b[2];
      return this;
    }
  
    mul(b) {
      this[0] = this[0] * b[0];
      this[1] = this[1] * b[1];
      this[2] = this[2] * b[2];
      return this;
    }
  
    div(b) {
      this[0] = this[0] / b[0];
      this[1] = this[1] / b[1];
      this[2] = this[2] / b[2];
      return this;
    }
  
    mulScalar(b) {
      this[0] = this[0] * b;
      this[1] = this[1] * b;
      this[2] = this[2] * b;
      return this;
    }
  
    divScalar(b) {
      this[0] = this[0] / b;
      this[1] = this[1] / b;
      this[2] = this[2] / b;
      return this;
    }
  
    addScalar(b) {
      this[0] = this[0] + b;
      this[1] = this[1] + b;
      this[2] = this[2] + b;
      return this;
    }
  
    subScalar(b) {
      this[0] = this[0] - b;
      this[1] = this[1] - b;
      this[2] = this[2] - b;
      return this;
    }
  
    ceil() {
      this[0] = Math.ceil(this[0])
      this[1] = Math.ceil(this[1])
      this[2] = Math.ceil(this[2])
      return this;
    }
  
    floor() {
      this[0] = Math.floor(this[0])
      this[1] = Math.floor(this[1])
      this[2] = Math.floor(this[2])
      return this;
    }
  
    abs() {
      this[0] = Math.abs(this[0])
      this[1] = Math.abs(this[1])
      this[2] = Math.abs(this[2])
      return this;
    }
  
    min() {
      this[0] = Math.min(this[0])
      this[1] = Math.min(this[1])
      this[2] = Math.min(this[2])
      return this;
    }
  
    max() {
      this[0] = Math.max(this[0])
      this[1] = Math.max(this[1])
      this[2] = Math.max(this[2])
      return this;
    }
  
    clamp(min, max) {
      this[0] = min(max(this[0], max), min)
      this[1] = min(max(this[1], max), min)
      this[2] = min(max(this[2], max), min)
      return this;
    }
  
    rot2d(th) {
      var x = this[0];
      var y = this[1];
  
      if (axis == 1) {
        this[0] = x * cos(A) + y*sin(A);
        this[1] = y * cos(A) - x*sin(A);
      } else {
        this[0] = x * cos(A) - y*sin(A);
        this[1] = y * cos(A) + x*sin(A);
      }
    
      return this;
    }
  
  }

  var Vector4 = exports.Vector4 = class Vector4 extends Array {
    constructor(b) {
      super(4);
      this.length = 4;
  
      if (b !== undefined) this.load(b);
      else this.zero();
    }
  
    load(b) {
      if (b === undefined) return this;
  
      this[0] = b[0];
      this[1] = b[1];
      this[2] = b[2];
      this[3] = b[3];
  
      return this;
    }
  
    vectorDotDistance(b) {
      var d0 = this[0]-b[0];
      var d1 = this[1]-b[1];
      var d2 = this[2]-b[2];
      var d3 = this[3]-b[3];
      return (d0*d0 + d1*d1 + d2*d2 + d3*d3);
    };
  
    vectorDistance(b) {
      var d0 = this[0]-b[0];
      var d1 = this[1]-b[1];
      var d2 = this[2]-b[2];
      var d3 = this[3]-b[3];
      return sqrt(d0*d0 + d1*d1 + d2*d2 + d3*d3);
    };
  
    vectorLength() {
      var dot = this[0]*this[0] + this[1]*this[1] + this[2]*this[2] + this[3]*this[3];
  
      return dot != 0.0 ? Math.sqrt(dot) : 0.0;
    }
  
    normalize() {
      var dot = this[0]*this[0] + this[1]*this[1] + this[2]*this[2] + this[3]*this[3];
  
      if (dot <= 0.000001) return this;
      this.mulScalar(1.0/Math.sqrt(dot));
  
      return this;
    }
  
    normalizedDot(b) {
      var l1 = this[0]*this[0] + this[1]*this[1] + this[2]*this[2] + this[3]*this[3]
      var l2 = b[0]*b[0] + b[1]*b[1] + b[2]*b[2] + b[3]*b[3]
      
      l1 = l1 != 0.0 ? Math.sqrt(l1) : 0.0;
      l2 = l2 != 0.0 ? Math.sqrt(l2) : 0.0;
      l1 = l1 == 0.0 ? 1.0 : 1.0 / l1;
      l2 = l2 == 0.0 ? 1.0 : 1.0 / l2;
      
      return (this[0]*b[0] + this[1]*b[1] + this[2]*b[2] + this[3]*b[3])*l1*l2;
    }
  
    dot(b) {
      return this[0]*b[0] + this[1]*b[1] + this[2]*b[2] + this[3]*b[3];
    }
  
    zero() {
      this[0] = 0.0;
      this[1] = 0.0;
      this[2] = 0.0;
      this[3] = 0.0;
      return this;
    }
  
    negate() {
      this[0] = -this[0];
      this[1] = -this[1];
      this[2] = -this[2];
      this[3] = -this[3];
      return this;
    }
  
    combine(b, u, v) {
      this[0] = this[0]*u + this[0]*v;
      this[1] = this[1]*u + this[1]*v;
      this[2] = this[2]*u + this[2]*v;
      this[3] = this[3]*u + this[3]*v;
      return this;
    }
  
    interp(b, t) {
      this[0] = this[0] + (b[0] - this[0])*t;
      this[1] = this[1] + (b[1] - this[1])*t;
      this[2] = this[2] + (b[2] - this[2])*t;
      this[3] = this[3] + (b[3] - this[3])*t;
      return this;
    }
  
    add(b) {
      this[0] = this[0] + b[0];
      this[1] = this[1] + b[1];
      this[2] = this[2] + b[2];
      this[3] = this[3] + b[3];
      return this;
    }
  
    addFac(b, f) {
      this[0] = this[0] + b[0]*f;
      this[1] = this[1] + b[1]*f;
      this[2] = this[2] + b[2]*f;
      this[3] = this[3] + b[3]*f;
      return this;
    }
  
    fract() {
      this[0] = Math.fract(this[0]);
      this[1] = Math.fract(this[1]);
      this[2] = Math.fract(this[2]);
      this[3] = Math.fract(this[3]);
      return this;
    }
  
    sub(b) {
      this[0] = this[0] - b[0];
      this[1] = this[1] - b[1];
      this[2] = this[2] - b[2];
      this[3] = this[3] - b[3];
      return this;
    }
  
    mul(b) {
      this[0] = this[0] * b[0];
      this[1] = this[1] * b[1];
      this[2] = this[2] * b[2];
      this[3] = this[3] * b[3];
      return this;
    }
  
    div(b) {
      this[0] = this[0] / b[0];
      this[1] = this[1] / b[1];
      this[2] = this[2] / b[2];
      this[3] = this[3] / b[3];
      return this;
    }
  
    mulScalar(b) {
      this[0] = this[0] * b;
      this[1] = this[1] * b;
      this[2] = this[2] * b;
      this[3] = this[3] * b;
      return this;
    }
  
    divScalar(b) {
      this[0] = this[0] / b;
      this[1] = this[1] / b;
      this[2] = this[2] / b;
      this[3] = this[3] / b;
      return this;
    }
  
    addScalar(b) {
      this[0] = this[0] + b;
      this[1] = this[1] + b;
      this[2] = this[2] + b;
      this[3] = this[3] + b;
      return this;
    }
  
    subScalar(b) {
      this[0] = this[0] - b;
      this[1] = this[1] - b;
      this[2] = this[2] - b;
      this[3] = this[3] - b;
      return this;
    }
  
    ceil() {
      this[0] = Math.ceil(this[0])
      this[1] = Math.ceil(this[1])
      this[2] = Math.ceil(this[2])
      this[3] = Math.ceil(this[3])
      return this;
    }
  
    floor() {
      this[0] = Math.floor(this[0])
      this[1] = Math.floor(this[1])
      this[2] = Math.floor(this[2])
      this[3] = Math.floor(this[3])
      return this;
    }
  
    abs() {
      this[0] = Math.abs(this[0])
      this[1] = Math.abs(this[1])
      this[2] = Math.abs(this[2])
      this[3] = Math.abs(this[3])
      return this;
    }
  
    min() {
      this[0] = Math.min(this[0])
      this[1] = Math.min(this[1])
      this[2] = Math.min(this[2])
      this[3] = Math.min(this[3])
      return this;
    }
  
    max() {
      this[0] = Math.max(this[0])
      this[1] = Math.max(this[1])
      this[2] = Math.max(this[2])
      this[3] = Math.max(this[3])
      return this;
    }
  
    clamp(min, max) {
      this[0] = min(max(this[0], max), min)
      this[1] = min(max(this[1], max), min)
      this[2] = min(max(this[2], max), min)
      this[3] = min(max(this[3], max), min)
      return this;
    }
  
    rot2d(th) {
      var x = this[0];
      var y = this[1];
  
      if (axis == 1) {
        this[0] = x * cos(A) + y*sin(A);
        this[1] = y * cos(A) - x*sin(A);
      } else {
        this[0] = x * cos(A) - y*sin(A);
        this[1] = y * cos(A) + x*sin(A);
      }
    
      return this;
    }
  
  }

  //add matrix methods to vectors
  matrixmath.initVector(Vector2, 2);
  matrixmath.initVector(Vector3, 3);
  matrixmath.initVector(Vector4, 4);

  return exports;
});
