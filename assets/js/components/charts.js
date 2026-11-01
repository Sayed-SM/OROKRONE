/**
 * Lightweight SVG dataviz for the admin dashboard (no external dependency).
 * Area chart with gradient, horizontal bars, donut with legend.
 */
import { money, plainNumber } from '../lib/pricing.js';
import { t } from '../i18n/i18n.js';
import { esc } from '../lib/validate.js';

const NS = 'http://www.w3.org/2000/svg';

export function areaChart(host, points, { color = '#111111', height = 260 } = {}) {
  const w = 760, h = height, padX = 14, padY = 26;
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const stepX = (w - padX * 2) / Math.max(points.length - 1, 1);
  const coords = points.map((p, i) => [
    padX + i * stepX,
    h - padY - (p.value / max) * (h - padY * 2),
  ]);
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${coords[coords.length - 1][0]} ${h - padY} L${coords[0][0]} ${h - padY} Z`;
  const id = `chart-${Math.random().toString(36).slice(2, 8)}`;
  const labels = points.filter((_, i) => i % 5 === 0).map((p) => {
    const i = points.indexOf(p);
    return `<text x="${padX + i * stepX}" y="${h - 6}" font-size="10" fill="#8C8071" text-anchor="middle">${p.day.slice(5)}</text>`;
  }).join('');
  const grid = [0.25, 0.5, 0.75, 1].map((f) => {
    const y = h - padY - f * (h - padY * 2);
    return `<line x1="${padX}" x2="${w - padX}" y1="${y}" y2="${y}" stroke="#E7DECF" stroke-dasharray="3 5"/>
      <text x="${w - padX}" y="${y - 5}" font-size="10" fill="#8C8071" text-anchor="end">${plainNumber(Math.round(max * f))}</text>`;
  }).join('');
  host.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" class="chart" role="img" aria-label="${esc(t('admin.salesChart'))}">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}" stop-opacity=".32"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      ${grid}
      <path d="${area}" fill="url(#${id})"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
      ${coords.filter((_, i) => i % 5 === 0).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#fff" stroke="${color}" stroke-width="2"/>`).join('')}
      ${labels}
    </svg>
    <div class="chart-summary"><strong>${money(values.reduce((a, b) => a + b, 0))}</strong><span class="muted small">${esc(t('admin.last30'))}</span></div>`;
}

export function barChart(host, items) {
  if (!items.length) { host.innerHTML = `<p class="muted center">${esc(t('admin.noData'))}</p>`; return; }
  const max = Math.max(...items.map((i) => i.value), 1);
  host.innerHTML = `<div class="bar-chart">${items.map((item) => `
    <div class="bar-row">
      <span class="bar-label" title="${esc(item.name)}">${esc(item.name)}</span>
      <span class="bar-track"><span class="bar-fill" style="inline-size:${(item.value / max) * 100}%"></span></span>
      <strong class="bar-value">${plainNumber(item.value)}</strong>
    </div>`).join('')}</div>`;
}

const DONUT_COLORS = ['#111111', '#444444', '#777777', '#999999', '#C4C4C4'];

export function donutChart(host, items) {
  const total = items.reduce((n, i) => n + i.value, 0);
  if (!total) { host.innerHTML = `<p class="muted center">${esc(t('admin.noData'))}</p>`; return; }
  const r = 62, cx = 80, cy = 80, circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = items.map((item, i) => {
    const fraction = item.value / total;
    const dash = fraction * circumference;
    const circle = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${DONUT_COLORS[i % 5]}"
      stroke-width="20" stroke-dasharray="${dash} ${circumference - dash}"
      stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt">
      <title>${esc(t(`track.${item.status}`))}: ${item.value}</title></circle>`;
    offset += dash;
    return circle;
  }).join('');
  host.innerHTML = `
    <div class="donut-wrap">
      <svg viewBox="0 0 160 160" class="donut" role="img" aria-label="${esc(t('admin.statusDist'))}">
        ${segments}<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="26" font-weight="700" fill="#211C15">${plainNumber(total)}</text>
      </svg>
      <ul class="donut-legend">${items.map((item, i) => `
        <li><span class="legend-dot" style="background:${DONUT_COLORS[i % 5]}"></span>
          <span>${esc(t(`track.${item.status}`))}</span><strong>${plainNumber(item.value)}</strong></li>`).join('')}
      </ul>
    </div>`;
}
