/**
 * Procedural luxury watch renderer (SVG).
 * Every product carries a `design` descriptor; the artwork is generated —
 * no bitmap downloads, infinitely sharp, and recoloured per model.
 */
import { PRODUCT_IMAGES } from './seed.js';
import { esc } from './validate.js';
import { getLang } from '../i18n/i18n.js';

let uid = 0;
const ART_BASE = location.pathname.includes('/admin/') ? '../' : '';

// Local images are primary; if a file is missing, reveal the procedural SVG.
if (typeof document !== 'undefined' && !window.__orokroneImageFallback) {
  window.__orokroneImageFallback = true;
  document.addEventListener('error', (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains('watch-photo') || img.dataset.fallback) return;
    img.dataset.fallback = 'true';
    let design = {};
    try { design = JSON.parse(img.dataset.design || '{}'); } catch { /* use a neutral default */ }
    const svg = renderWatch(design, { alt: esc(img.alt || 'watch') });
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, true);
}


const METALS = {
  gold: ['#F5F5F5', '#C7C7C7', '#777777', '#E5E5E5'],
  steel: ['#F4F4F4', '#C8C8C8', '#777777', '#E6E6E6'],
  rose: ['#EEEEEE', '#BDBDBD', '#696969', '#DADADA'],
  black: ['#5B5B62', '#333338', '#17171B', '#4C4C53'],
  twotone: ['#F4F4F4', '#C8C8C8', '#777777', '#E6E6E6'],
};

const DIALS = {
  champagne: ['#FFFFFF', '#E7E7E7', '#CFCFCF'],
  white: ['#FFFFFF', '#F4F4F4', '#E6E6E6'],
  black: ['#43434A', '#1B1B20', '#0C0C10'],
  navy: ['#606060', '#303030', '#111111'],
  cream: ['#FFFFFF', '#EEEEEE', '#D7D7D7'],
  pearl: ['#FFFFFF', '#ECECEC', '#D6D6D6'],
};

const STRAP_COLORS = {
  'leather-brown': ['#555555', '#303030', '#747474'],
  'leather-black': ['#2E2E2E', '#141414', '#484848'],
  'leather-blue': ['#414141', '#202020', '#5A5A5A'],
  nato: ['#565656', '#393939', '#707070'],
};

