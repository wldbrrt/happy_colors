varying vec2 vUv;
uniform vec3 color;
uniform float u_angle;
uniform float u_thickness;
uniform float u_angleOffset;

float M_2_PI = 6.28318530;
 
void main() {
    vec2 d = vUv - vec2(0.5);
    float ang = M_2_PI * fract((atan(-d.x, -d.y) + u_angleOffset) / M_2_PI) * sign(u_angle);
    vec4 t = vec4(color, step( u_thickness, max(abs(d.x), abs(d.y))) * step(u_angle, ang));
    
    gl_FragColor = t * t.a;
}