varying vec2 vUv;
varying vec2 vUv2;

uniform sampler2D map;
uniform sampler2D map2;
uniform float opacity; 

void main() {
    vec4 c2 = texture2D( map2, vUv2 );
    vec4 c = texture2D( map, vUv );
    gl_FragColor = ((c - vec4(0.85) * c.a) + c2 * c.a);
}
