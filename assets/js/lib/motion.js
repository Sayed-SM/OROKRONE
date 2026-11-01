import { REDUCED_MOTION } from './spring.js';

/** Small deliberate motion layer: scroll progress, reveal orchestration and photo tilt. */
export function initMotion({ tiltSelector = '.product-card' } = {}) {
  if (REDUCED_MOTION) return;
  let progress = document.querySelector('.scroll-progress');
  if (!progress) {
    progress = document.createElement('span');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.append(progress);
  }

  let scheduled = false;
  const updateProgress = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const value = max > 0 ? scrollY / max : 0;
      progress.style.transform = `scaleX(${Math.max(0, Math.min(value, 1))})`;
      scheduled = false;
    });
  };
  addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll(tiltSelector).forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.setProperty('--tilt-x', `${(x * 2.4).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(-y * 2.4).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--tilt-x');
        card.style.removeProperty('--tilt-y');
      });
    });
  }
}
