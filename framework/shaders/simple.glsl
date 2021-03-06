//VERTEX
precision highp float;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 normalMatrix;
uniform float iGlobalTime;

attribute vec3  position;
attribute vec3  normal;
attribute vec2  uv;
attribute vec4  color;
attribute float id;

varying vec3 v_Normal;
varying vec2 v_Uv;
varying vec4 v_Color;
varying float v_Id;

float tent(float f) {
  return 1.0 - abs(fract(f)-0.5)*2.0;
}

vec3 tent(vec3 p) {
  return vec3(
    tent(p[0]),
    tent(p[1]),
    tent(p[2])
  );
}

float wave(float f, float time_scale) {
  float fac = 0.05*sin(f+iGlobalTime*5.0*time_scale);
  
  fac = (fac*0.5+0.5);
  fac *= fac*fac*2.5;
  
  return fac;
}

vec3 circwave(vec3 p, vec3 cent, float dis_mul) {
  float dis = length(p-cent)*dis_mul;
  float fac = wave(dis*15.0, 1.0);
  fac -= wave(dis*15.0*4.5, 3.0)*0.2;
  
  p[2] += fac;
  return p;
}

vec3 transform2(vec3 p) {
  vec3 off = circwave(p*0.3, vec3(-20.0,0.0,0.0), -1.0);
  
  vec3 p1 = circwave(p, vec3(-1.0,0.0,0.0), 1.0);
  vec3 p2 = circwave(p, vec3(-3.0, -2.0, 0.0), -1.0);
  p = (p1+p2)*0.5;
  
  p[2] += off[2];
  
  return p;
}

float rand(vec3 p) {
  ///return fract(1.0 / (0.00001 + 0.00001*fract(p[0]+p[1]+p[2])));
  //*
  p = fract(p*0.1) + 0.2 + abs(p)*0.005;
  
  float f = 1.0 / (0.000001*(p[0]*p[0] - p[1]*p[0] + p[2]*p[2] + abs(p[1]) + p[0]*p[2]));
  return fract(f);
  //*/
}

float irand(vec3 p, float sz) {
  p = floor(p/sz)*sz;
  return rand(p);
}

/* comment: find trilinear basis functions;
on factor;
off period;

r1 := k1 + (k2-k1)*v;
r2 := k4 + (k3-k4)*v;
ra := r1 + (r2 - r1)*u;

r1 := k5 + (k6-k5)*v;
r2 := k8 + (k7-k8)*v;
rb := r1 + (r2 - r1)*u;

r := ra + (rb - ra)*w;

on fort;

b1 := df(r, k1);
b2 := df(r, k2);
b3 := df(r, k3);
b4 := df(r, k4);
b5 := df(r, k5);
b6 := df(r, k6);
b7 := df(r, k7);
b8 := df(r, k8);
off fort;

*/
float perlin(vec3 p, float sz) {
  float u = fract(p[0]/sz);
  float v = fract(p[1]/sz);
  float w = fract(p[2]/sz);

  u = u*u*(3.0 - 2.0*u);
  v = v*v*(3.0 - 2.0*v);
  w = w*w*(3.0 - 2.0*w);
  
  /*
  float b1 = -(u-1.0)*(v-1.0)*(w-1.0);
  float b2 = (u-1.0)*(w-1.0)*v;
  float b3 = -(w-1.0)*u*v;
  float b4 = (v-1.0)*(w-1.0)*u;
  float b5 = (u-1.0)*(v-1.0)*w;
  float b6 = -(u-1.0)*v*w;
  float b7 = u*v*w;
  float b8 = -(v-1.0)*u*w;
  */
  
  float c1 = irand(p+vec3(0.0, 0.0, 0.0), sz)-0.5;
  float c2 = irand(p+vec3(0.0, sz, 0.0), sz)-0.5;
  float c3 = irand(p+vec3(sz, sz, 0.0), sz)-0.5;
  float c4 = irand(p+vec3(sz, 0.0, 0.0), sz)-0.5;
  
  //float c5 = c1, c6 = c2, c7 = c3, c8 = c4;
  
  float c5 = irand(p+vec3(0.0, 0.0, sz), sz)-0.5;
  float c6 = irand(p+vec3(0.0, sz, sz), sz)-0.5;
  float c7 = irand(p+vec3(sz, sz, sz), sz)-0.5;
  float c8 = irand(p+vec3(sz, 0.0, sz), sz)-0.5;
    
  //float c = c1*b1 + c2*b2 + c3*b3 + c4*b4 + c5*b5 + c6*b6 + c7*b7 + c8*b8;
  //*
  float c = -((((c1-c2)*v-c1+(c3-c4)*v+c4)*u-((c1-c2)*v-c1)-(((c5-c6)*v
      -c5+(c7-c8)*v+c8)*u-((c5-c6)*v-c5)))*w-(((c1-c2)*v-c1+(c3-c4)*v+c4)*u
        -((c1-c2)*v-c1)));
  //*/    
  return c;
}

float perlin2(vec3 p, float sz) {
  p.xy += iGlobalTime*sz;
  
  return perlin(p, sz)*0.5 + perlin(p+0.1, sz)*0.5;
}

