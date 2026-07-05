varying vec2 vUv;
uniform sampler2D map;
varying vec4 v_color;
varying vec4 v_tcolor;
uniform float opacity;

void main() {
    vec4 tex = texture2D(map, vUv);
    vec4 color = mix(v_color, v_tcolor, tex.a);

    gl_FragColor = color * opacity * color.a;
}