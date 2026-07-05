varying vec2 vUv; 
varying vec4 uv_map_shift_scale;
varying vec2 uv_map;

uniform vec4 glow_frame_data; // данные фрейма второй картинки [ x1, x2, y1, y2 ]
// uniform vec2 atlassz; // размер атласа захаржкожен ( 1024 )

uniform float u_shift; // сдвиг наложения
uniform float u_angle; // поворот
uniform float u_scale; // скейл наложения

vec2 rotate(vec2 point, float angle)
{
    float x = point.x;
    float y = point.y;
    float c = cos(angle);
    float s = sin(angle);
    return vec2(x * c - y * s, x * s + y * c);
}

void main() { 
    vUv = uv;
    uv_map_shift_scale.xy = glow_frame_data.xz;
    uv_map_shift_scale.zw = glow_frame_data.yw - glow_frame_data.xz;
    gl_Position = projectionMatrix * matrixWorld * vec4( position, 1.0, 1.0 );
    uv_map = gl_Position.xy / gl_Position.w / 2.0 + vec2(0.5, 0.5);
    uv_map.x += u_shift;
    uv_map = rotate(uv_map, u_angle) / u_scale;    
}
