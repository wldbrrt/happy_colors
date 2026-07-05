varying vec4 v_uv;
uniform sampler2D map;
uniform sampler2D u_texture2;
uniform sampler2D u_texture3;
varying vec4 v_color;
varying vec4 v_tcolor;
varying vec2 v_uv3;
varying float v_bcolor;

void main() {
    vec4 c = texture2D( map, v_uv.xy );
    vec4 t2 = texture2D( u_texture2, v_uv.zw );
    vec4 t3 = texture2D( u_texture3, v_uv3);
    gl_FragColor = mix(mix(v_color, t3, v_bcolor) * t2 * v_color.a, v_tcolor, c.a);
} 
