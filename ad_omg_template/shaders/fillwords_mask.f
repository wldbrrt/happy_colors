varying vec4 v_uv;
uniform sampler2D map;
uniform sampler2D u_texture2;
varying vec4 v_color;
varying vec4 v_tcolor;
varying vec4 v_color2;

void main() {
    vec4 c = texture2D( map, v_uv.xy );
    vec4 t2 = texture2D( u_texture2, v_uv.zw );

    vec4 c2 = v_color2 * t2.a;
    vec4 fillColor = v_color * t2.a * v_color.a;
    float mask = 1.0 - t2.b;
    
    gl_FragColor = mix(mix(c2, fillColor, mask), v_tcolor, c.a);
} 