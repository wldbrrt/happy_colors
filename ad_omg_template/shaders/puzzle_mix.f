varying vec2 vUv;
varying vec2 vUv2;

uniform sampler2D map;
uniform sampler2D map2;

uniform float opacity;

void main() {
    vec4 c2 = texture2D( map2, vUv2 );

    vec4 c = texture2D( map, vUv );
    float one_pixel = 0.001;
    vec4 cx1 = texture2D( map, vec2( vUv.x + one_pixel, vUv.y ) );
    vec4 cy1 = texture2D( map, vec2( vUv.x, vUv.y + one_pixel ) );
    vec4 cx2 = texture2D( map, vec2( vUv.x - one_pixel, vUv.y ) );
    vec4 cy2 = texture2D( map, vec2( vUv.x, vUv.y - one_pixel ) );
    c = (max(c, cx1) + max(c, cy1) + max(c, cx2) + max(c, cy2)) / 4.0;

    gl_FragColor = ((c - vec4(0.85) * c.a)  + c2 * c.a) * opacity;

    
}
