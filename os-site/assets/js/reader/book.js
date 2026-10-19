// The book: pages on a desk, turned by hand.
//
// Layout   spread (two pages, spine in the middle) or single (one page, spine on
//          its left edge). Pages have a fixed virtual size; the book is scaled.
// Physics  a turning leaf is folded along the bisector of the grabbed point and
//          the hand (physics/fold.js), kept inextensible, and moved by springs:
//          a stiff one that follows the hand, a critically damped one that settles
//          it when released. Clicks and keys turn along an eased arc.
// Light    the curl, the shadow it casts and the shadow on the revealed page are
//          drawn in SVG from the room's light vector (physics/light.js).
// Cost     nothing runs at rest. During a turn, three transforms and a few SVG
//          points change per frame; no page text is repainted. The visible front
//          of the leaf and its folded-over back both lie on the hand's side of the
//          fold line, so one rotated, overflow-clipped layer cuts both (the
//          half-plane clip), and the compositor does the rest.

import { h, s } from '../core/dom.js';
import { animate, reducedMotion } from '../core/ticker.js';
import { Spring2D } from '../physics/spring.js';
import { fold, constrain, backMatrix, points } from '../physics/fold.js';
import { light, curlStops } from '../physics/light.js';

let uid = 0;
const AUTO_MS = 850;              // a deliberate, unhurried turn: 0.85 s, sine eased
const FOLLOW = { stiffness: 900, damping: 60 };
const SETTLE = { stiffness: 240, damping: 31 };
const PEEK = { stiffness: 320, damping: 26 };

export class Book {
  constructor(host, { pages, geo, renderPage, start = 0, onTurn, onDragState }) {
    this.host = host;
    this.pages = pages;
    this.geo = geo;
    this.mode = geo.mode;
    this.W = geo.W; this.H = geo.H;
    this.renderPage = renderPage;
    this.onTurn = onTurn || (() => {});
    this.onDragState = onDragState || (() => {});
    this.cache = new Map();
    this.ghosts = new Map();
    this.turn = null;
    this.stop = null;
    this.id = ++uid;
    this.pos = this.mode === 'spread' ? this.spreadOf(start) : Math.max(0, Math.min(pages.length - 1, start));
    this.build();
    this.layout();
    this.showRest();
  }

  // ---------------------------------------------------------------- positions

  get spineX() { return this.mode === 'spread' ? this.W : 0; }
  get last() { return this.mode === 'spread' ? Math.floor(this.pages.length / 2) : this.pages.length - 1; }
  spreadOf(p) { return Math.floor((p + 1) / 2); }
  visiblePages(pos = this.pos) {
    return this.mode === 'spread' ? [2 * pos - 1, 2 * pos].filter(i => i >= 0 && i < this.pages.length) : [pos];
  }
  /** The first page currently in view (for keeping one's place). */
  get page() { const v = this.visiblePages(); return v[0] ?? 0; }
  hasNext() { return this.pos < this.last; }
  hasPrev() { return this.pos > 0; }

  // ---------------------------------------------------------------- DOM

