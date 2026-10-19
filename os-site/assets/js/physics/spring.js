// Damped springs, integrated with semi-implicit Euler in fixed 4 ms substeps so
// the motion is identical at any frame rate.

const SUBSTEP = 0.004;

export class Spring {
  constructor({ stiffness = 180, damping = 26, mass = 1, value = 0 } = {}) {
    this.k = stiffness; this.c = damping; this.m = mass;
    this.x = value; this.v = 0; this.target = value;
  }
  step(dtMs) {
    let t = dtMs / 1000;
    while (t > 1e-6) {
      const h = Math.min(SUBSTEP, t);
      const force = -this.k * (this.x - this.target) - this.c * this.v;
      this.v += (force / this.m) * h;
      this.x += this.v * h;
      t -= h;
    }
    return this.x;
  }
  settled(eps = 0.25) { return Math.abs(this.x - this.target) < eps && Math.abs(this.v) < eps * 8; }
  snap() { this.x = this.target; this.v = 0; }
}

export class Spring2D {
  constructor(opts = {}, at = { x: 0, y: 0 }) {
    this.sx = new Spring({ ...opts, value: at.x });
    this.sy = new Spring({ ...opts, value: at.y });
  }
  set target(p) { this.sx.target = p.x; this.sy.target = p.y; }
  get value() { return { x: this.sx.x, y: this.sy.x }; }
  set value(p) { this.sx.x = p.x; this.sy.x = p.y; }
  set velocity(v) { this.sx.v = v.x; this.sy.v = v.y; }
  configure({ stiffness, damping }) {
    for (const s of [this.sx, this.sy]) { if (stiffness) s.k = stiffness; if (damping) s.c = damping; }
  }
  step(dt) { this.sx.step(dt); this.sy.step(dt); return this.value; }
  settled(eps) { return this.sx.settled(eps) && this.sy.settled(eps); }
}

/**
 * A spring rendered as a CSS `linear()` easing, so hover and lift transitions get
 * physical overshoot at zero runtime cost. Returns null where unsupported.
 */
export function springEasing({ stiffness = 210, damping = 17, mass = 1 } = {}) {
  if (typeof CSS === 'undefined' || !CSS.supports('transition-timing-function', 'linear(0, 1)')) return null;
  const sp = new Spring({ stiffness, damping, mass, value: 0 });
  sp.target = 1;
  const dt = 1000 / 120;
  const samples = [0];
  let t = 0;
  while (t < 2000) {
    sp.step(dt); t += dt;
    samples.push(sp.x);
    if (t > 120 && Math.abs(sp.x - 1) < 0.002 && Math.abs(sp.v) < 0.02) break;
  }
  samples[samples.length - 1] = 1;
  const stride = Math.max(1, Math.floor(samples.length / 48));
  const points = samples.filter((_, i) => i % stride === 0 || i === samples.length - 1);
  return { easing: `linear(${points.map(v => +v.toFixed(4)).join(', ')})`, duration: Math.round(t) };
}
