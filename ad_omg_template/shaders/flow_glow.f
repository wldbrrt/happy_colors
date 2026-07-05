varying vec2 vUv; // uv-координаты исходной картинки

uniform sampler2D map; // первая картинка

uniform sampler2D u_texture2; // вторая картинка

uniform float u_power; // сила наложения
uniform float u_roughness; // параметры материала
uniform float opacity; 

varying vec4 uv_map_shift_scale;
varying vec2 uv_map;


void main() {
    vec4 g = texture2D( u_texture2, clamp(uv_map, 0.1, 0.9) * uv_map_shift_scale.zw + uv_map_shift_scale.xy );
    vec4 c = texture2D( map, vUv );
    g.rgb *= g.a * c.a * (c.r + c.g + c.b) * u_roughness;
    c.rgb += g.rgb * pow(g.a, 1.0 / u_power);
    gl_FragColor = c * c.a * opacity;
}

