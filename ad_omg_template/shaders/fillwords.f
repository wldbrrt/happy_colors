varying vec4 v_uv;
uniform sampler2D map;
uniform sampler2D u_texture2;
varying vec4 v_color;
varying vec4 v_tcolor;

void main() {
    vec4 c = texture2D( map, v_uv.xy );
    vec4 t2 = texture2D( u_texture2, v_uv.zw );
    gl_FragColor = mix(v_color * t2 * v_color.a, clamp(c * v_tcolor / c.a, 0.0, 1.0), c.a);
} 
