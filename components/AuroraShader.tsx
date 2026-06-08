"use client";

import { useEffect, useRef } from "react";
import styles from "./AuroraShader.module.css";

type Props = {
  /** color de la columna principal en hex */
  color?: string;
  /** color de fondo subyacente — para que la mezcla 'screen' funcione bien */
  bg?: string;
  /** intensidad del glow 0-1 */
  intensity?: number;
  /** forma: "flame" (vertical, hero) | "ambient" (radial, secciones) */
  shape?: "flame" | "ambient";
};

const VERT = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_mouse;          // -1..1
uniform vec3  u_color;          // glow color
uniform vec3  u_bg;             // background
uniform float u_intensity;
uniform int   u_shape;          // 0 flame, 1 ambient

// --- hash + value noise (cheap, glsl friendly) ---
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 78.233);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.05;
    a *= 0.5;
  }
  return v;
}

void main() {
  // aspect-corrected coords
  float aspect = u_res.x / u_res.y;
  vec2 uv = v_uv;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= aspect;

  // mouse offset (parallax)
  vec2 mouseOff = u_mouse * 0.08;
  p -= mouseOff;

  float t = u_time * 0.10;

  float glow = 0.0;

  if (u_shape == 0) {
    // === FLAME / VERTICAL AURORA ===========================
    // Vertical column anchored at bottom-center
    vec2 col = p;
    col.y += 0.6;                // shift center upward
    // narrow horizontally via squashed distance
    float dx = col.x;
    float dy = col.y;

    // noise-driven horizontal wobble of the column
    float wobble = (fbm(vec2(dy * 1.6, t * 1.3)) - 0.5) * 0.6;
    dx += wobble * (0.5 + smoothstep(-1.2, 0.8, dy));

    // base column mask
    float radial = 1.0 - smoothstep(0.0, 0.55, abs(dx) * (1.0 - dy * 0.35));
    radial = clamp(radial, 0.0, 1.0);

    // vertical falloff (strong at bottom, fades upward)
    float vert = smoothstep(-1.4, 0.4, -dy);
    vert *= 1.0 - smoothstep(0.4, 1.6, dy);

    // turbulence body
    float turb = fbm(vec2(p.x * 1.4 + wobble, p.y * 1.2 - t * 1.8));
    turb = pow(turb, 1.3);

    // intensify at the base
    float base = smoothstep(-1.4, -0.4, -dy);
    base = pow(base, 2.5);

    // wings: two soft side blobs
    float wL = exp(-pow((p.x + 0.55) * 1.2, 2.0)) * exp(-pow((p.y + 0.05) * 1.6, 2.0));
    float wR = exp(-pow((p.x - 0.55) * 1.2, 2.0)) * exp(-pow((p.y + 0.05) * 1.6, 2.0));
    float wings = (wL + wR) * 0.7;

    glow = radial * vert * (0.32 + turb * 0.42) + base * 0.55 + wings * 0.28;

    // breathing
    glow *= 0.85 + 0.15 * sin(u_time * 0.6);

  } else {
    // === AMBIENT (per-section soft cloud) ==================
    vec2 q = p * 0.55;
    float n1 = fbm(q + vec2(t * 0.7, t * 0.25));
    float n2 = fbm(q * 1.7 + vec2(-t * 0.4, t * 0.9));
    float cloud = (n1 + n2 * 0.55) - 0.55;
    cloud = max(cloud, 0.0);

    // soft radial mask centered slightly above bottom
    float r = length(p - vec2(0.0, 0.25));
    float mask = 1.0 - smoothstep(0.3, 1.3, r);

    glow = cloud * mask * 1.0;
  }

  glow = clamp(glow * u_intensity, 0.0, 0.95);

  // color mix — additive blend
  vec3 col = u_bg + u_color * glow * 0.85;
  // soft toe + slight darken on edges
  col = pow(col, vec3(0.96));

  outColor = vec4(col, 1.0);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return [r, g, b];
}

export function AuroraShader({
  color = "#4FE3C1",
  bg = "#051236",
  intensity = 1,
  shape = "flame",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    // compile
    const compile = (src: string, type: number) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("shader compile error", gl.getShaderInfoLog(sh));
      }
      return sh;
    };

    const vs = compile(VERT, gl.VERTEX_SHADER);
    const fs = compile(FRAG, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("program link", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // uniforms
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uColor = gl.getUniformLocation(prog, "u_color");
    const uBg = gl.getUniformLocation(prog, "u_bg");
    const uIntensity = gl.getUniformLocation(prog, "u_intensity");
    const uShape = gl.getUniformLocation(prog, "u_shape");

    const [cr, cg, cb] = hexToRgb(color);
    const [br, bgC, bb] = hexToRgb(bg);
    gl.uniform3f(uColor, cr, cg, cb);
    gl.uniform3f(uBg, br, bgC, bb);
    gl.uniform1f(uIntensity, intensity);
    gl.uniform1i(uShape, shape === "flame" ? 0 : 1);

    // resize
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // mouse
    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    };
    window.addEventListener("mousemove", handleMouse);

    let mx = 0,
      my = 0;
    let raf = 0;
    const start = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const loop = () => {
      const now = (performance.now() - start) / 1000;
      // lerp mouse
      mx += (mouseRef.current.x - mx) * 0.06;
      my += (mouseRef.current.y - my) * 0.06;
      gl.uniform1f(uTime, reduced ? 0 : now);
      gl.uniform2f(uMouse, mx, -my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMouse);
      ro.disconnect();
    };
  }, [color, bg, intensity, shape]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden />;
}
