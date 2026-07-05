varying vec4 v_uv;
uniform sampler2D map;
uniform sampler2D u_texture2;

varying vec4 v_color1;
varying vec4 v_color2;


void main() {
    vec4 tex = texture2D( map, v_uv.xy );
    vec4 mask = texture2D( u_texture2, v_uv.zw );
    gl_FragColor = mix(mix(mask, tex, step(0.5, mask.b)) * v_color1, mask * v_color2, step(0.5, mask.r));
} 
