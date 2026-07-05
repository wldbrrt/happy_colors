precision highp float;

varying vec2 vUv;

uniform vec2 u_size;
uniform float u_time;

uniform vec3 color;
uniform float opacity;

const mat3 p = mat3(
    13.323122, 23.5112,  21.71123,
    21.1212,   28.7312,  11.9312,
    21.8112,   14.7212,  61.3934
);

void main() {
    vec2 aspect = vec2(u_size.x / u_size.y, 1.0);
    vec2 uv = (vUv - 0.5) * aspect + 0.5;

    vec3 acc = vec3(0.0);

    int LAYERS = 10;   // количество слоёв
    float DEPTH = 0.5; // коэффициент глубины слоя (масштабирование по глубине)
    float WIDTH = 1.0; // смещение слоёв относительно друг друга
    float SPEED = 0.9; // скорость

    float dof = 5.0 * sin(u_time * 0.1);

    for (int i = 0; i < 10; ++i) {

        float f = float(i);

        vec2 q = uv * (1.0 + f * DEPTH); // Масштабирует UV в зависимости от номера слоя

        float fracSeed = fract(f * 7.238917);
        q += vec2(q.y * (WIDTH * fracSeed - WIDTH * 0.5),
                  SPEED * u_time / (1.0 + f * DEPTH * 0.03)); // Смещение координат (дальние слои движутся медленнее)

        vec3 n = vec3(floor(q.x), floor(q.y), 31.189 + f);
        vec3 m = floor(n) * 0.00001 + fract(n);
        vec3 denom = fract(p * m);
        denom = max(denom, vec3(1e-6));
        vec3 mp = (31415.9 + m) / denom;
        vec3 r = fract(mp);
        vec2 s = abs(mod(q, 1.0) - 0.5 + 0.9 * r.xy - 0.45);
        s += 0.01 * abs(2.0 * fract(10.0 * q.yx) - 1.0);
        float d = 0.6 * max(s.x - s.y, s.x + s.y) + max(s.x, s.y) - 0.01;
        float edge = 0.005 + 0.05 * min(0.5 * abs(f - 5.0 - dof), 1.0);
        float t = smoothstep(edge, -edge, d) * (r.x / (1.0 + 0.02 * f * DEPTH));
        acc += vec3(t);
    }
    vec3 finalColor = clamp(acc, 0.0, 1.5) * color;

    gl_FragColor = vec4(finalColor * opacity, opacity);
}