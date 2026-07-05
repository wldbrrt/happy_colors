varying vec2 vUv;
uniform vec3 color;
uniform float opacity;
uniform float f1;
uniform float f2;

void main() {
    float a = smoothstep(f1, f2, length( 2.0 * vUv - 1.0 ));
    gl_FragColor = vec4( color * a, a ) * opacity;
} 