  build() {
    const { W, H } = this;
    const cw = this.mode === 'spread' ? 2 * W : W;
    this.el = h('div', { class: `book book--${this.mode}` });
    this.stage = h('div', { class: 'book__stage', style: { width: `${cw}px`, height: `${H}px` } });
    this.spread = h('div', { class: 'book__spread', style: { width: `${cw}px`, height: `${H}px` } });
    this.slots = this.mode === 'spread'
      ? [h('div', { class: 'slot slot--left', style: { left: '0px', width: `${W}px` } }), h('div', { class: 'slot slot--right', style: { left: `${W}px`, width: `${W}px` } })]
      : [h('div', { class: 'slot slot--single', style: { left: '0px', width: `${W}px` } })];
    this.stacks = this.slots.map(slot => { const st = h('div', { class: 'stack', 'aria-hidden': 'true' }); slot.append(st); return st; });

    const gid = `b${this.id}`;
    const svgBox = () => ({ width: cw, height: H, viewBox: `0 0 ${cw} ${H}`, 'aria-hidden': 'true' });

    // Shadow on the revealed page, below everything that turns.
    this.revealSvg = s('svg', { class: 'turn-svg turn-svg--reveal', ...svgBox() },
      s('defs', null, s('linearGradient', { id: `${gid}-reveal`, gradientUnits: 'userSpaceOnUse' },
        s('stop', { offset: '0' }), s('stop', { offset: '0.38' }), s('stop', { offset: '1', 'stop-opacity': '0' }))),
      this.revealPoly = s('polygon', { fill: `url(#${gid}-reveal)` }));
    this.revealGrad = this.revealSvg.querySelector('linearGradient');
    this.revealStops = [...this.revealGrad.querySelectorAll('stop')];

    // The half-plane clip: a large box whose edge lies on the fold line.
    // Large enough to reach every point the leaf can touch from anywhere on the fold.
    this.BIG = Math.ceil(2 * Math.hypot(cw, 1.6 * H) + 100);
    this.clip = h('div', { class: 'turn-clip', style: { width: `${this.BIG}px`, height: `${this.BIG}px` } });
    this.inner = h('div', { class: 'turn-inner' });
    this.leaf = h('div', { class: 'turn-leaf', style: { left: `${this.spineX}px`, width: `${W}px`, height: `${H}px` } });
    this.castSvg = s('svg', { class: 'turn-svg turn-svg--cast', ...svgBox() },
      this.castPolys = [s('polygon'), s('polygon'), s('polygon')]);
    this.flap = h('div', { class: 'turn-flap', style: { width: `${W}px`, height: `${H}px` } });
    this.lightSvg = s('svg', { class: 'turn-svg turn-svg--light', ...svgBox() },
      s('defs', null, s('linearGradient', { id: `${gid}-curl`, gradientUnits: 'userSpaceOnUse' },
        ...Array.from({ length: 7 }, (_, i) => s('stop', { offset: String(i / 6) })))),
      this.curlPoly = s('polygon', { fill: `url(#${gid}-curl)` }));
    this.curlGrad = this.lightSvg.querySelector('linearGradient');
    this.curlStops = [...this.curlGrad.querySelectorAll('stop')];
    this.inner.append(this.leaf, this.castSvg, this.flap, this.lightSvg);
    this.clip.append(this.inner);

    this.turnLayer = [this.revealSvg, this.clip];
    this.spread.append(...this.slots, ...this.turnLayer);
    this.stage.append(this.spread);
    this.el.append(this.stage);
    this.host.append(this.el);
    this.setTurnVisible(false);

    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    this.onLeave = this.onLeave.bind(this);
    this.spread.addEventListener('pointerdown', this.onDown);
    this.spread.addEventListener('pointermove', this.onMove);
    this.spread.addEventListener('pointerup', this.onUp);
    this.spread.addEventListener('pointercancel', this.onUp);
    this.spread.addEventListener('pointerleave', this.onLeave);
    this.resizeObs = new ResizeObserver(() => this.layout());
    this.resizeObs.observe(this.host);
  }

  destroy() {
    this.stop?.();
    this.resizeObs.disconnect();
    this.el.remove();
  }

  layout() {
    const r = this.host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cw = this.mode === 'spread' ? 2 * this.W : this.W;
    const padX = this.mode === 'spread' ? 56 : 10, padY = this.mode === 'spread' ? 30 : 14;
    const max = this.mode === 'spread' ? 1.38 : 1.7;
    this.scale = Math.max(0.2, Math.min((r.width - 2 * padX) / cw, (r.height - 2 * padY) / this.H, max));
    this.stage.style.transform = `translate(-50%, -50%) scale(${this.scale.toFixed(4)})`;
  }

  pageEl(i) {
    if (i < 0 || i >= this.pages.length) return null;
    let el = this.cache.get(i);
    if (!el) {
      el = this.renderPage(this.pages[i]);
      this.cache.set(i, el);
      if (this.cache.size > 28) this.evict();
    }
    return el;
  }

  evict() {
    const keep = new Set(this.visiblePages());
    for (const [i, el] of this.cache) {
      if (this.cache.size <= 20) break;
      if (!keep.has(i) && !el.isConnected) this.cache.delete(i);
    }
  }

