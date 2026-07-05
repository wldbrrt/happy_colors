varying vec4 v_uv;
attribute vec4 a_uv;

varying vec4 v_color1;
attribute vec4 a_color;

varying vec4 v_color2;
attribute vec4 a_tcolor;

void main() { 
    v_uv = a_uv;    
    v_color1 = a_color;
    v_color2 = a_tcolor;
    gl_Position = projectionMatrix * matrixWorld * vec4( position, 1.0, 1.0 );
}
