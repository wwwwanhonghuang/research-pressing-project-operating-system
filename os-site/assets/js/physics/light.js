// The light. Its direction is a design token (--light-x/y/z in tokens.css), so the
// daylight and lamplight themes move the light and everything lit follows: paper
// shadows (pure CSS), book-spine shading and the curl of a turning page (here).

let L = { x: -0.42, y: -0.6, z: 0.68, shadow: 0.13 };
const listeners = new Set();

export function readLight() {
  const cs = getComputedStyle(document.documentElement);
  const num = (name, d) => { const v = parseFloat(cs.getPropertyValue(name)); return Number.isFinite(v) ? v : d; };
  const x = num('--light-x', -0.42), y = num('--light-y', -0.6), z = num('--light-z', 0.68);
  const len = Math.hypot(x, y, z) || 1;
  L = { x: x / len, y: y / len, z: z / len, shadow: num('--shadow-alpha', 0.13) };
  const root = document.documentElement.style;
  root.setProperty('--spine-shade', cylinderGradient(90));
  // CSS gradient angle pointing away from the light (0deg = up, 90deg = right).
  root.setProperty('--light-angle', `${(Math.atan2(-L.x, L.y) * 180 / Math.PI).toFixed(1)}deg`);
  for (const fn of listeners) fn(L);
  return L;
}
export const light = () => L;
export function onLight(fn) { listeners.add(fn); return () => listeners.delete(fn); }

const AMBIENT = 0.42, DIFFUSE = 0.62;
const intensity = N => AMBIENT + DIFFUSE * Math.max(0, N.x * L.x + N.y * L.y + N.z * L.z);

/** Overlay colour that turns flat-lit paper into paper at normal N. */
export function shade(N, gain = 1) {
  const flat = AMBIENT + DIFFUSE * Math.max(0, L.z);
  const delta = (intensity(N) - flat) * gain;
  return delta >= 0 ? `rgba(255,255,255,${Math.min(0.5, delta * 0.9).toFixed(3)})`
    : `rgba(${L.shadow > 0.3 ? '0,0,0' : '22,28,36'},${Math.min(0.55, -delta * 0.85).toFixed(3)})`;
}

/** Shading across a cylinder (a book spine) whose axis is vertical on screen. */
export function cylinderGradient(angleDeg) {
  const stops = [];
  for (let i = 0; i <= 8; i++) {
    const u = -1 + (2 * i) / 8;              // across the spine, left to right
    const phi = Math.asin(Math.max(-1, Math.min(1, u)));
    stops.push(`${shade({ x: Math.sin(phi), y: 0, z: Math.cos(phi) }, 1.15)} ${(i / 8 * 100).toFixed(1)}%`);
  }
  return `linear-gradient(${angleDeg}deg, ${stops.join(', ')})`;
}

/**
 * Stops for the curl of a turning page: across a band next to the fold line the
 * paper rolls from facing outward (−n) to facing the viewer (z). Includes a soft
 * specular sheen where the surface reflects the light toward the eye.
 */
export function curlStops(n) {
  const out = [];
  const H = normalize({ x: L.x, y: L.y, z: L.z + 1 });
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    const th = u * Math.PI / 2;
    const N = { x: -n.x * Math.cos(th), y: -n.y * Math.cos(th), z: Math.sin(th) };
    const spec = Math.pow(Math.max(0, N.x * H.x + N.y * H.y + N.z * H.z), 28) * 0.22;
    const flat = AMBIENT + DIFFUSE * Math.max(0, L.z);
    let delta = intensity(N) - flat + spec;
    if (i === 0) delta -= 0.09;               // the crease itself, in its own shadow
    const color = delta >= 0 ? `rgba(255,255,255,${Math.min(0.55, delta).toFixed(3)})`
      : `rgba(${L.shadow > 0.3 ? '0,0,0' : '20,26,34'},${Math.min(0.5, -delta * 0.9).toFixed(3)})`;
    out.push({ offset: u, color });
  }
  return out;
}

function normalize(v) { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; }