vec3 transform3(vec3 p) {
  float off = length(p);
  float fac = tent(off*2.0+iGlobalTime);
  //p[2] += fac*fac*(3.0 - 2.0*fac)*0.2;
  
  float f = perlin2(p*4.0, 0.5)*0.2 + perlin2(p*8.0, 0.2)*0.037;
  p[2] = f;
  
  return p;
}

float sample2(vec3 p, float time) {
  float l = length(p);
  float off = p[0]+p[1]*0.5 + l*0.2 + time;//length(p);
  off *= 6.5;
  
  float f = sin(off)*0.1;
  
  return f;
}

vec3 transform4(vec3 p) {
  float tm = iGlobalTime;
  float df = 0.005;
  
  float f = sample2(p, tm);
  float f2 = sample2(p+vec3(df, 0.0, 0.0), tm);
  float f3 = sample2(p+vec3(0.0, df, 0.0), tm);
  float f4 = sample2(p+vec3(0.0, 0.0, df), tm);
  
  float dvx = (f2-f)/df;
  float dvy = (f3-f)/df;
  float dvz = (f4-f)/df;
  
  vec3 dv = vec3(dvx, dvy, dvz);
  
  p.xy += abs(dv.xy)*0.1;
  
  p[2] += f;
  
  return p;
}

float sample3(vec3 p) {
  vec3 ap = abs(p);
  float th = p[2]*8.0 + p[0]*4.0 - p[1]*5.0;
  
  vec3 p2 = tent(p*4.0);
  p2 *= p2;
  vec3 p3 = tent(p*4.0+(1.0/3.0));
  p3 *= p3;
  vec3 p4 = tent(p*4.0+(1.0/6.0));
  p4 *= p4;
  
  float f2 = length(p2)-0.9;
  float f3 = length(p3)-0.7;
  float f4 = length(p4)-0.7;
  
  float f5 = length(p2-p3);
  return f2;///length(p*f2 + p*f3 + p*f4) - 0.5;
  
  //TWIST!
  //return length(p.xy + 0.3*vec2(sin(th), cos(th)))-0.5;
}

float sample(vec3 p) {
  float tm = iGlobalTime*4.0;
  
  p += vec3(sin(tm+p[0]*8.0)*0.08*p[2],
            cos(tm+p[1]*8.0)*0.08*p[2],
            sin(tm*4.0-p[2]*8.0)*0.05);
  return length(p)-2.0;//*(0.1*p[2]*p[2] + 0.9);
}

vec3 transform(vec3 p) {
  float off2 = 1.0 - length(p);
  p[2] += 1.0-(1.0-off2)*(1.0-off2);
  //return p;
  for (int i=0; i<5; i++) {
    float l = length(p), tm = iGlobalTime;
    float off = p[0]+p[1]*0.0 + l*0.2 - tm;//length(p);
    
    float df = 0.003;
    float f1 = sample(p);
    float f2 = (sample(p+vec3(df, 0.0, 0.0))-f1)/df;
    float f3 = (sample(p+vec3(0.0, df, 0.0))-f1)/df;
    float f4 = (sample(p+vec3(0.0, 0.0, df))-f1)/df;
    
    vec3 dv = vec3(f2, f3, f4);
    vec3 v2 = normalize(p+vec3(0.0, 0.0, 0.4))*length(dv);
    
    float d = dot(dv, dv);
    f1 /= d+0.00001;

    dv = mix(dv, v2, 0.5);
    p += -f1*dv*0.57;
    //p += pow(smoothstep(0.0, 1.0, tent(off)), (1.0+p[0])*1.5)*0.2*(1.0-p[0]);
  }
  return p;
}

void main(void) {
  //have fun with grid
  vec3 p = position;
  
  float df = 0.0001, odf = 1.0 / df;
  
  vec3 dx = transform(p+vec3(df, 0.0, 0.0));
  vec3 dy = transform(p+vec3(0.0, df, 0.0));
  vec3 dz = transform(p+vec3(0.0, 0.0, df));
  
  p = transform(p);
  dx = (dx-p) * odf;
  dy = (dy-p) * odf;
  dz = (dz-p) * odf;
  
  vec3 n = cross(dx, dy);
  v_Normal = n;
  
  gl_Position = projectionMatrix * vec4(p, 1.0);
  
  //v_Normal = (normalMatrix * vec4(normal, 0.0)).xyz;
  v_Uv = uv;
  v_Id = id;
  v_Color = color;
}

//FRAGMENT
precision highp float;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 normalMatrix;

varying vec3 v_Normal;
varying vec2 v_Uv;
varying vec4 v_Color;
varying float v_Id;

float tent(float f) {
  return 1.0 - abs(fract(f)-0.5)*2.0;
}

vec3 tent(vec3 p) {
  return vec3(
    tent(p[0]),
    tent(p[1]),
    tent(p[2])
  );
}

void main(void) {
  float c = fract(v_Uv[0]*10.0);
  vec3 l = normalize(vec3(0.2, 0.2, 0.8));
  vec3 n = normalize(v_Normal);
  
  c = max(dot(n, l), 0.0);
  float f = 1.0-tent(10.0*v_Uv[0])*tent(10.0*v_Uv[1]);
  f = pow(f, 10.0)*0.3+0.7;
  c *= f;
  
  gl_FragColor = vec4(c, c, c, 1.0);
}
