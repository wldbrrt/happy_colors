varying vec2 vUv;
uniform sampler2D map;
float f1 = 0.5; // интенсивность осветления 
float f2 = 0.4; // положение центра осветления 
float f3 = 1.0; // коэффициент влияния яркости

void main() {
    vec4 c = texture2D(map, vUv);
    vec4 c2 = texture2D(map, vUv + vec2(-0.002, 0.015));
    
    // Вертикальный градиент (0 вверху, 1 внизу)
    float gradient = vUv.y;
    
    // Параболическая функция для осветления в центре
    float center = f2; // обычно 0.5
    float distFromCenter = abs(gradient - center) * 2.0; // [0..1]
    float glow = 1.0 - smoothstep(0.0, 0.1, distFromCenter);
    float brightness = length(c.rgb) / 1.732;

    // Применяем осветление
    vec3 result = mix(c.rgb, vec3(1.0), (glow * f1 * (1.0 - brightness * f3) + (c.a - c2.a)));
    
    gl_FragColor = vec4(result * c.a, c.a);
}