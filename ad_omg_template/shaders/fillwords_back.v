varying vec4 v_uv;
attribute vec4 a_uv;

varying vec4 v_color;
attribute vec4 a_color;

varying vec4 v_tcolor;
attribute vec4 a_tcolor;

varying float v_bcolor;
attribute float a_bcolor;

varying vec2 v_uv3;
uniform vec2 u_size;
uniform vec2 u_scsz;


void main() { 
    v_uv = a_uv;
    v_color = a_color;
    v_tcolor = a_tcolor;
    v_bcolor = a_bcolor;
    vec4 pos = vec4( position, 1.0, 1.0 );
    gl_Position = projectionMatrix * matrixWorld * pos;
    v_uv3 = (projectionMatrix * pos).xy * 0.5  * u_scsz / u_size + vec2(0.5, 0.5);
}
