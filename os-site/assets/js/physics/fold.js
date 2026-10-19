// Geometry of a page being turned by hand.
//
// Leaf frame: the spine lies on x = 0 and the leaf covers [0, W] × [0, H].
// The reader grabs a point G0 of the leaf and carries it to P. Paper does not
// stretch, so the fold is the perpendicular bisector of G0 and P: every point
// closer to G0 than to P is folded over (reflected across that line), every
// point closer to P stays flat. This is the "fold follows your hand" model.

/**
 * Keep the paper inextensible and the binding intact: neither end of the spine
 * may be folded, so |P − S| ≤ |G0 − S| for both spine ends S. Alternating
 * projections onto the two discs converge in a few steps.
 */
export function constrain(P, G0, H) {
  const ends = [{ x: 0, y: 0 }, { x: 0, y: H }];
  const p = { x: P.x, y: P.y };
  for (let i = 0; i < 5; i++) {
    for (const S of ends) {
      const r = Math.hypot(G0.x - S.x, G0.y - S.y);
      const dx = p.x - S.x, dy = p.y - S.y;
      const d = Math.hypot(dx, dy);
      if (d > r && d > 1e-6) { p.x = S.x + (dx / d) * r; p.y = S.y + (dy / d) * r; }
    }
  }
  return p;
}

/** Clip a convex polygon to the half-plane f(q) ≥ 0 (Sutherland–Hodgman). */
function clip(poly, f) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) {
      const t = fa / (fa - fb);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

/**
 * Fold the leaf. Returns null when the leaf lies flat.
 *   n      unit normal of the fold line, pointing from G0 toward P
 *   m      a point on the fold line
 *   keep   the flat part of the leaf (leaf frame)
 *   lifted the part that is folded over, before reflection (leaf frame)
 *   flap   that part after reflection, where it now lies (leaf frame)
 *   A, b   the reflection as an affine map q ↦ A·q + b
 *   progress  0 at rest, 1 when the leaf has turned fully over the spine
 */
export function fold(W, H, G0, P) {
  const dx = P.x - G0.x, dy = P.y - G0.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.35) return null;
  const n = { x: dx / d, y: dy / d };
  const m = { x: (G0.x + P.x) / 2, y: (G0.y + P.y) / 2 };
  const side = q => (q.x - m.x) * n.x + (q.y - m.y) * n.y;
  const rect = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }];
  const keep = clip(rect, q => side(q));
  const lifted = clip(rect, q => -side(q));
  const a11 = 1 - 2 * n.x * n.x, a12 = -2 * n.x * n.y, a22 = 1 - 2 * n.y * n.y;
  const mn = m.x * n.x + m.y * n.y;
  const b = { x: 2 * mn * n.x, y: 2 * mn * n.y };
  const reflect = q => ({ x: a11 * q.x + a12 * q.y + b.x, y: a12 * q.x + a22 * q.y + b.y });
  return {
    n, m, keep, lifted, flap: lifted.map(reflect),
    A: { a11, a12, a21: a12, a22 }, b,
    progress: Math.min(1, d / (2 * Math.max(1, G0.x))),
    angle: Math.atan2(n.y, n.x) * 180 / Math.PI,
  };
}

/**
 * CSS matrix placing the reverse side of the leaf. The reverse side is laid out in
 * its own box (as the page that will be read after the turn), whose point v sits on
 * the leaf at (W − v.x, v.y); that leaf point is then reflected across the fold.
 * `spineX` is the spine's x in the container that holds the turning layers.
 */
export function backMatrix(geo, W, spineX) {
  const { a11, a12, a21, a22 } = geo.A;
  return [-a11, -a21, a12, a22, a11 * W + geo.b.x + spineX, a21 * W + geo.b.y];
}

/** The lifted region expressed in the reverse side's own box coordinates. */
export function backClip(geo, W) {
  return geo.lifted.map(q => ({ x: W - q.x, y: q.y }));
}

export const polygon = pts => `polygon(${pts.map(p => `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`).join(', ')})`;
export const points = (pts, dx = 0) => pts.map(p => `${(p.x + dx).toFixed(2)},${p.y.toFixed(2)}`).join(' ');