  /** The reverse of a single page: the same sheet seen from behind, faint show-through. */
  ghost(i) {
    if (i < 0 || i >= this.pages.length) return null;
    let el = this.ghosts.get(i);
    if (!el) {
      const src = this.pageEl(i);
      el = h('div', { class: 'pg pg--reverse paper', style: { '--pw': `${this.W}px`, '--ph': `${this.H}px` }, 'aria-hidden': 'true' });
      if (src) { const clone = src.cloneNode(true); clone.classList.add('pg--showthrough'); clone.removeAttribute('aria-label'); el.append(clone); }
      el.append(h('div', { class: 'pg__light' }));
      this.ghosts.set(i, el);
    }
    return el;
  }

  place(slot, el) {
    const stack = slot.querySelector('.stack');
    for (const child of [...slot.children]) if (child !== stack) child.remove();
    if (el) slot.append(el);
  }

  setTurnVisible(on) {
    for (const el of this.turnLayer) el.style.visibility = on ? 'visible' : 'hidden';
    this.el.classList.toggle('is-turning', on);
  }

  shiftFor(pos) {
    if (this.mode !== 'spread') return 0;
    const [l, r] = [2 * pos - 1, 2 * pos];
    const hasL = l >= 0 && l < this.pages.length, hasR = r >= 0 && r < this.pages.length;
    if (!hasL && hasR) return -this.W / 2;
    if (hasL && !hasR) return this.W / 2;
    return 0;
  }

  setStacks(pos) {
    const n = this.pages.length;
    const read = this.mode === 'spread' ? Math.max(0, 2 * pos - 1) : pos;
    const thick = k => Math.min(6, Math.ceil(k / 9));
    const shadow = (k, dir) => Array.from({ length: thick(k) }, (_, i) => {
      const o = (i + 1) * 0.9;
      return `${(dir * o).toFixed(1)}px ${(o * 0.7).toFixed(1)}px 0 -0.2px var(--${i % 2 ? 'paper' : 'paper-edge'})`;
    }).join(', ') || 'none';
    if (this.mode === 'spread') {
      this.stacks[0].style.boxShadow = shadow(read, -1);
      this.stacks[1].style.boxShadow = shadow(n - read - 1, 1);
      this.stacks[0].hidden = read <= 0; this.stacks[1].hidden = 2 * pos >= n;
    } else {
      this.stacks[0].style.boxShadow = shadow(n - pos - 1, 1);
    }
  }

  showRest() {
    this.setTurnVisible(false);
    this.leaf.replaceChildren(); this.flap.replaceChildren();
    if (this.mode === 'spread') {
      this.place(this.slots[0], this.pageEl(2 * this.pos - 1));
      this.place(this.slots[1], this.pageEl(2 * this.pos));
      this.spread.style.transform = `translateX(${this.shiftFor(this.pos)}px)`;
    } else {
      this.place(this.slots[0], this.pageEl(this.pos));
    }
    this.setStacks(this.pos);
    this.el.classList.add('is-rest');
    try { this.onTurn(this.pos); } catch (err) { console.error(err); }
  }

  // ---------------------------------------------------------------- turns

  /**
   * Prepare a turn. `forwardFrom` is the position whose forward turn is animated;
   * a backward turn is that forward turn played in reverse. `to` is the position
   * shown when the turn completes; jumps reveal a distant spread in one turn.
   */
  setup({ dir, to }) {
    const from = this.pos;
    let other, front, back, under;
    if (this.mode === 'spread') {
      if (dir > 0) { other = 2 * from - 1; front = 2 * from; back = 2 * to - 1; under = 2 * to; }
      else { other = 2 * to - 1; front = 2 * to; back = 2 * from - 1; under = 2 * from; }
      this.place(this.slots[0], this.pageEl(other));
      this.place(this.slots[1], this.pageEl(under));
      this.flap.replaceChildren(...[this.pageEl(back)].filter(Boolean));
    } else {
      if (dir > 0) { front = from; under = to; } else { front = to; under = from; }
      this.place(this.slots[0], this.pageEl(under));
      this.flap.replaceChildren(...[this.ghost(front)].filter(Boolean));
    }
    this.leaf.replaceChildren(...[this.pageEl(front)].filter(Boolean));
    this.el.classList.remove('is-rest');
    this.setTurnVisible(true);
    const restShift = this.shiftFor(dir > 0 ? from : to), turnedShift = this.shiftFor(dir > 0 ? to : from);
    return { dir, to, from, restShift, turnedShift, completeAt: dir > 0 ? 'turned' : 'rest' };
  }

