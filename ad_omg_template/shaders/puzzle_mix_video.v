varying vec2 vUv; 
varying vec2 vUv2;

attribute vec2 uv2;

void main() { 
    vUv = uv;
    vUv2 = uv2;
    gl_Position = projectionMatrix * matrixWorld * vec4( position, 1.0, 1.0 );
}
