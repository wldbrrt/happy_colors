varying vec2 vUv;
uniform sampler2D map;
uniform vec3 u_col;
uniform float u_alp;
uniform float u_blur;
uniform vec2 u_rad;
uniform vec2 u_dvec;

float blur13() {
  float k = 0.0;
  vec2 p = u_dvec / u_rad;
  vec2 off1 = vec2(1.412) * p;
  vec2 off2 = vec2(3.294) * p;
  vec2 off3 = vec2(5.176) * p;
  k += texture2D(map, vUv).a * 0.196;
  k += texture2D(map, vUv + off1).a * 0.297;
  k += texture2D(map, vUv - off1).a * 0.297;
  k += texture2D(map, vUv + off2).a * 0.094;
  k += texture2D(map, vUv - off2).a * 0.094;
  k += texture2D(map, vUv + off3).a * 0.01;
  k += texture2D(map, vUv - off3).a * 0.01;
  k -= abs(1.0 - u_blur * vUv.x * vUv.y * (1.0 - vUv.x) * (1.0 - vUv.y)) / 100.0;
  return k * u_alp;
}

void main() {
    gl_FragColor = vec4( u_col, blur13() );
}