  /**
   * Clip the turning layers to the half-plane on the hand's side of the fold:
   * {c : (c − m)·n ≥ 0}. The box is rotated so its left edge is the fold line;
   * its content is counter-transformed so pages keep their places.
   */
  setClip(n, m) {
    const t = { x: -n.y, y: n.x };
    const half = this.BIG / 2;
    const ox = m.x - half * t.x, oy = m.y - half * t.y;
    const f = v => v.toFixed(5);
    this.clip.style.transform = `matrix(${f(n.x)},${f(n.y)},${f(t.x)},${f(t.y)},${f(ox)},${f(oy)})`;
    this.inner.style.transform = `matrix(${f(n.x)},${f(t.x)},${f(n.y)},${f(t.y)},${f(-(n.x * ox + n.y * oy))},${f(-(t.x * ox + t.y * oy))})`;
  }

  /** Render the turning leaf with the grabbed point G0 carried to P (leaf frame). */
  render(t, Praw) {
    const { W, H } = this;
    const P = constrain(Praw, t.G0, H);
    t.P = P;
    const g = fold(W, H, t.G0, P);
    const travel = Math.max(0, Math.min(1, (t.G0.x - P.x) / (2 * Math.max(1, t.G0.x))));
    if (this.mode === 'spread') {
      const shift = t.restShift + (t.turnedShift - t.restShift) * travel;
      this.spread.style.transform = `translateX(${shift.toFixed(2)}px)`;
    }
    t.geo = g;
    t.travel = travel;
    if (!g) {
      this.setClip({ x: -1, y: 0 }, { x: this.spineX + this.W + 2, y: 0 });   // nothing folded: clip nothing
      this.flap.style.visibility = 'hidden';
      this.curlPoly.setAttribute('points', ''); this.revealPoly.setAttribute('points', '');
      for (const p of this.castPolys) p.setAttribute('points', '');
      return;
    }
    const sx = this.spineX;
    this.setClip(g.n, { x: g.m.x + sx, y: g.m.y });
    if (g.lifted.length >= 3) {
      const M = backMatrix(g, W, sx);
      this.flap.style.visibility = 'visible';
      this.flap.style.transform = `matrix(${M.map(v => v.toFixed(5)).join(',')})`;
    } else {
      this.flap.style.visibility = 'hidden';
    }

    const L = light();
    const lift = Math.sin(Math.PI * Math.min(1, g.progress));
    const dark = L.shadow > 0.3;

    // Shadow on the revealed page: deepest at the fold, where the curl rises.
    const towardLight = Math.max(-1, Math.min(1, -(L.x * -g.n.x + L.y * -g.n.y)));
    const sw = (18 + 64 * lift) * (1 + 0.35 * towardLight);
    const m = { x: g.m.x + sx, y: g.m.y };
    this.revealGrad.setAttribute('x1', m.x.toFixed(2)); this.revealGrad.setAttribute('y1', m.y.toFixed(2));
    this.revealGrad.setAttribute('x2', (m.x - g.n.x * sw).toFixed(2)); this.revealGrad.setAttribute('y2', (m.y - g.n.y * sw).toFixed(2));
    const a0 = (dark ? 0.55 : 0.26) * (0.35 + 0.65 * lift);
    const shadowRGB = dark ? '0,0,0' : '24,30,40';
    this.revealStops[0].setAttribute('stop-color', `rgb(${shadowRGB})`); this.revealStops[0].setAttribute('stop-opacity', a0.toFixed(3));
    this.revealStops[1].setAttribute('stop-color', `rgb(${shadowRGB})`); this.revealStops[1].setAttribute('stop-opacity', (a0 * 0.42).toFixed(3));
    this.revealStops[2].setAttribute('stop-color', `rgb(${shadowRGB})`);
    this.revealPoly.setAttribute('points', points(g.lifted, sx));

    // The flap's own shadow, cast away from the light and longer as the leaf rises.
    // Three stacked offsets make a soft edge without a per-frame blur.
    const height = 3 + 13 * lift;
    const ox = -L.x / Math.max(0.3, L.z) * height, oy = -L.y / Math.max(0.3, L.z) * height;
    const base = (dark ? 0.42 : 0.17) * (0.4 + 0.6 * lift);
    [0.38, 0.7, 1].forEach((k, i) => {
      this.castPolys[i].setAttribute('points', g.flap.map(q => `${(q.x + sx + ox * k).toFixed(2)},${(q.y + oy * k).toFixed(2)}`).join(' '));
      this.castPolys[i].setAttribute('fill', `rgba(${shadowRGB},${(base * [0.5, 0.32, 0.2][i]).toFixed(3)})`);
    });

    // The curl: paper rolling from edge-on to face-up across a band beside the fold.
    const bw = 14 + 30 * lift;
    this.curlGrad.setAttribute('x1', m.x.toFixed(2)); this.curlGrad.setAttribute('y1', m.y.toFixed(2));
    this.curlGrad.setAttribute('x2', (m.x + g.n.x * bw).toFixed(2)); this.curlGrad.setAttribute('y2', (m.y + g.n.y * bw).toFixed(2));
    curlStops(g.n).forEach((st, i) => {
      const [, rgb, a] = st.color.match(/rgba\(([\d,]+),([\d.]+)\)/) || [];
      this.curlStops[i].setAttribute('stop-color', `rgb(${rgb})`);
      this.curlStops[i].setAttribute('stop-opacity', a);
    });
    this.curlPoly.setAttribute('points', points(g.flap, sx));
  }

