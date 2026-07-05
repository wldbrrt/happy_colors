uniform sampler2D map;
varying vec2 vUv;
uniform vec3 color;
uniform float opacity;
uniform vec2 v1;
uniform vec2 v2;

void main() {
    vec4 c = texture2D( map, vUv + v1 ) +
            texture2D( map, vUv - v1 ) +
            texture2D( map, vUv + v2 ) +
            texture2D( map, vUv - v2 );
    c.rgb *= color;
    gl_FragColor = c * opacity * 0.25;
} 
