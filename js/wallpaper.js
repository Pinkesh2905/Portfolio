// Live wallpaper: a slow, flowing aurora drawn by one small fragment shader.
// Rendered at half resolution (the image is soft anyway), paused when the tab is hidden,
// and frozen on a single frame for visitors who prefer reduced motion.
// Without WebGL the CSS gradient on .wallpaper is what shows.

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r;
uniform float t;
uniform vec2 m;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; }
  return v;
}
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * r) / min(r.x, r.y);
  p += (m - 0.5) * 0.16;
  float tt = t * 0.05;

  vec2 q = vec2(fbm(p * 1.2 + vec2(0.0, tt)), fbm(p * 1.2 + vec2(5.2, -tt * 1.3)));
  vec2 w = vec2(fbm(p * 1.1 + 3.0 * q + vec2(1.7, 9.2) + tt * 0.7),
                fbm(p * 1.1 + 3.0 * q + vec2(8.3, 2.8) - tt * 0.5));
  float f = fbm(p * 1.3 + 3.2 * w);

  vec3 col = vec3(0.030, 0.028, 0.070);
  col = mix(col, vec3(0.27, 0.20, 0.80), smoothstep(0.25, 0.85, f) * 0.80);
  col = mix(col, vec3(0.04, 0.55, 0.66), smoothstep(0.38, 0.95, w.x) * 0.55);
  col = mix(col, vec3(0.80, 0.22, 0.52), smoothstep(0.30, 0.75, q.y * f * 2.0) * 0.45);

  // thin luminous contour lines riding the flow
  float band = abs(sin((f * 3.2 + w.y * 2.0) * 3.14159));
  col += pow(1.0 - band, 22.0) * 0.11 * vec3(0.65, 0.80, 1.0);

  col *= 0.50 + 0.50 * smoothstep(1.5, 0.15, length(p));
  col += (hash(gl_FragCoord.xy + fract(t) * 91.0) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}`;

const VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

export function startWallpaper(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uR = gl.getUniformLocation(prog, 'r');
  const uT = gl.getUniformLocation(prog, 't');
  const uM = gl.getUniformLocation(prog, 'm');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const target = { x: 0.5, y: 0.5 };
  const mouse = { x: 0.5, y: 0.5 };
  const seed = 40 + Math.random() * 400; // a different sky on every visit
  let clock = 0;
  let last = 0;
  let raf = 0;
  let quality = 1; // drops in steps if this device cannot hold a smooth frame rate
  let slow = 0;
  let counted = 0;

  const resize = () => {
    const k = Math.min(0.5, 900 / Math.max(innerWidth, innerHeight)) * quality;
    const w = Math.max(2, Math.round(innerWidth * k));
    const h = Math.max(2, Math.round(innerHeight * k));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  };
  const draw = () => {
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, seed + clock);
    gl.uniform2f(uM, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = (now) => {
    raf = 0;
    const raw = (now - last) / 1000 || 0;
    const dt = Math.min(0.05, raw);
    last = now;
    if (raw > 0 && raw < 0.5) {
      counted++;
      if (raw > 0.03) slow++;
      if (counted === 40) {
        if (slow > 20 && quality > 0.3) { quality *= 0.7; resize(); }
        counted = 0;
        slow = 0;
      }
    }
    clock += dt;
    mouse.x += (target.x - mouse.x) * 0.04;
    mouse.y += (target.y - mouse.y) * 0.04;
    draw();
    play();
  };
  function play() {
    if (!raf && !document.hidden && !reduce.matches) {
      raf = requestAnimationFrame(frame);
    }
  }
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  };

  addEventListener('resize', () => { resize(); if (!raf) draw(); });
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    target.x = e.clientX / innerWidth;
    target.y = 1 - e.clientY / innerHeight;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
  reduce.addEventListener('change', () => (reduce.matches ? stop() : play()));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); });

  resize();
  draw();
  canvas.classList.add('on');
  play();
}
