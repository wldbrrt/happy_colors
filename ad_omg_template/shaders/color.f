uniform sampler2D map;
uniform vec3 color;
uniform float opacity;
varying vec2 vUv;

void main() {
    float a = texture2D(map, vUv).a;
    gl_FragColor = vec4(color * a, a) * opacity;
}
