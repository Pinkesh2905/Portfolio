// Hero background: soft red light and smoke around the portrait, fading to black away from it,
// with a few broad, slow rays. One fragment shader at reduced resolution; paused when the hero
// is off screen or the tab is hidden; a single still frame for reduced motion.
// Without WebGL, the CSS gradient on .hero-bg shows instead.

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r;
uniform float t;
uniform vec2 L;   // light position, 0..1 (y up)
uniform vec2 m;   // pointer, -1..1

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.02 + vec2(11.0, 7.0); a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  vec2 lp = vec2((L.x + m.x * 0.02) * asp, L.y + m.y * 0.015);
  vec2 d = p - lp;
  float dist = length(d);

  // drifting smoke, domain-warped so it curls
  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t * 0.035)), fbm(p * 1.4 + vec2(4.1, -t * 0.03)));
  float smoke = fbm(p * 1.8 + q * 2.2 + vec2(t * 0.02, -t * 0.045));

  // the red lives in a soft pool around the portrait (about half the screen) and fades to black
  float pool = smoothstep(0.78, 0.05, dist);

  // a few broad rays that drift slowly, softened by the smoke
  float ang = atan(d.y, d.x);
  float rays = pow(0.5 + 0.5 * sin(ang * 6.0 + t * 0.06 + smoke * 1.2), 2.5);
  rays *= exp(-dist * 2.4) * (0.5 + 0.5 * smoke) * pool;

  vec3 col = vec3(0.012, 0.0, 0.003);
  col += vec3(0.5, 0.02, 0.06) * pow(smoke, 2.2) * 1.3 * pool;      // smoke, only near the light
  col += vec3(0.95, 0.08, 0.14) * exp(-dist * dist * 6.5) * 0.8;    // backlight bloom
  col += vec3(1.0, 0.2, 0.25) * exp(-dist * dist * 45.0) * 0.35;    // hot core
  col += vec3(0.9, 0.06, 0.12) * rays * 0.28;

  col *= 0.35 + 0.65 * pool;
  col += (hash(gl_FragCoord.xy + fract(t * 7.0) * 91.0) - 0.5) * 0.025 * (0.3 + pool);  // film grain
  gl_FragColor = vec4(col, 1.0);
}`;

const VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

/** Sets up the background on a canvas. Returns { light(x, y) } to move the light (0..1, y up) and { run(on) } to animate or pause. */
export function startHeroBg(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  const none = { light() {}, run() {} };
  if (!gl) return none;
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return none;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return none;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const uR = u('r'), uT = u('t'), uL = u('L'), uM = u('m');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const light = { x: 0.5, y: 0.66 };
  const target = { x: 0, y: 0 };
  const mouse = { x: 0, y: 0 };
  let clock = 20 + Math.random() * 200;
  let last = 0, raf = 0, visible = true;
  let active = false; // stays still until the page is revealed, and while overlays cover it
  // phones get fewer pixels from the start; any device drops further if frames run slow
  let quality = matchMedia('(pointer: coarse)').matches ? 0.6 : 1;
  let slow = 0, counted = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const k = Math.min(0.55, 1000 / Math.max(rect.width, rect.height, 1)) * quality;
    const w = Math.max(2, Math.round(rect.width * k));
    const h = Math.max(2, Math.round(rect.height * k));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  };
  const draw = () => {
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, clock);
    gl.uniform2f(uL, light.x, light.y);
    gl.uniform2f(uM, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = (now) => {
    raf = 0;
    const raw = (now - last) / 1000 || 0;
    last = now;
    clock += Math.min(0.05, raw) * (reduce.matches ? 0.4 : 1); // calmer drift for reduced motion
    if (raw > 0 && raw < 0.5) {
      counted++;
      if (raw > 0.03) slow++;
      if (counted === 40) {
        if (slow > 20 && quality > 0.35) { quality *= 0.7; resize(); }
        counted = 0; slow = 0;
      }
    }
    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;
    draw();
    play();
  };
  function play() { if (!raf && active && visible && !document.hidden) raf = requestAnimationFrame(frame); }
  const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0; };

  addEventListener('resize', () => { resize(); if (!raf) draw(); });
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    target.x = (e.clientX / innerWidth) * 2 - 1;
    target.y = 1 - (e.clientY / innerHeight) * 2;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? play() : stop(); }).observe(canvas);
  }

  resize();
  draw();
  canvas.classList.add('on');
  play();
  return {
    light(x, y) { light.x = x; light.y = y; if (!raf) draw(); },
    run(on) { active = on; if (on) play(); else stop(); },
  };
}
