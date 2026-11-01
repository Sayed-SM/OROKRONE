/**
 * Luxury Watch Showcase — a tiered salon stage driven by a real spring.
 * Watches sit on podiums of different heights along an elliptical ring;
 * depth controls scale, lift, shadow and z-order every animation frame.
 */
import { Spring, REDUCED_MOTION } from '../lib/spring.js';
import { productArt } from '../lib/watch-svg.js';
import { L, t, onLangChange } from '../i18n/i18n.js';
import { money } from '../lib/pricing.js';
import { cart } from '../lib/cart.js';
import { icon, stars, dialog, toast } from './ui.js';
import { esc } from '../lib/validate.js';
import { CONFIG } from '../lib/config.js';

export function initShowcase(host, products) {
  const items = products.filter((p) => !p.design?.accessory).slice(0, 7);
  if (!items.length || !host) return;

  host.innerHTML = `
    <div class="arch arch-1"></div><div class="arch arch-2"></div><div class="arch arch-3"></div>
    <div class="stage-floor"><div class="floor-shadow"></div><div class="floor-rim"></div><div class="floor-top"></div></div>
    <div class="stage-items"></div>
    <div class="stage-lighting"></div><div class="stage-vignette"></div>`;
  const ring = host.querySelector('.stage-items');
  const caption = document.querySelector('.stage-caption');
  const dotsHost = document.querySelector('.stage-dots');

  ring.innerHTML = items.map((p, i) => `
    <button class="stage-item" style="--index:${i}" data-index="${i}" data-tier="${i % 3}" aria-label="${esc(L(p, 'name'))}">
      <span class="stage-tooltip"><strong>${esc(L(p, 'name'))}</strong>${money(p.price)}</span>
      <span class="stage-media">${productArt(p, { width: 180, height: 180, eager: true })}</span>
      <span class="podium"><span class="podium-top"></span><span class="podium-body"></span><span class="podium-base"></span></span>
    </button>`).join('');
  dotsHost.innerHTML = items.map((p, i) =>
    `<button role="tab" aria-selected="${i === 0}" tabindex="${i === 0 ? '0' : '-1'}" data-dot="${i}" aria-label="${esc(L(p, 'name'))}"></button>`).join('');

  const nodes = [...ring.querySelectorAll('.stage-item')];
  const n = items.length;
  const step = (Math.PI * 2) / n;
  const spring = new Spring({ stiffness: 90, damping: 16, value: 0 });
  let itemMetrics = [];
  let activeIndex = -1;
  let autoplay = !REDUCED_MOTION;
  let timer = null;
  let hovered = false;

  const radius = () => Math.min(host.clientWidth * (window.innerWidth <= 600 ? 0.31 : 0.36), 430);
  const measureItems = () => nodes.map((node) => {
    const media = node.querySelector('.stage-media');
    const podium = node.querySelector('.podium');
    return {
      itemMargin: parseFloat(getComputedStyle(node).marginBlockStart) || 0,
      mediaHeight: media.offsetHeight,
      podiumMargin: parseFloat(getComputedStyle(podium).marginBlockStart) || 0,
      podiumHeight: podium.offsetHeight,
    };
  });

  function layout(rotation) {
    let best = { depth: -2, index: 0 };
    nodes.forEach((node, i) => {
      const angle = i * step + rotation;
      const depth = Math.cos(angle);              // 1 = front, -1 = back
      const front = (depth + 1) / 2;              // 0..1
      const x = Math.sin(angle) * radius();
      const tierOffsets = window.innerWidth <= 600 ? [-24, 0, 18] : [-42, 0, 34];
      const tierY = tierOffsets[i % 3];
      const ringY = (1 - depth) * -46;
      const y = ringY + tierY;
      const scale = 0.6 + 0.45 * front + Math.pow(front, 4) * 0.08;
      node.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      node.style.zIndex = String(Math.round(front * 100) + 1);
      node.style.opacity = String(0.7 + front * 0.3);
      node.classList.toggle('is-active', front > 0.985);
      node.tabIndex = front > 0.6 ? 0 : -1;
      if (depth > best.depth) best = { depth, index: i };
    });
    if (best.index !== activeIndex) {
      activeIndex = best.index;
      renderCaption();
      dotsHost.querySelectorAll('button').forEach((d, i) => {
        const selected = i === activeIndex;
        d.classList.toggle('is-active', selected);
        d.setAttribute('aria-selected', String(selected));
        d.tabIndex = selected ? 0 : -1;
      });
    }
  }

  function renderCaption() {
    const p = items[activeIndex];
    if (!p || !caption) return;
    caption.innerHTML = `
      <span class="brand-line">${esc(p.brand)} · ${t('home.selected')}</span>
      <h2>${esc(L(p, 'name'))}</h2>
      <div>${stars(p.rating_avg, { count: p.rating_count })}</div>
      <div class="price-line"><strong>${money(p.price)}</strong>${p.old_price ? `<del>${money(p.old_price)}</del>` : ''}</div>
      <div class="caption-actions">
        <button class="btn btn-gold" data-caption-add>${icon('bag', 'icon-sm')}<span>${t('actions.addToCart')}</span></button>
        <button class="btn btn-outline" data-caption-quick>${icon('eye', 'icon-sm')}<span>${t('actions.quickView')}</span></button>
        <a class="btn btn-ghost" href="product.html?slug=${encodeURIComponent(p.slug)}">${t('actions.viewDetails')}</a>
      </div>`;
  }

  function rotateTo(index) {
    const target = -index * step;
    const current = spring.target;
    // choose the closest equivalent angle for the shortest spring travel
    const turns = Math.round((current - target) / (Math.PI * 2));
    spring.setTarget(target + turns * Math.PI * 2);
  }
  const next = () => rotateTo((activeIndex + 1) % n);
  const prev = () => rotateTo((activeIndex - 1 + n) % n);

  function quickView(p) {
    stopAutoplay();
    const spec = (label, value) => `<div><span>${label}</span>${esc(value || '—')}</div>`;
    const dlg = dialog({
      title: L(p, 'name'), size: 'lg',
      content: `
        <div class="showcase-dialog">
          <div class="art-box">${productArt(p)}</div>
          <div>
            <span class="eyebrow">${esc(p.brand)}</span>
            <h3>${esc(L(p, 'name'))}</h3>
            <div>${stars(p.rating_avg, { count: p.rating_count })}</div>
            <p class="muted" style="margin-top:.6rem">${esc(L(p, 'description'))}</p>
            <div class="spec-mini">
              ${spec(t('product.caseSize'), p.specs?.case_size)}
              ${spec(t('product.movement'), L(p.specs || {}, 'movement'))}
              ${spec(t('product.glass'), L(p.specs || {}, 'glass'))}
              ${spec(t('product.water'), p.specs?.water)}
            </div>
            <div class="price-line" style="font-size:var(--fs-xl);margin-bottom:1rem">
              <strong>${money(p.price)}</strong>${p.old_price ? `<del>${money(p.old_price)}</del>` : ''}
            </div>
            <div class="cluster">
              <button class="btn btn-gold" data-dialog-add>${icon('bag', 'icon-sm')}<span>${t('actions.addToCart')}</span></button>
              <a class="btn btn-outline" href="product.html?slug=${encodeURIComponent(p.slug)}">${t('actions.viewDetails')}</a>
            </div>
          </div>
        </div>`,
      onClose: () => startAutoplay(),
    });
    dlg.el.querySelector('[data-dialog-add]').addEventListener('click', () => {
      cart.add(p, 1);
      toast(t('actions.added'));
      dlg.close();
    });
  }

  function stopAutoplay() {
    autoplay = false;
    clearInterval(timer);
    document.querySelector('.autoplay-btn')?.classList.remove('is-on');
  }
  function startAutoplay() {
    if (REDUCED_MOTION || !autoplay) return;
    clearInterval(timer);
    timer = setInterval(() => { if (!hovered && !document.hidden) next(); }, CONFIG.AUTPLAY_MS);
    document.querySelector('.autoplay-btn')?.classList.add('is-on');
  }

  /* events */
  itemMetrics = measureItems();
  spring.onUpdate(layout);
  rotateTo(0);
  layout(0);
  startAutoplay();

  ring.addEventListener('click', (e) => {
    const node = e.target.closest('.stage-item');
    if (!node) return;
    const index = Number(node.dataset.index);
    if (index === activeIndex) quickView(items[index]);
    else { rotateTo(index); startAutoplay(); }
  });
  host.addEventListener('pointerenter', () => { hovered = true; });
  host.addEventListener('pointerleave', () => { hovered = false; });
  host.addEventListener('focusin', () => { hovered = true; });
  host.addEventListener('focusout', () => { hovered = false; });

  document.querySelector('[data-stage-next]')?.addEventListener('click', () => { next(); startAutoplay(); });
  document.querySelector('[data-stage-prev]')?.addEventListener('click', () => { prev(); startAutoplay(); });
  dotsHost.addEventListener('click', (e) => {
    const dot = e.target.closest('[data-dot]');
    if (dot) { rotateTo(Number(dot.dataset.dot)); startAutoplay(); }
  });
  document.querySelector('.autoplay-btn')?.addEventListener('click', () => {
    autoplay = !autoplay;
    if (autoplay) startAutoplay(); else stopAutoplay();
  });
  caption?.addEventListener('click', (e) => {
    const p = items[activeIndex];
    if (e.target.closest('[data-caption-add]')) { cart.add(p, 1); toast(t('actions.added')); }
    if (e.target.closest('[data-caption-quick]')) quickView(p);
  });
  host.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { next(); e.preventDefault(); }
  });
  window.addEventListener('resize', () => { itemMetrics = measureItems(); layout(spring.value); });
  onLangChange(() => { activeIndex = -1; layout(spring.value); });
}
