varying vec4 v_uv;
attribute vec4 a_uv;

varying vec4 v_color;
attribute vec4 a_color;

varying vec4 v_tcolor;
attribute vec4 a_tcolor;

void main() { 
    v_uv = a_uv;    
    v_color = a_color;
    v_tcolor = a_tcolor;
    gl_Position = projectionMatrix * matrixWorld * vec4( position, 1.0, 1.0 );
}
