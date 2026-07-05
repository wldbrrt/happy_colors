varying vec4 v_uv;
attribute vec4 a_uv;

varying vec4 v_color;
attribute vec4 a_color;

varying vec4 v_tcolor;
attribute vec4 a_tcolor;

varying vec4 v_color2;
attribute vec4 a_color2;

void main() { 
    v_uv = a_uv;    
    v_color = a_color;
    v_tcolor = a_tcolor;
    v_color2 = a_color2;
    gl_Position = projectionMatrix * matrixWorld * vec4( position, 1.0, 1.0 );
}