  start(t) {
    this.turn = t;
    if (!this.stop) {
      this.stop = animate(dt => {
        let keep;
        try { keep = this.tick(dt); } catch (err) {
          // Never leave a leaf hanging: report, then put the book back at rest.
          console.error(err);
          this.turn = null; keep = false;
          try { this.showRest(); } catch { /* ignore */ }
        }
        if (!keep) this.stop = null;
        return keep;
      });
    }
  }

  tick(dt) {
    const t = this.turn;
    if (!t) return false;
    if (t.mode === 'auto') {
      // Clock-based, so a turn ends on time even when frames are dropped.
      const k = Math.min(1, (performance.now() - t.started) / t.duration);
      const e = 0.5 - 0.5 * Math.cos(Math.PI * k);
      this.render(t, t.path(e));
      if (k >= 1) { this.finish(true); return false; }
      return true;
    }
    const P = t.spring.step(dt);
    this.render(t, P);
    if (t.mode === 'settle' && t.spring.settled(0.5)) { this.finish(t.goal === t.completeAt); return false; }
    if (t.mode === 'peek-out' && t.spring.settled(0.5)) { this.cancel(); return false; }
    if ((t.mode === 'drag' || t.mode === 'peek') && t.spring.settled(0.3)) return false;
    return true;
  }

  finish(completed) {
    const t = this.turn;
    this.turn = null;
    if (completed && t) this.pos = t.to;
    this.flap.style.transform = '';
    this.showRest();
    this.onDragState(null);
  }

  cancel() { this.finish(false); }

  /** Finish whatever is in progress at once (a new command arrived). */
  hurry() {
    if (!this.turn) return;
    const t = this.turn;
    const done = t.mode === 'auto' || (t.mode === 'settle' && t.goal === t.completeAt);
    this.stop?.(); this.stop = null;
    this.finish(done);
  }

  restPoint(t) { return { ...t.G0 }; }
  turnedPoint(t) { return { x: -t.G0.x, y: t.G0.y }; }

  /** Where the book is going: a committed turn's destination, else where it is. */
  get target() {
    const t = this.turn;
    const committed = t && (t.mode === 'auto' || (t.mode === 'settle' && t.goal === t.completeAt));
    return committed ? t.to : this.pos;
  }

