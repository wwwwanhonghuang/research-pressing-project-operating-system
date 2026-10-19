// One animation loop for the whole site. It runs only while something is moving:
// when the last task finishes, no frame is requested until the next interaction.

const tasks = new Set();
let raf = 0;
let last = 0;

function frame(now) {
  const dt = last ? Math.min(64, now - last) : 16;   // springs substep internally
  last = now;
  for (const fn of [...tasks]) {
    if (fn(dt, now) === false) tasks.delete(fn);
  }
  if (tasks.size) raf = requestAnimationFrame(frame);
  else { raf = 0; last = 0; }
}

/** Run fn(dt, now) every frame until it returns false or the canceller is called. */
export function animate(fn) {
  tasks.add(fn);
  if (!raf) raf = requestAnimationFrame(frame);
  return () => tasks.delete(fn);
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
