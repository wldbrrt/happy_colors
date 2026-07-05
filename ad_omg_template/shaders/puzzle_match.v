varying vec4 v_uv;
attribute vec4 a_uv;

varying vec4 v_color1;
attribute vec4 a_color;

varying vec4 v_color2;
attribute vec4 a_tcolor;

attribute vec4 a_transform;

 void main() {
    v_uv = a_uv;    
    v_color1 = a_color;
    v_color2 = a_tcolor;
    float scale = a_transform.w;
    float zoom = a_transform.z;
    vec2 center = a_transform.xy;
    vec2 scaledPosition = center + (position.xy - center) * scale;
    gl_Position = projectionMatrix * matrixWorld * vec4(scaledPosition, 1.0, zoom);
}