export function renderWatch(design = {}, opts = {}) {
  if (design.accessory) return renderAccessory(design.accessory, opts);
  const id = `w${++uid}`;
  const metal = METALS[design.case] || METALS.steel;
  const dial = DIALS[design.dial] || DIALS.white;
  const style = design.style || 'dress';
  const strap = design.strap || 'bracelet';
  const dark = ['black', 'navy'].includes(design.dial);
  const index = dark ? '#EAEAEA' : '#3A3A3A';
  const handMetal = design.case === 'steel' || design.case === 'black' ? '#DDE3E8' : '#BDBDBD';
  const handInk = dark ? '#F3F3F3' : '#2C2C2C';
  const bezelMetal = design.case === 'twotone' ? METALS.gold : metal;

  const defs = `
    <linearGradient id="${id}-case" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${metal[0]}"/><stop offset=".45" stop-color="${metal[1]}"/>
      <stop offset=".72" stop-color="${metal[2]}"/><stop offset="1" stop-color="${metal[3]}"/>
    </linearGradient>
    <linearGradient id="${id}-bezel" x1="0" y1="0" x2=".6" y2="1">
      <stop offset="0" stop-color="${bezelMetal[0]}"/><stop offset=".5" stop-color="${bezelMetal[1]}"/>
      <stop offset="1" stop-color="${bezelMetal[2]}"/>
    </linearGradient>
    <radialGradient id="${id}-dial" cx=".38" cy=".3" r=".95">
      <stop offset="0" stop-color="${dial[0]}"/><stop offset=".65" stop-color="${dial[1]}"/>
      <stop offset="1" stop-color="${dial[2]}"/>
    </radialGradient>
    <linearGradient id="${id}-strap" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${(STRAP_COLORS[strap] || metal)[1]}"/>
      <stop offset=".35" stop-color="${(STRAP_COLORS[strap] || metal)[2] || (STRAP_COLORS[strap] || metal)[0]}"/>
      <stop offset=".65" stop-color="${(STRAP_COLORS[strap] || metal)[0]}"/>
      <stop offset="1" stop-color="${(STRAP_COLORS[strap] || metal)[1]}"/>
    </linearGradient>
    <linearGradient id="${id}-glass" x1="0" y1="0" x2=".7" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".38"/>
      <stop offset=".55" stop-color="#fff" stop-opacity=".06"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}-shadow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#222222" stop-opacity=".28"/>
      <stop offset="1" stop-color="#222222" stop-opacity="0"/>
    </radialGradient>`;

  /* ---- strap ---- */
  let strapArt = '';
  if (STRAP_COLORS[strap]) {
    const stitch = strap === 'nato' ? 'none' : '#BDBDBD';
    strapArt = `
      <path d="M110 30 Q150 12 190 30 L186 175 L114 175 Z" fill="url(#${id}-strap)"/>
      <path d="M114 345 L186 345 L190 480 Q150 500 110 480 Z" fill="url(#${id}-strap)"/>
      ${strap === 'nato' ? `
        <path d="M118 40 H182 M116 60 H184 M115 80 H185 M114 100 H186" stroke="#3A3A3A" stroke-width="4" opacity=".35"/>
        <rect x="104" y="14" width="92" height="16" rx="6" fill="none" stroke="url(#${id}-case)" stroke-width="7"/>
        <rect x="104" y="474" width="92" height="16" rx="6" fill="none" stroke="url(#${id}-case)" stroke-width="7"/>`
      : `
        <path d="M122 40 L119 165 M178 40 L181 165 M119 355 L122 470 M181 355 L178 470"
          stroke="${stitch}" stroke-width="1.6" stroke-dasharray="5 6" opacity=".75"/>
        <rect x="106" y="18" width="88" height="26" rx="9" fill="none" stroke="url(#${id}-case)" stroke-width="6"/>
        <path d="M150 22 V44" stroke="url(#${id}-case)" stroke-width="6" stroke-linecap="round"/>
        <path d="M112 420 H188 M112 440 H188" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`}`;
  } else if (strap === 'mesh') {
    strapArt = `
      <path d="M112 26 H188 L184 176 H116 Z" fill="url(#${id}-case)"/>
      <path d="M116 344 H184 L188 494 H112 Z" fill="url(#${id}-case)"/>
      ${Array.from({ length: 22 }, (_, i) => `<path d="M${112 + i * 3.6} 28 L${108 + i * 3.6} 176 M${112 + i * 3.6} 344 L${108 + i * 3.6} 492" stroke="#888888" stroke-width=".8" opacity=".55"/>`).join('')}
      ${Array.from({ length: 16 }, (_, i) => `<path d="M112 ${36 + i * 8.6} H188 M112 ${352 + i * 8.6} H188" stroke="#999999" stroke-width=".8" opacity=".5"/>`).join('')}`;
  } else {
    // metal bracelet: 3-piece links, two-tone centre for twotone
    const centre = strap === 'twotone' || strap === 'rose-bracelet'
    ? (strap === 'rose-bracelet' ? METALS.rose : METALS.gold) : metal;
    const link = (y, h) => `
      <rect x="112" y="${y}" width="24" height="${h}" rx="4" fill="url(#${id}-case)" stroke="#00000018"/>
      <rect x="138" y="${y}" width="24" height="${h}" rx="4" fill="${centre[1]}" stroke="#00000018"/>
      <rect x="164" y="${y}" width="24" height="${h}" rx="4" fill="url(#${id}-case)" stroke="#00000018"/>
      <path d="M139 ${y + 2} H161" stroke="${centre[0]}" stroke-width="1.6" opacity=".8"/>`;
    strapArt = Array.from({ length: 7 }, (_, i) => link(20 + i * 22, 20)).join('')
      + Array.from({ length: 7 }, (_, i) => link(346 + i * 22, 20)).join('');
  }

  /* ---- complications ---- */
  const subdial = (cx, cy) => `
    <circle cx="${cx}" cy="${cy}" r="19" fill="${dial[1]}" stroke="${index}" stroke-opacity=".35"/>
    <circle cx="${cx}" cy="${cy}" r="15" fill="none" stroke="${index}" stroke-opacity=".25"/>
    <path d="M${cx} ${cy} L${cx + 6} ${cy - 9}" stroke="${handInk}" stroke-width="2" stroke-linecap="round"/>`;

  const indices = style === 'pilot'
    ? Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30 - 90) * Math.PI / 180;
      const x = 150 + Math.cos(a) * 54, y = 260 + Math.sin(a) * 54;
      return `<text x="${x}" y="${y}" fill="${index}" font-size="19" font-family="Georgia,serif"
        text-anchor="middle" dominant-baseline="central">${i === 0 ? 12 : i}</text>`;
    }).join('')
    : Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30) * Math.PI / 180;
      const inner = i % 3 === 0 ? 50 : 54, outer = 64;
      const w = i % 3 === 0 ? 4.6 : 2.6;
      return `<line x1="${150 + Math.sin(a) * inner}" y1="${260 - Math.cos(a) * inner}"
        x2="${150 + Math.sin(a) * outer}" y2="${260 - Math.cos(a) * outer}"
        stroke="${style === 'ladies' ? '#777777' : index}" stroke-width="${w}" stroke-linecap="round"/>`;
    }).join('');

  const minuteTrack = Array.from({ length: 60 }, (_, i) => {
    const a = i * 6 * Math.PI / 180;
    return `<line x1="${150 + Math.sin(a) * 67}" y1="${260 - Math.cos(a) * 67}"
      x2="${150 + Math.sin(a) * 70}" y2="${260 - Math.cos(a) * 70}"
      stroke="${index}" stroke-opacity=".45" stroke-width="1"/>`;
  }).join('');

  const diverBezel = style === 'diver' ? `
    <circle cx="150" cy="260" r="86" fill="#15151A"/>
    ${Array.from({ length: 60 }, (_, i) => {
      const a = i * 6 * Math.PI / 180;
      const big = i % 5 === 0;
      return `<line x1="${150 + Math.sin(a) * (big ? 76 : 81)}" y1="${260 - Math.cos(a) * (big ? 76 : 81)}"
        x2="${150 + Math.sin(a) * 85}" y2="${260 - Math.cos(a) * 85}" stroke="#C7CDD4" stroke-width="${big ? 2.4 : 1}"/>`;
    }).join('')}
    <path d="M150 176 l6 10 h-12 z" fill="#E9DFC8"/>` : '';

  const fluted = ['twotone', 'gold'].includes(design.case) && style !== 'chrono'
    ? Array.from({ length: 60 }, (_, i) => {
      const a = i * 6 * Math.PI / 180;
      return `<line x1="${150 + Math.sin(a) * 76}" y1="${260 - Math.cos(a) * 76}"
        x2="${150 + Math.sin(a) * 90}" y2="${260 - Math.cos(a) * 90}"
        stroke="#555555" stroke-opacity=".28" stroke-width="1.6"/>`;
    }).join('') : '';

  const chrono = style === 'chrono';
  const hands = `
    <g transform="rotate(-60 150 260)">
      <path d="M150 260 L143 244 L150 202 L157 244 Z" fill="${handInk}"/>
      <path d="M150 258 L150 214" stroke="${handMetal}" stroke-width="2"/>
    </g>
    <g transform="rotate(60 150 260)">
      <path d="M150 260 L144 242 L150 178 L156 242 Z" fill="${handInk}"/>
      <path d="M150 256 L150 190" stroke="${handMetal}" stroke-width="2"/>
    </g>
    <g transform="rotate(198 150 260)">
        <path d="M150 282 L148.4 260 L150 176 L151.6 260 Z" fill="${chrono ? '#555555' : handMetal}"/>
      <circle cx="150" cy="260" r="5.4" fill="${handMetal}"/>
    </g>
    <circle cx="150" cy="260" r="2.6" fill="${handInk}"/>`;

  const dateWindow = ['dress', 'diver'].includes(style) ? `
    <rect x="196" y="250" width="24" height="20" rx="2.5" fill="${dark ? '#0A0A0A' : '#F4F4F4'}" stroke="${index}" stroke-opacity=".4"/>
    <text x="208" y="264" font-size="13" font-family="Georgia,serif" fill="${handInk}" text-anchor="middle">1</text>` : '';

  return `<svg viewBox="0 0 300 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opts.alt || 'watch'}"
    class="watch-art" width="${opts.width || 300}" height="${opts.height || 520}">
    <defs>${defs}</defs>
    <ellipse cx="150" cy="500" rx="98" ry="16" fill="url(#${id}-shadow)"/>
    ${strapArt}
    <path d="M104 158 L118 196 M196 158 L182 196 M104 362 L118 324 M196 362 L182 324"
      stroke="url(#${id}-case)" stroke-width="15" stroke-linecap="round"/>
    ${chrono ? `
      <rect x="228" y="196" width="26" height="18" rx="6" fill="url(#${id}-case)"/>
      <rect x="228" y="306" width="26" height="18" rx="6" fill="url(#${id}-case)"/>` : ''}
    <rect x="234" y="246" width="24" height="28" rx="7" fill="url(#${id}-case)"/>
    ${Array.from({ length: 5 }, (_, i) => `<path d="M${238 + i * 4} 248 V272" stroke="#00000030" stroke-width="1.4"/>`).join('')}
    <circle cx="150" cy="260" r="94" fill="url(#${id}-case)"/>
    <circle cx="150" cy="260" r="88" fill="url(#${id}-bezel)"/>
    ${fluted}
    ${diverBezel}
    <circle cx="150" cy="260" r="74" fill="url(#${id}-dial)" stroke="#00000022"/>
    ${minuteTrack}
    ${indices}
    <path d="M150 206 l4.5 7 h-9 z" fill="${index}" opacity=".85"/>
    ${chrono ? subdial(108, 260) + subdial(150, 304) + subdial(192, 260) : ''}
    ${style === 'dress' && design.dial === 'champagne' ? subdial(150, 302) : ''}
    ${dateWindow}
    ${hands}
    <path d="M96 212 A74 74 0 0 1 190 194 A86 86 0 0 0 96 244 Z" fill="url(#${id}-glass)"/>
    <circle cx="150" cy="260" r="93" fill="none" stroke="#FFFFFF66" stroke-width="1.2"/>
  </svg>`;
}

