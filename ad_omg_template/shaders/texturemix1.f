varying vec4 v_uv;
uniform sampler2D map;
uniform sampler2D u_texture2;
varying vec4 v_color1;
varying vec4 v_color2;


void main() {
    vec4 t1 = texture2D( map, v_uv.xy );
    vec4 t2 = texture2D( u_texture2, v_uv.zw );
    gl_FragColor = mix(t1 * v_color1, t2 * v_color2, 1.0 - t1.a);
} 