  /** Turn to a position along an eased arc (keys, clicks, contents, scrubber). */
  turnTo(to) {
    this.hurry();
    if (to === this.pos || to < 0 || to > this.last) return;
    const dir = to > this.pos ? 1 : -1;
    if (reducedMotion()) { this.pos = to; this.showRest(); return; }
    const t = this.setup({ dir, to });
    t.G0 = { x: this.W, y: this.H * 0.86 };
    const lift = this.H * 0.14;
    const arc = e => ({ x: this.W * Math.cos(Math.PI * e), y: t.G0.y - lift * Math.sin(Math.PI * e) });
    t.path = dir > 0 ? arc : (e => arc(1 - e));
    t.mode = 'auto'; t.started = performance.now();
    t.duration = AUTO_MS + Math.min(240, Math.abs(to - this.pos) * 6);
    this.render(t, t.path(0));
    this.start(t);
  }

  // Quick repeated presses accumulate: each counts from where the book is going.
  next() { this.turnTo(this.target + 1); }
  prev() { this.turnTo(this.target - 1); }
  goToPage(p) { this.turnTo(this.mode === 'spread' ? this.spreadOf(p) : p); }

  // ---------------------------------------------------------------- pointer

  local(e) {
    const r = this.spread.getBoundingClientRect();
    return { x: (e.clientX - r.left) / this.scale, y: (e.clientY - r.top) / this.scale };
  }

  zone(v, type) {
    const { W, H } = this;
    if (v.y < -8 || v.y > H + 8) return null;
    const band = type === 'mouse' ? W * 0.15 : W * 0.34;
    const corner = (cx, cy) => Math.hypot(v.x - cx, v.y - cy) < 86;
    if (this.mode === 'spread') {
      const rightEdge = 2 * W;
      if (this.hasNext() && v.x <= rightEdge + 6 && (v.x > rightEdge - band || corner(rightEdge, H) || corner(rightEdge, 0)) && v.x > W) return 'next';
      if (this.hasPrev() && v.x >= -6 && (v.x < band || corner(0, H) || corner(0, 0)) && v.x < W) return 'prev';
      return null;
    }
    if (this.hasNext() && v.x > W - band && v.x <= W + 6) return 'next';
    if (this.hasPrev() && v.x < band && v.x >= -6) return 'prev';
    return null;
  }

  /** Map the hand to the leaf: where the grabbed point should be. */
  handPoint(t, v) {
    const lx = v.x - this.spineX, ly = v.y;
    if (t.mapping === 'fold') return { x: 2 * lx - this.W, y: ly };
    return { x: lx, y: ly };
  }

  beginGrab(zone, v, mode) {
    const dir = zone === 'next' ? 1 : -1;
    const t = this.setup({ dir, to: this.pos + dir });
    const lx = v.x - this.spineX, ly = Math.max(0, Math.min(this.H, v.y));
    if (dir > 0) {
      t.G0 = { x: Math.max(this.W * 0.55, Math.min(this.W, lx)), y: ly };
      t.mapping = 'direct';
    } else if (this.mode === 'spread') {
      t.G0 = { x: Math.max(this.W * 0.55, Math.min(this.W, -lx)), y: ly };
      t.mapping = 'direct';
    } else {
      // A single page's predecessor lies off to the left; the fold tracks the finger.
      t.G0 = { x: this.W, y: ly };
      t.mapping = 'fold';
    }
    const startP = dir > 0 ? this.restPoint(t) : this.turnedPoint(t);
    t.spring = new Spring2D(mode === 'peek' ? PEEK : FOLLOW, startP);
    t.mode = mode;
    this.render(t, startP);
    return t;
  }