function renderAccessory(kind, opts = {}) {
  const id = `a${++uid}`;
  const defs = `
    <linearGradient id="${id}-l" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5A5A5A"/><stop offset=".5" stop-color="#333333"/><stop offset="1" stop-color="#141414"/>
    </linearGradient>
    <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F2F2F2"/><stop offset=".5" stop-color="#C4C4C4"/><stop offset="1" stop-color="#6E6E6E"/>
    </linearGradient>
    <linearGradient id="${id}-w" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3B3B3B"/><stop offset="1" stop-color="#101010"/>
    </linearGradient>`;
  let art = '';
  if (kind === 'roll') {
    art = `
      <rect x="30" y="120" width="240" height="180" rx="26" fill="url(#${id}-l)"/>
      <rect x="30" y="60" width="240" height="90" rx="26" fill="url(#${id}-l)" opacity=".85"/>
      <rect x="46" y="150" width="208" height="130" rx="18" fill="#D8D8D8"/>
      ${[0, 1, 2].map((i) => `<rect x="${58 + i * 66}" y="160" width="54" height="110" rx="16" fill="#F3F3F3" stroke="#AAAAAA"/>`).join('')}
      <rect x="130" y="112" width="40" height="22" rx="6" fill="url(#${id}-g)"/>`;
  } else if (kind === 'straps') {
    art = ['#242424', '#555555', '#777777'].map((color, i) => `
      <g transform="translate(${48 + i * 76} 70) rotate(${-6 + i * 6})">
        <rect x="0" y="0" width="52" height="300" rx="20" fill="${color}"/>
        <rect x="8" y="10" width="36" height="280" rx="16" fill="none" stroke="#D0D0D0" stroke-width="1.6" stroke-dasharray="5 6" opacity=".65"/>
        <rect x="8" y="-8" width="36" height="20" rx="6" fill="url(#${id}-g)"/>
        ${[0, 1, 2, 3].map((j) => `<circle cx="26" cy="${210 + j * 20}" r="3.4" fill="#00000055"/>`).join('')}
      </g>`).join('');
  } else {
    art = `
      <rect x="34" y="70" width="232" height="240" rx="20" fill="url(#${id}-w)"/>
      <rect x="34" y="70" width="232" height="240" rx="20" fill="none" stroke="url(#${id}-g)" stroke-width="3"/>
      <rect x="58" y="96" width="184" height="150" rx="12" fill="#221E1A" stroke="#A0A0A0" stroke-opacity=".5"/>
      <ellipse cx="150" cy="170" rx="52" ry="60" fill="#D8D8D8"/>
      <ellipse cx="150" cy="170" rx="34" ry="42" fill="#F3F3F3"/>
      <rect x="60" y="264" width="180" height="24" rx="8" fill="#0F0D0B"/>
      <circle cx="150" cy="276" r="5" fill="url(#${id}-g)"/>`;
  }
  return `<svg viewBox="0 0 300 380" xmlns="http://www.w3.org/2000/svg" class="watch-art accessory-art"
    role="img" aria-label="${opts.alt || 'accessory'}" width="${opts.width || 300}" height="${opts.height || 380}">
    <defs>${defs}</defs>${art}</svg>`;
}

