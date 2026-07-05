varying vec4 v_color;
attribute vec4 color;
void main() { 
    v_color = color;
    gl_Position = projectionMatrix * matrixWorld * vec4( position, 1.0, 1.0 );
}