  onDown(e) {
    if (e.button !== 0 || e.target.closest('a, button')) return;
    const v = this.local(e);
    const z = this.zone(v, e.pointerType);
    if (!z) return;
    e.preventDefault();
    let t = this.turn;
    const dir = z === 'next' ? 1 : -1;
    if (t && t.mode === 'peek' && t.dir === dir) { t.mode = 'drag'; t.spring.configure(FOLLOW); }
    else { this.hurry(); t = this.beginGrab(z, v, 'drag'); }
    this.turn = t;
    this.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), samples: [{ ...v, t: performance.now() }], zone: z };
    this.spread.setPointerCapture?.(e.pointerId);
    t.spring.target = this.handPoint(t, v);
    this.onDragState(t);
    this.start(t);
  }

  onMove(e) {
    const v = this.local(e);
    if (this.drag && e.pointerId === this.drag.id) {
      const t = this.turn;
      if (!t) return;
      const now = performance.now();
      this.drag.samples.push({ ...v, t: now });
      if (this.drag.samples.length > 6) this.drag.samples.shift();
      t.spring.target = this.handPoint(t, v);
      this.onDragState(t);
      this.start(t);
      return;
    }
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const z = this.zone(v, 'mouse');
    this.spread.dataset.zone = z || '';
    this.peek(z, v);
  }

  onLeave() {
    if (this.drag) return;
    this.spread.dataset.zone = '';
    this.peek(null);
  }

  /** At rest, a corner under the cursor lifts slightly: the page invites the hand. */
  peek(z, v) {
    if (reducedMotion()) return;
    const t = this.turn;
    const nearCorner = v && z && (v.y > this.H - 120 || v.y < 120);
    if (z && nearCorner) {
      if (t && t.mode !== 'peek' && t.mode !== 'peek-out') return;
      const dir = z === 'next' ? 1 : -1;
      if (t && t.dir !== dir) this.cancel();
      const top = v.y < this.H / 2;
      let cur = this.turn;
      if (!cur) {
        const corner = { x: z === 'next' ? this.spineX + this.W : (this.mode === 'spread' ? 0 : 0), y: top ? 0 : this.H };
        cur = this.beginGrab(z, corner, 'peek');
        cur.G0 = { x: this.W, y: top ? 0 : this.H };
        cur.spring.value = dir > 0 ? this.restPoint(cur) : this.turnedPoint(cur);
        this.turn = cur;
      }
      cur.mode = 'peek';
      const base = dir > 0 ? this.restPoint(cur) : this.turnedPoint(cur);
      cur.spring.target = { x: base.x - dir * 44, y: base.y + (top ? 26 : -26) };
      this.start(cur);
    } else if (t && t.mode === 'peek') {
      t.mode = 'peek-out';
      t.spring.target = t.dir > 0 ? this.restPoint(t) : this.turnedPoint(t);
      this.start(t);
    }
  }

  onUp(e) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    const d = this.drag; this.drag = null;
    const t = this.turn;
    if (!t) return;
    const moved = Math.hypot(e.clientX - d.x0, e.clientY - d.y0);
    const quick = performance.now() - d.t0 < 320;
    let completed;
    if (moved < 6 && quick) {
      // A tap on the edge turns the page along the same lifted arc as a click.
      const to = this.pos + t.dir;
      this.stop?.(); this.stop = null;
      this.finish(false);
      this.turnTo(to);
      return;
    } else {
      const s0 = d.samples[0], s1 = d.samples[d.samples.length - 1];
      const vx = (s1.x - s0.x) / Math.max(1, s1.t - s0.t);   // virtual px per ms
      // A phone swipe is short; a single page turns with less travel and a lighter flick.
      const single = this.mode !== 'spread';
      const flick = Math.abs(vx) > (single ? 0.25 : 0.45) ? Math.sign(vx) : 0;
      const need = single ? 0.2 : 0.42;
      if (t.dir > 0) completed = flick < 0 || (flick === 0 && t.travel > need);
      else completed = flick > 0 || (flick === 0 && t.travel < 1 - need);
      t.spring.velocity = { x: vx * 1000 * 0.6, y: 0 };
    }
    t.goal = completed ? t.completeAt : (t.completeAt === 'turned' ? 'rest' : 'turned');
    t.mode = 'settle';
    t.spring.configure(SETTLE);
    t.spring.target = t.goal === 'turned' ? this.turnedPoint(t) : this.restPoint(t);
    this.onDragState(null);
    this.start(t);
  }

  /** Render a frozen mid-turn (QA and screenshots): ?peel=0.4 */
  freeze(progress) {
    if (!this.hasNext()) return;
    const t = this.setup({ dir: 1, to: this.pos + 1 });
    t.G0 = { x: this.W, y: this.H * 0.86 };
    const e = Math.max(0, Math.min(1, progress));
    this.turn = t;
    this.render(t, { x: this.W * Math.cos(Math.PI * e), y: t.G0.y - this.H * 0.14 * Math.sin(Math.PI * e) });
  }
}