export function productArt(product, opts = {}) {
  const candidate = product.image || product.image_path || PRODUCT_IMAGES[product.id];
  // If candidate is a full URL (Supabase Storage), use it directly
  if (typeof candidate === 'string' && /^https?:\/\//.test(candidate)) {
    const alt = esc((getLang() === 'ar' ? product.name_ar : product.name_en) || product.name_en || product.name_ar || 'watch');
    return `<img class="watch-art watch-photo" src="${candidate}" alt="${alt}"
      data-design="${esc(JSON.stringify(product.design || {}))}" width="600" height="720" decoding="async"
      ${opts.eager ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
  }
  // If candidate is a filename, use local path
  const file = typeof candidate === 'string' && /^[\w.-]+\.jpe?g$/i.test(candidate) && !candidate.includes('..')
    ? candidate : null;
  if (file) {
    const alt = esc((getLang() === 'ar' ? product.name_ar : product.name_en) || product.name_en || product.name_ar || 'watch');
    return `<img class="watch-art watch-photo" src="${ART_BASE}assets/img/watches/${file}" alt="${alt}"
      data-design="${esc(JSON.stringify(product.design || {}))}" width="600" height="720" decoding="async"
      ${opts.eager ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
  }
  return renderWatch(product.design || {}, opts);
}
