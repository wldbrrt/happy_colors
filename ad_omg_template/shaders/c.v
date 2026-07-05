void main() { 
    gl_Position = projectionMatrix * matrixWorld * vec4( position, 1.0, 1.0 );
}
