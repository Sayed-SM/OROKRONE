/**
 * Spring physics — real velocity-based integrator (no CSS keyframe fakery).
 * Used by the showcase ring rotation and the active watch lift.
 */
export const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Spring {
  constructor({ stiffness = 120, damping = 18, mass = 1, value = 0 } = {}) {
    this.k = stiffness; this.d = damping; this.m = mass;
    this.value = value; this.target = value; this.velocity = 0;
    this._raf = null; this._last = 0; this._listeners = new Set();
  }

  onUpdate(fn) { this._listeners.add(fn); fn(this.value); return () => this._listeners.delete(fn); }

  setTarget(target) {
    this.target = target;
    if (REDUCED_MOTION) { this.value = target; this.velocity = 0; this._emit(); return; }
    if (this._raf) return;
    this._last = performance.now();
    const step = (now) => {
      // clamp dt so background tabs never explode the integrator
      const dt = Math.min((now - this._last) / 1000, 1 / 30);
      this._last = now;
      const force = -this.k * (this.value - this.target) - this.d * this.velocity;
      this.velocity += (force / this.m) * dt;
      this.value += this.velocity * dt;
      if (Math.abs(this.value - this.target) < 0.0005 && Math.abs(this.velocity) < 0.0005) {
        this.value = this.target; this.velocity = 0; this._emit(); this._raf = null; return;
      }
      this._emit();
      this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  _emit() { this._listeners.forEach((fn) => fn(this.value)); }
  destroy() { if (this._raf) cancelAnimationFrame(this._raf); this._listeners.clear(); }
}

/** One-shot spring helper for numeric style properties. */
export function springTo(from, to, onUpdate, opts = {}) {
  const spring = new Spring({ value: from, stiffness: 170, damping: 22, ...opts });
  const off = spring.onUpdate(onUpdate);
  spring.setTarget(to);
  return () => { off(); spring.destroy(); };
}

export function observeReveals(root = document) {
  const items = root.querySelectorAll('.reveal');
  if (REDUCED_MOTION || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => io.observe(el));
}
