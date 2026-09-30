/* Cartoon cactus + pot, drawn as SVG. Units: pot base at (0,0), plant grows up (−y). */

const Plant = {
  uidN: 0,

  hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
  },

  /* Visual inputs derived from game state (quantised so re-renders are cheap to skip). */
  visual(S, opts = {}) {
    const P = S.plant, sp = SPECIES[P.species];
    const q = (v, s = 1) => Math.round(v / s) * s;
    const drought = clamp(P.dryHours / 24 / sp.dryDays, 0, 1.5);
    return {
      species: P.species,
      seed: this.hash(S.id + P.species),
      color: P.color,
      size: q(sizeFromGrowth(P.growth), 0.004),
      growth: q(P.growth, 0.5),
      stage: stageIndex(P.growth),
      pot: P.pot.size, potStyle: P.pot.style,
      moisture: q(P.moisture, 4), saucer: P.saucer > 0.5,
      shrivel: q(smoothstep(0.25, 1.1, drought), 0.05),
      rot: q(clamp((P.rot - 25) / 60, 0, 1), 0.05),
      etiol: q(P.etiol / 100, 0.05),
      burn: q(clamp((P.sunburn - 15) / 70, 0, 1), 0.05),
      cold: q(clamp(P.cold / 60, 0, 1), 0.05),
      dust: q(P.dust / 100, 0.1),
      pests: Math.ceil(P.pests),
      health: q(P.health, 5),
      bloom: P.bloom?.stage || null,
      pups: P.pups,
      lean: q(P.lean, 0.05),
      mood: opts.mood || 'content',
      face: S.settings.face !== false,
      wet: S.env.sillWet > 0.3,
    };
  },

  /* Full SVG markup. `box` = [minX, minY, w, h] in plant units. */
  svg(v, box = [-230, -580, 460, 660], extraClass = '') {
    const id = `pl${++this.uidN}`;
    const D = new Defs(id);
    const potSvg = this.pot(v, D);
    const soilY = -POT_SIZES[v.pot].w * 0.82 + POT_SIZES[v.pot].w * 0.82 * 0.2 * 0.45;
    const body = this.body(v, D, soilY);
    const sat = 0.45 + 0.55 * clamp(v.health / 100, 0, 1);
    D.add(`<filter id="${id}-sat" x="-10%" y="-10%" width="120%" height="120%"><feColorMatrix type="saturate" values="${sat.toFixed(2)}"/></filter>`);
    const lean = v.lean * 7;
    return `<svg class="plant-svg ${extraClass}" viewBox="${box.join(' ')}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>${D.out()}</defs>
      <g class="pot-g">${potSvg.back}</g>
      <g class="plant-g" style="transform-origin:0px ${soilY}px">
        <g style="transform:rotate(${lean.toFixed(2)}deg);transform-origin:0px ${soilY}px">
          <g filter="url(#${id}-sat)">${body}</g>
        </g>
      </g>
      <g class="pot-front">${potSvg.front}</g>
    </svg>`;
  },

  /* ---------------- pot ---------------- */
  pot(v, D) {
    const pw = POT_SIZES[v.pot].w, ph = pw * 0.82, rimH = ph * 0.2, rimW = pw * 1.1, baseW = pw * 0.76;
    const st = v.potStyle || 'terracotta';
    const pal = {
      terracotta: { body: '#D8733F', light: '#EE9565', dark: '#A9502A', rim: '#E4834F', line: '#6A2E14' },
      sky: { body: '#3C94D6', light: '#8CCBF3', dark: '#1F64A6', rim: '#4AA3E3', line: '#123E6B' },
      cream: { body: '#F1E6D0', light: '#FFFFFF', dark: '#CDBB98', rim: '#F7EEDD', line: '#6E5B41' },
      talavera: { body: '#F7F1E4', light: '#FFFFFF', dark: '#D7CDB8', rim: '#2F5DB8', line: '#1D326B' },
      sunset: { body: '#F08A4B', light: '#F9B27E', dark: '#C9553A', rim: '#E4566A', line: '#6B2A22' },
      midnight: { body: '#2E333B', light: '#58606C', dark: '#1B1F25', rim: '#3B414B', line: '#0F1216' },
    }[st];
    const g = D.lin([[0, pal.dark], [0.18, pal.light], [0.42, pal.body], [1, pal.dark]], 0, 0, 1, 0);
    const rg = D.lin([[0, pal.dark], [0.2, pal.light], [0.5, pal.rim], [1, pal.dark]], 0, 0, 1, 0);
    const top = -ph;
    const bodyPath = `M ${-pw / 2} ${top + rimH} L ${pw / 2} ${top + rimH} L ${baseW / 2} ${-6} Q ${baseW / 2} 0 ${baseW / 2 - 8} 0 L ${-baseW / 2 + 8} 0 Q ${-baseW / 2} 0 ${-baseW / 2} -6 Z`;
    let deco = '';
    const r = mulberry32(v.seed + 3);
    if (st === 'terracotta' || st === 'cream') {
      const dots = st === 'cream' ? 26 : 16;
      for (let i = 0; i < dots; i++) {
        const y = top + rimH + 8 + r() * (ph - rimH - 16);
        const t = (y - (top + rimH)) / (ph - rimH);
        const half = lerp(pw / 2, baseW / 2, t) - 7;
        const x = (r() * 2 - 1) * half;
        deco += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.9 + r() * 1.3).toFixed(1)}" fill="${st === 'cream' ? '#8C765A' : '#B35C33'}" opacity="${st === 'cream' ? 0.7 : 0.45}"/>`;
      }
    } else if (st === 'sky') {
      let d = `M ${-pw / 2} ${top + rimH + 6}`;
      for (let i = 0; i <= 10; i++) {
        const x = -pw / 2 + (pw * i) / 10;
        d += ` Q ${x - pw / 40} ${top + rimH + 14 + (i % 2) * 10} ${x} ${top + rimH + 8 + (i % 3) * 5}`;
      }
      d += ` L ${pw / 2} ${top + rimH} L ${-pw / 2} ${top + rimH} Z`;
      deco += `<path d="${d}" fill="#9ED3F5" opacity="0.8"/>`;
    } else if (st === 'talavera') {
      const cy = top + rimH + (ph - rimH) * 0.48;
      for (let i = -2; i <= 2; i++) {
        const cx = i * pw * 0.2;
        const s = 7 + (2 - Math.abs(i)) * 1.5;
        deco += `<g transform="translate(${cx} ${cy})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="${-s}" rx="${s * 0.45}" ry="${s * 0.8}" fill="#2F5DB8" transform="rotate(${a})"/>`).join('')}<circle r="${s * 0.45}" fill="#F0B429"/></g>`;
      }
      deco += `<path d="M ${-pw * 0.47} ${top + rimH + 7} H ${pw * 0.47}" stroke="#F0B429" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round"/>`;
      deco += `<path d="M ${-baseW * 0.46} -10 H ${baseW * 0.46}" stroke="#2F5DB8" stroke-width="4"/>`;
    } else if (st === 'sunset') {
      const cols = ['#F6C453', '#E8566B'];
      for (let k = 0; k < 2; k++) {
        const y = top + rimH + (ph - rimH) * (0.3 + k * 0.3);
        const t = (y - (top + rimH)) / (ph - rimH);
        const hw = lerp(pw / 2, baseW / 2, t);
        deco += `<path d="M ${-hw} ${y} L ${hw} ${y} L ${hw - 2} ${y + 11} L ${-hw + 2} ${y + 11} Z" fill="${cols[k]}"/>`;
      }
    } else if (st === 'midnight') {
      deco += `<path d="M ${-pw * 0.3} ${top + rimH + 10} Q ${-pw * 0.34} ${-ph * 0.45} ${-baseW * 0.28} -12" stroke="#ffffff" stroke-opacity="0.12" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    }
    const saucer = `<path d="M ${-pw * 0.62} -3 Q ${-pw * 0.62} 9 ${-pw * 0.5} 9 L ${pw * 0.5} 9 Q ${pw * 0.62} 9 ${pw * 0.62} -3 Z" fill="${pal.dark}" stroke="${pal.line}" stroke-width="2.5" stroke-linejoin="round"/>
      ${v.saucer ? `<ellipse cx="0" cy="-2" rx="${pw * 0.56}" ry="3" fill="#6FA8C9" opacity="0.85"/>` : ''}
      <path d="M ${-pw * 0.6} -3 H ${pw * 0.6}" stroke="${pal.light}" stroke-width="2" opacity="0.6"/>`;
    // Soil inside the rim
    const m = v.moisture / 100;
    const soilCol = m > 0.6 ? mix('#5A3B25', '#3A2616', (m - 0.6) / 0.4) : mix('#C9A57A', '#5A3B25', m / 0.6);
    const soilCy = top + rimH * 0.45;
    const srx = pw * 0.49, sry = pw * 0.085;
    let soil = `<ellipse cx="0" cy="${soilCy}" rx="${srx}" ry="${sry}" fill="${soilCol}"/>`;
    for (let i = 0; i < 18; i++) {
      const a = r() * TAU, rr = Math.sqrt(r()) * 0.9;
      soil += `<circle cx="${(Math.cos(a) * srx * rr).toFixed(1)}" cy="${(soilCy + Math.sin(a) * sry * rr).toFixed(1)}" r="${(0.8 + r() * 1.6).toFixed(1)}" fill="${m > 0.5 ? '#2A1A10' : '#E9D6B5'}" opacity="0.55"/>`;
    }
    if (m < 0.12) soil += `<path d="M ${-srx * 0.5} ${soilCy - 1} l 8 3 l 6 -2 M ${srx * 0.15} ${soilCy + 2} l 7 -3 l 5 2" stroke="#9C7C57" stroke-width="1.4" fill="none"/>`;
    if (m > 0.75) soil += `<ellipse cx="${-srx * 0.35}" cy="${soilCy - sry * 0.3}" rx="${srx * 0.22}" ry="${sry * 0.25}" fill="#ffffff" opacity="0.28"/>`;
    const back = `${saucer}
      <path d="${bodyPath}" fill="url(#${g})" stroke="${pal.line}" stroke-width="3" stroke-linejoin="round"/>
      <g clip-path="none">${deco}</g>
      <path d="M ${-pw * 0.36} ${top + rimH + 8} Q ${-pw * 0.4} ${-ph * 0.4} ${-baseW * 0.33} -10" stroke="#ffffff" stroke-opacity="${st === 'midnight' ? 0.1 : 0.28}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="${-rimW / 2}" y="${top}" width="${rimW}" height="${rimH}" rx="${rimH * 0.35}" fill="url(#${rg})" stroke="${pal.line}" stroke-width="3"/>
      <path d="M ${-rimW / 2 + 5} ${top + 3.5} H ${rimW / 2 - 5}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round"/>
      ${soil}`;
    // Front lip of the rim over the soil so the plant looks planted
    const front = `<path d="M ${-rimW / 2 + 1.5} ${top + rimH * 0.5} Q 0 ${top + rimH * 0.5 + sry * 1.6} ${rimW / 2 - 1.5} ${top + rimH * 0.5} L ${rimW / 2 - 1.5} ${top + rimH - 1.5} Q ${rimW / 2 - 1.5} ${top + rimH - 1.5} ${rimW / 2 - rimH * 0.35} ${top + rimH - 1.5} L ${-rimW / 2 + rimH * 0.35} ${top + rimH - 1.5} Q ${-rimW / 2 + 1.5} ${top + rimH - 1.5} ${-rimW / 2 + 1.5} ${top + rimH - 1.5} Z" fill="url(#${rg})"/>
      <path d="M ${-rimW / 2 + 1.5} ${top + rimH * 0.5} Q 0 ${top + rimH * 0.5 + sry * 1.6} ${rimW / 2 - 1.5} ${top + rimH * 0.5}" stroke="${pal.line}" stroke-width="2.4" fill="none" opacity="0.8"/>
      <rect x="${-rimW / 2}" y="${top}" width="${rimW}" height="${rimH}" rx="${rimH * 0.35}" fill="none" stroke="${pal.line}" stroke-width="3"/>`;
    return { back, front };
  },

  /* ---------------- plant bodies ---------------- */
  palette(v) {
    let base = '#5FAF55', light = '#9BD67C', dark = '#2F7A3B', line = '#1F4A26';
    if (v.species === 'christmas') { base = '#58A84E'; light = '#8ED36F'; dark = '#2D6E35'; }
    if (v.species === 'oldlady') { base = '#6FAE62'; light = '#A8D98D'; dark = '#3C7B45'; }
    if (v.species === 'bunny') { base = '#7AB85A'; light = '#B2DC86'; dark = '#437F3A'; }
    const yellow = '#B9B35A', brown = '#8A6A33';
    if (v.shrivel > 0) { base = mix(base, yellow, v.shrivel * 0.5); light = mix(light, '#D8D38A', v.shrivel * 0.45); }
    if (v.rot > 0) { dark = mix(dark, brown, v.rot * 0.6); }
    if (v.etiol > 0) { light = mix(light, '#DDEFB0', v.etiol * 0.6); base = mix(base, '#9CCB76', v.etiol * 0.4); }
    return { base, light, dark, line };
  },

  body(v, D, soilY) {
    const pal = this.palette(v);
    const fn = { barrel: this.barrel, bunny: this.bunny, saguaro: this.saguaro, moon: this.moon, oldlady: this.oldlady, christmas: this.christmas }[v.species];
    return `<g transform="translate(0 ${soilY.toFixed(1)})">${fn.call(this, v, D, pal)}</g>`;
  },

  bodyGrad(D, pal) {
    return D.rad([[0, pal.light], [0.55, pal.base], [1, pal.dark]], 0.32, 0.28, 0.85);
  },

  spineCluster(x, y, len, rot, col = '#F4D56A', n = 5) {
    let s = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(len * 0.2 + 0.8).toFixed(1)}" fill="#FFF3CF"/>`;
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      s += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(a) * len).toFixed(1)}" y2="${(y + Math.sin(a) * len).toFixed(1)}"/>`;
    }
    return `<g stroke="${col}" stroke-width="1.3" stroke-linecap="round">${s}</g>`;
  },

  conditionOverlays(v, D, clipId, cx, cy, rx, ry) {
    let o = '';
    if (v.burn > 0) o += `<ellipse cx="${cx + rx * 0.35}" cy="${cy - ry * 0.45}" rx="${rx * 0.45}" ry="${ry * 0.35}" fill="#F0DDB0" opacity="${(0.65 * v.burn).toFixed(2)}" clip-path="url(#${clipId})"/>`;
    if (v.rot > 0) {
      const rg = D.lin([[0, 'rgba(120,90,40,0)'], [1, 'rgba(120,85,35,0.95)']], 0, 0, 0, 1);
      o += `<rect x="${cx - rx}" y="${cy - ry}" width="${rx * 2}" height="${ry * 2}" fill="url(#${rg})" opacity="${(0.75 * v.rot).toFixed(2)}" clip-path="url(#${clipId})"/>`;
    }
    if (v.cold > 0) o += `<rect x="${cx - rx}" y="${cy - ry}" width="${rx * 2}" height="${ry * 2}" fill="#8C7BC9" opacity="${(0.35 * v.cold).toFixed(2)}" clip-path="url(#${clipId})"/>`;
    if (v.dust > 0.15) {
      const r = mulberry32(v.seed + 77);
      let d = '';
      for (let i = 0; i < 40 * v.dust; i++) d += `<circle cx="${(cx + (r() * 2 - 1) * rx * 0.9).toFixed(1)}" cy="${(cy + (r() * 2 - 1) * ry * 0.9).toFixed(1)}" r="${(0.6 + r()).toFixed(1)}"/>`;
      o += `<g fill="#CFC6B3" opacity="0.7" clip-path="url(#${clipId})">${d}</g>`;
    }
    if (v.pests > 0) {
      const r = mulberry32(v.seed + 99);
      for (let i = 0; i < Math.min(9, 2 + v.pests * 1.2); i++) {
        const px = cx + (r() * 1.6 - 0.8) * rx * 0.8, py = cy + (r() * 1.4 - 0.5) * ry * 0.8;
        o += `<g class="bug" transform="translate(${px.toFixed(1)} ${py.toFixed(1)})"><circle r="3.4" fill="#FFFFFF"/><circle cx="3" cy="1" r="2.6" fill="#F4F1EA"/><circle cx="-2.6" cy="1.4" r="2.4" fill="#FAF8F2"/><path d="M -4 3 l -2 2 M 4 3 l 2 2" stroke="#BDB6A6" stroke-width="0.8"/></g>`;
      }
    }
    return o;
  },

  face(v, x, y, s) {
    if (!v.face) return '';
    s = Math.max(s, 0.62);
    const m = v.mood;
    const E = (ex) => `translate(${(x + ex * s).toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`;
    const eye = (ex) => {
      if (m === 'happy' || m === 'proud') return `<path transform="${E(ex)}" d="M -4.6 1.6 Q 0 -4.6 4.6 1.6" stroke="#1B2A1E" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      if (m === 'sleepy') return `<path transform="${E(ex)}" d="M -4.4 -0.5 Q 0 3.6 4.4 -0.5" stroke="#1B2A1E" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      if (m === 'cold' || m === 'ouch') return `<path transform="${E(ex)}" d="${ex < 0 ? 'M -4 -3.5 L 3 0 L -4 3.5' : 'M 4 -3.5 L -3 0 L 4 3.5'}" stroke="#1B2A1E" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      const lid = m === 'thirsty' || m === 'sick' ? `<rect x="-5.4" y="-6.4" width="10.8" height="5" fill="var(--lid)"/>` : '';
      return `<g transform="${E(ex)}"><g class="eye"><ellipse rx="4" ry="5.2" fill="#1B2A1E"/><circle cx="1.5" cy="-2" r="1.6" fill="#fff"/>${lid}</g></g>`;
    };
    let mouth;
    const M = `translate(${x.toFixed(1)} ${(y + 7.5 * s).toFixed(1)}) scale(${s.toFixed(3)})`;
    switch (m) {
      case 'happy': mouth = `<path transform="${M}" d="M -5 -1 Q 0 6 5 -1 Q 0 2.6 -5 -1 Z" fill="#8E2F3B" stroke="#1B2A1E" stroke-width="1.8" stroke-linejoin="round"/>`; break;
      case 'proud': mouth = `<path transform="${M}" d="M -6 -1.5 Q 0 8 6 -1.5 Q 0 3 -6 -1.5 Z" fill="#8E2F3B" stroke="#1B2A1E" stroke-width="1.8" stroke-linejoin="round"/>`; break;
      case 'thirsty': mouth = `<path transform="${M}" d="M -3.2 1.5 Q 0 -1.8 3.2 1.5" stroke="#1B2A1E" stroke-width="2" fill="none" stroke-linecap="round"/><path transform="${M}" d="M -1 2 q 1 3.4 2.4 0" fill="#E57B8B"/>`; break;
      case 'soggy': case 'sick': mouth = `<path transform="${M}" d="M -5 1.5 q 1.7 -2 3.3 0 t 3.3 0 t 3.3 0" stroke="#1B2A1E" stroke-width="1.9" fill="none" stroke-linecap="round"/>`; break;
      case 'cold': mouth = `<path transform="${M}" d="M -5 0 l 2 -1.6 l 2 1.6 l 2 -1.6 l 2 1.6" stroke="#1B2A1E" stroke-width="1.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`; break;
      case 'hot': mouth = `<ellipse transform="${M}" cx="0" cy="0.8" rx="3.4" ry="3" fill="#8E2F3B" stroke="#1B2A1E" stroke-width="1.8"/>`; break;
      case 'itchy': mouth = `<path transform="${M}" d="M -4 0.5 h 8" stroke="#1B2A1E" stroke-width="2" stroke-linecap="round"/>`; break;
      case 'ouch': mouth = `<ellipse transform="${M}" cx="0" cy="0.5" rx="2.6" ry="3.2" fill="#8E2F3B" stroke="#1B2A1E" stroke-width="1.8"/>`; break;
      case 'sleepy': mouth = `<ellipse transform="${M}" cx="0" cy="0.3" rx="1.8" ry="1.3" fill="#1B2A1E"/>`; break;
      default: mouth = `<path transform="${M}" d="M -3.6 -0.4 Q 0 3.6 3.6 -0.4" stroke="#1B2A1E" stroke-width="2.1" fill="none" stroke-linecap="round"/>`;
    }
    const cheekCol = m === 'cold' ? '#9FB7E8' : m === 'hot' ? '#FF6B6B' : '#FF8FA3';
    const cr = m === 'hot' ? 1.3 : 1;
    const cheeks = `<g opacity="${m === 'hot' ? 0.75 : 0.55}" fill="${cheekCol}"><ellipse cx="${(x - 11 * s).toFixed(1)}" cy="${(y + 5 * s).toFixed(1)}" rx="${(4.2 * s * cr).toFixed(1)}" ry="${(2.6 * s * cr).toFixed(1)}"/><ellipse cx="${(x + 11 * s).toFixed(1)}" cy="${(y + 5 * s).toFixed(1)}" rx="${(4.2 * s * cr).toFixed(1)}" ry="${(2.6 * s * cr).toFixed(1)}"/></g>`;
    let extra = '';
    if (m === 'thirsty' || m === 'hot') extra += `<path transform="translate(${(x + 15 * s).toFixed(1)} ${(y - 9 * s).toFixed(1)}) scale(${s.toFixed(3)})" d="M 0 -5 Q 3.6 0 0 3 Q -3.6 0 0 -5 Z" fill="#7CC4F2" stroke="#2B6C99" stroke-width="1"/>`;
    if (m === 'soggy' || m === 'sick') extra += `<path d="M ${(x - 9 * s).toFixed(1)} ${(y - 8 * s).toFixed(1)} l ${(5 * s).toFixed(1)} ${(-2 * s).toFixed(1)} M ${(x + 9 * s).toFixed(1)} ${(y - 8 * s).toFixed(1)} l ${(-5 * s).toFixed(1)} ${(-2 * s).toFixed(1)}" stroke="#1B2A1E" stroke-width="${(1.8 * s).toFixed(1)}" stroke-linecap="round"/>`;
    if (m === 'proud') extra += `<path transform="translate(${(x - 15 * s).toFixed(1)} ${(y - 10 * s).toFixed(1)}) scale(${(s * 0.8).toFixed(3)})" d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2Z" fill="#FFE27A"/>`;
    return `<g class="face" style="--lid:${v.faceLid || '#6DB05E'}">${cheeks}${eye(-7.5)}${eye(7.5)}${mouth}${extra}</g>`;
  },

  flower(x, y, r, col, rot = 0, kind = 'cup') {
    const centre = kind === 'star' ? '#F7A21B' : '#FFE9A0';
    let petals = '';
    const n = kind === 'star' ? 8 : 6;
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * 360;
      petals += `<ellipse cx="0" cy="${(-r * 0.55).toFixed(1)}" rx="${(r * 0.32).toFixed(1)}" ry="${(r * 0.6).toFixed(1)}" transform="rotate(${a.toFixed(0)})"/>`;
    }
    return `<g class="flower" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g fill="${col}" stroke="${mix(col, '#5A2A1A', 0.45)}" stroke-width="1">${petals}</g><circle r="${(r * 0.3).toFixed(1)}" fill="${centre}" stroke="#C07A1A" stroke-width="0.8"/></g>`;
  },

  bud(x, y, r, col) {
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><ellipse rx="${(r * 0.45).toFixed(1)}" ry="${(r * 0.75).toFixed(1)}" cy="${(-r * 0.4).toFixed(1)}" fill="${col}" stroke="${mix(col, '#40220f', 0.5)}" stroke-width="1"/><path d="M ${-r * 0.4} 0 Q 0 ${r * 0.5} ${r * 0.4} 0" fill="#6DAF55"/></g>`;
  },

  /* Round, ribbed globe */
  barrel(v, D, pal) {
    const R = 112 * v.size * (1 - 0.12 * v.shrivel) * (1 + 0.04 * v.rot);
    const Ry = R * 0.9 * (1 + 0.12 * v.etiol);
    const cy = -Ry;
    const grad = this.bodyGrad(D, pal);
    const clip = D.clip(`<ellipse cx="0" cy="${cy}" rx="${R}" ry="${Ry}"/>`);
    let out = `<ellipse cx="0" cy="${cy}" rx="${R}" ry="${Ry}" fill="url(#${grad})" stroke="${pal.line}" stroke-width="3"/>`;
    const ribs = Math.round(10 + v.size * 12);
    let ribPaths = '', spines = '';
    const r = mulberry32(v.seed);
    for (let i = 0; i < ribs; i++) {
      const th = -Math.PI / 2 + ((i + 0.5) / ribs) * Math.PI;
      const sx = Math.sin(th);
      const depth = 1 + 0.5 * v.shrivel;
      ribPaths += `<path d="M 0 ${(cy - Ry).toFixed(1)} Q ${(sx * R * 1.32).toFixed(1)} ${cy.toFixed(1)} 0 ${(cy + Ry).toFixed(1)}" stroke="${pal.dark}" stroke-width="${(1.8 * depth).toFixed(1)}" fill="none" opacity="${(0.55 * Math.cos(th) + 0.2).toFixed(2)}"/>`;
      if (Math.abs(sx) < 0.93 && v.size > 0.24) {
        const steps = Math.round(3 + v.size * 5);
        for (let k = 1; k < steps; k++) {
          const t = k / steps;
          const yy = cy - Ry + t * 2 * Ry;
          const q = 1 - Math.pow(2 * t - 1, 2);
          const xx = sx * R * 0.66 * q * 1.0 + sx * R * 0.34 * Math.sqrt(q);
          if (Math.hypot(xx / R, (yy - cy) / Ry) > 0.97) continue;
          spines += this.spineCluster(xx, yy, 4 + v.size * 7, r() * TAU, '#F2CF4F', 5);
        }
      }
    }
    out += `<g clip-path="url(#${clip})">${ribPaths}</g>${spines}`;
    // Woolly crown
    out += `<ellipse cx="0" cy="${(cy - Ry * 0.93).toFixed(1)}" rx="${(R * 0.26).toFixed(1)}" ry="${(Ry * 0.1).toFixed(1)}" fill="#F7E3A3" stroke="#D8B85A" stroke-width="1.2"/>`;
    out += `<ellipse cx="${(-R * 0.4).toFixed(1)}" cy="${(cy - Ry * 0.45).toFixed(1)}" rx="${(R * 0.16).toFixed(1)}" ry="${(Ry * 0.1).toFixed(1)}" fill="#fff" opacity="0.28" transform="rotate(-30 ${(-R * 0.4).toFixed(1)} ${(cy - Ry * 0.45).toFixed(1)})"/>`;
    out += this.conditionOverlays(v, D, clip, 0, cy, R, Ry);
    if (v.bloom) {
      const n = v.bloom === 'bud' ? 5 : 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI - Math.PI;
        const fx = Math.cos(a) * R * 0.3, fy = cy - Ry * 0.93 + Math.sin(a) * Ry * 0.08;
        out += v.bloom === 'bud' ? this.bud(fx, fy, 9 + v.size * 5, '#F2D14B') : this.flower(fx, fy - 4, 9 + v.size * 7, v.bloom === 'fading' ? '#E3C67A' : SPECIES.barrel.bloom, i * 20, 'star');
      }
    }
    out += this.face({ ...v, faceLid: pal.base }, 0, cy + Ry * 0.12, clamp(R / 55, 0.62, 1.6));
    return out;
  },

  /* Old Lady: fuzzy white ball with a crown of pink flowers */
  oldlady(v, D, pal) {
    const R = 100 * v.size * (1 - 0.1 * v.shrivel) * (1 + 0.04 * v.rot);
    const Ry = R * 0.96 * (1 + 0.14 * v.etiol);
    const r = mulberry32(v.seed);
    let out = '';
    // Offsets at the base
    const pupR = R * 0.42;
    for (let i = 0; i < v.pups; i++) {
      const side = i % 2 ? 1 : -1;
      const px = side * (R * 0.95 + pupR * 0.35 * (i >> 1)), py = -pupR * 0.9;
      out += this.fuzzBall(px, py, pupR * (1 - 0.15 * (i >> 1)), pal, D, r);
    }
    out += this.fuzzBall(0, -Ry, R, pal, D, r, Ry);
    const clip = D.clip(`<ellipse cx="0" cy="${-Ry}" rx="${R}" ry="${Ry}"/>`);
    out += this.conditionOverlays(v, D, clip, 0, -Ry, R, Ry);
    if (v.bloom) {
      const n = v.bloom === 'bud' ? 7 : 11;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI + (i / (n - 1)) * Math.PI;
        const fx = Math.cos(a) * R * 0.62, fy = -Ry - Ry * 0.62 + Math.abs(Math.sin(a)) * -Ry * 0.12 + (1 - Math.abs(Math.cos(a))) * -Ry * 0.25;
        out += v.bloom === 'bud' ? this.bud(fx, fy, 7 + v.size * 5, '#E86DB3') : this.flower(fx, fy, 7 + v.size * 6, v.bloom === 'fading' ? '#C98FB0' : SPECIES.oldlady.bloom, i * 25);
      }
    }
    out += this.face({ ...v, faceLid: '#E9EFE2' }, 0, -Ry + Ry * 0.12, clamp(R / 52, 0.62, 1.6));
    return out;
  },

  fuzzBall(cx, footY, R, pal, D, r, Ry = R * 0.96) {
    const cy = footY === -Ry ? -Ry : footY;
    const grad = this.bodyGrad(D, pal);
    let s = `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${Ry}" fill="url(#${grad})" stroke="${pal.line}" stroke-width="3"/>`;
    // Tubercles in a spiral
    const n = Math.round(20 + R * 0.9);
    let tub = '';
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996, rr = Math.sqrt((i + 0.5) / n);
      const x = cx + Math.cos(a) * rr * R * 0.92, y = cy + Math.sin(a) * rr * Ry * 0.92;
      tub += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.2 + R * 0.025).toFixed(1)}" fill="${pal.dark}" opacity="0.35"/>`;
    }
    // Soft white hairs: little curls all over (denser near the rim) plus wisps off the silhouette.
    let hair = '';
    const m = Math.round(40 + R * 1.7);
    for (let i = 0; i < m; i++) {
      const a = r() * TAU, rr = Math.pow(r(), 0.45);
      const x = cx + Math.cos(a) * rr * R * 0.95, y = cy + Math.sin(a) * rr * Ry * 0.95;
      const l = 3 + r() * 5, t = r() * TAU;
      const x2 = x + Math.cos(t) * l, y2 = y + Math.sin(t) * l;
      const bx = (x + x2) / 2 + Math.cos(t + 1.57) * l * 0.6, by = (y + y2) / 2 + Math.sin(t + 1.57) * l * 0.6;
      hair += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${bx.toFixed(1)} ${by.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
    }
    const wc = Math.round(26 + R * 0.55);
    for (let i = 0; i < wc; i++) {
      const a = (i / wc) * TAU + r() * 0.2;
      const x = cx + Math.cos(a) * R * 0.98, y = cy + Math.sin(a) * Ry * 0.98;
      const l = 4 + r() * 6;
      hair += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} q ${(Math.cos(a) * l * 0.5 + (r() - 0.5) * 4).toFixed(1)} ${(Math.sin(a) * l * 0.5 - 2).toFixed(1)} ${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}"/>`;
    }
    const veil = D.rad([[0, 'rgba(255,255,255,0)'], [0.62, 'rgba(255,255,255,0.08)'], [1, 'rgba(255,255,255,0.5)']], 0.5, 0.5, 0.5);
    s += `${tub}<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${Ry}" fill="url(#${veil})"/>`;
    s += `<g stroke="#FFFFFF" stroke-width="1.25" fill="none" stroke-linecap="round" opacity="0.92">${hair}</g>`;
    s += `<ellipse cx="${(cx - R * 0.42).toFixed(1)}" cy="${(cy - Ry * 0.42).toFixed(1)}" rx="${(R * 0.2).toFixed(1)}" ry="${(Ry * 0.12).toFixed(1)}" fill="#fff" opacity="0.35" transform="rotate(-35 ${(cx - R * 0.42).toFixed(1)} ${(cy - Ry * 0.42).toFixed(1)})"/>`;
    return s;
  },

  /* Moon cactus: coloured ball grafted on a green triangular stem */
  moon(v, D, pal) {
    const col = SPECIES.moon.colors[v.color] || SPECIES.moon.colors.pink;
    const stemH = 30 + 70 * v.size, stemW = 16 + 16 * v.size;
    const R = (16 + 60 * v.size) * (1 - 0.1 * v.shrivel);
    const Ry = R * 0.9 * (1 + 0.1 * v.etiol);
    const r = mulberry32(v.seed);
    const sg = D.lin([[0, pal.dark], [0.35, pal.light], [0.6, pal.base], [1, pal.dark]], 0, 0, 1, 0);
    let out = `<path d="M ${-stemW / 2} 0 L ${-stemW / 2 + 2} ${-stemH} L ${stemW / 2 - 2} ${-stemH} L ${stemW / 2} 0 Z" fill="url(#${sg})" stroke="${pal.line}" stroke-width="3" stroke-linejoin="round"/>`;
    out += `<path d="M 0 -2 L 0 ${-stemH}" stroke="${pal.dark}" stroke-width="2" opacity="0.6"/>`;
    for (let k = 1; k < 4; k++) out += this.spineCluster(stemW * 0.28, -stemH * k / 4, 3, 0.4, '#E9E4C9', 3) + this.spineCluster(-stemW * 0.28, -stemH * k / 4 + 6, 3, 1.1, '#E9E4C9', 3);
    const cy = -stemH - Ry * 0.85;
    const cp = { base: col, light: mix(col, '#FFFFFF', 0.45), dark: mix(col, '#3A0A16', 0.4), line: mix(col, '#2A0610', 0.7) };
    const grad = this.bodyGrad(D, cp);
    // Pups on the scion
    for (let i = 0; i < v.pups; i++) {
      const a = i % 2 ? -0.35 : Math.PI + 0.35;
      const px = Math.cos(a) * R * 0.95, py = cy + Ry * 0.35 + (i >> 1) * -R * 0.35;
      out += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(R * 0.3).toFixed(1)}" fill="url(#${grad})" stroke="${cp.line}" stroke-width="2.5"/>`;
    }
    out += `<ellipse cx="0" cy="${cy}" rx="${R}" ry="${Ry}" fill="url(#${grad})" stroke="${cp.line}" stroke-width="3"/>`;
    const clip = D.clip(`<ellipse cx="0" cy="${cy}" rx="${R}" ry="${Ry}"/>`);
    const ribs = 8;
    let rp = '', sp = '';
    for (let i = 0; i < ribs; i++) {
      const th = -Math.PI / 2 + ((i + 0.5) / ribs) * Math.PI, sx = Math.sin(th);
      rp += `<path d="M 0 ${(cy - Ry).toFixed(1)} Q ${(sx * R * 1.3).toFixed(1)} ${cy.toFixed(1)} 0 ${(cy + Ry).toFixed(1)}" stroke="${cp.dark}" stroke-width="2" fill="none" opacity="${(0.5 * Math.cos(th) + 0.2).toFixed(2)}"/>`;
      if (Math.abs(sx) < 0.9 && R > 20) for (let k = 1; k < 4; k++) {
        const t = k / 4, q = 1 - Math.pow(2 * t - 1, 2);
        sp += this.spineCluster(sx * R * 0.95 * Math.sqrt(q), cy - Ry + t * 2 * Ry, 3 + R * 0.05, r() * TAU, '#F7F0DC', 4);
      }
    }
    out += `<g clip-path="url(#${clip})">${rp}</g>${sp}`;
    out += `<ellipse cx="${(-R * 0.38).toFixed(1)}" cy="${(cy - Ry * 0.45).toFixed(1)}" rx="${(R * 0.2).toFixed(1)}" ry="${(Ry * 0.12).toFixed(1)}" fill="#fff" opacity="0.4" transform="rotate(-30 ${(-R * 0.38).toFixed(1)} ${(cy - Ry * 0.45).toFixed(1)})"/>`;
    out += this.conditionOverlays(v, D, clip, 0, cy, R, Ry);
    if (v.bloom) {
      for (let i = 0; i < 3; i++) {
        const fx = (i - 1) * R * 0.35, fy = cy - Ry * 0.95 - (i === 1 ? 6 : 0);
        out += v.bloom === 'bud' ? this.bud(fx, fy, 9 + v.size * 5, '#FFB3C8') : this.flower(fx, fy - 5, 9 + v.size * 7, v.bloom === 'fading' ? '#E5B6C2' : SPECIES.moon.bloom, i * 30);
      }
    }
    out += this.face({ ...v, faceLid: col }, 0, cy + Ry * 0.12, clamp(R / 50, 0.62, 1.5));
    return out;
  },

  /* Saguaro: ribbed column with arms later in life */
  saguaro(v, D, pal) {
    const H = (38 + 250 * Math.max(0, v.size - 0.2) / 0.8) * (1 + 0.12 * v.etiol);
    const W = (24 + 30 * v.size) * (1 - 0.14 * v.shrivel) * (1 + 0.04 * v.rot);
    const grad = D.lin([[0, pal.dark], [0.3, pal.light], [0.62, pal.base], [1, pal.dark]], 0, 0, 1, 0);
    const r = mulberry32(v.seed);
    let arms = '';
    const armCount = v.stage >= 5 ? 2 : v.stage >= 4 ? 1 : 0;
    const armW = W * 0.72;
    const armDefs = [{ side: 1, at: 0.48, out: 0.95, up: 0.3 }, { side: -1, at: 0.6, out: 0.8, up: 0.22 }];
    for (let i = 0; i < armCount; i++) {
      const a = armDefs[i];
      const y0 = -H * a.at, x0 = a.side * W * 0.3;
      const x1 = a.side * (W * 0.5 + armW * a.out), y1 = y0 - H * 0.02;
      const y2 = y0 - H * a.up;
      const d = `M ${x0} ${y0} L ${x1 - a.side * armW * 0.5} ${y1} Q ${x1} ${y1} ${x1} ${y1 - armW * 0.5} L ${x1} ${y2}`;
      arms += `<path d="${d}" stroke="${pal.line}" stroke-width="${armW + 6}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      arms += `<path d="${d}" stroke="url(#${grad})" stroke-width="${armW}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      arms += `<path d="M ${x1 - armW * 0.18} ${y1 - armW * 0.5} L ${x1 - armW * 0.18} ${y2}" stroke="${pal.dark}" stroke-width="1.6" opacity="0.6"/><path d="M ${x1 + armW * 0.18} ${y1 - armW * 0.5} L ${x1 + armW * 0.18} ${y2}" stroke="${pal.dark}" stroke-width="1.6" opacity="0.6"/>`;
      if (v.bloom === 'open' || v.bloom === 'fading') arms += this.flower(x1, y2 - armW * 0.45, 7 + v.size * 4, v.bloom === 'fading' ? '#E8E2D0' : '#FFFFFF', 10);
      arms += `<g data-arm-tip="${x1.toFixed(0)},${y2.toFixed(0)}"></g>`;
    }
    const top = -H;
    const body = `M ${-W / 2} 0 L ${-W / 2} ${top + W / 2} Q ${-W / 2} ${top} 0 ${top} Q ${W / 2} ${top} ${W / 2} ${top + W / 2} L ${W / 2} 0 Z`;
    let out = arms + `<path d="${body}" fill="url(#${grad})" stroke="${pal.line}" stroke-width="3" stroke-linejoin="round"/>`;
    const clip = D.clip(`<path d="${body}"/>`);
    let ribs = '', sp = '';
    const nR = 5;
    for (let i = 0; i < nR; i++) {
      const u = ((i + 0.5) / nR) * 2 - 1;
      const x = Math.sin(u * Math.PI / 2) * W * 0.5;
      ribs += `<path d="M ${x.toFixed(1)} -2 L ${(x * 0.9).toFixed(1)} ${(top + W * 0.3).toFixed(1)}" stroke="${pal.dark}" stroke-width="${(1.8 + v.shrivel).toFixed(1)}" opacity="${(0.65 - Math.abs(u) * 0.3).toFixed(2)}"/>`;
      if (Math.abs(u) < 0.8 && v.size > 0.24) {
        const n = Math.round(3 + v.size * 8);
        for (let k = 0; k < n; k++) {
          const yy = -H * 0.08 - (k / n) * H * 0.82;
          sp += this.spineCluster(x * 1.02, yy, 3 + v.size * 3, r() * TAU, '#EFE3B8', 4);
        }
      }
    }
    out += `<g clip-path="url(#${clip})">${ribs}</g>${sp}`;
    out += `<path d="M ${(-W * 0.28).toFixed(1)} ${(top + W * 0.55).toFixed(1)} L ${(-W * 0.28).toFixed(1)} ${(-H * 0.2).toFixed(1)}" stroke="#fff" stroke-width="${(W * 0.12).toFixed(1)}" opacity="0.22" stroke-linecap="round"/>`;
    out += this.conditionOverlays(v, D, clip, 0, -H / 2, W / 2, H / 2);
    if (v.bloom) {
      for (let i = 0; i < 3; i++) {
        const fx = (i - 1) * W * 0.28, fy = top + 4 - (i === 1 ? 5 : 0);
        out += v.bloom === 'bud' ? this.bud(fx, fy, 8 + v.size * 5, '#F6F1DF') : this.flower(fx, fy - 4, 9 + v.size * 6, v.bloom === 'fading' ? '#E8E2D0' : '#FFFFFF', i * 15);
      }
    }
    const faceY = Math.max(top + W * 0.62, -H * 0.62);
    out += this.face({ ...v, faceLid: pal.base }, 0, faceY, clamp(W / 34, 0.62, 1.4));
    return out;
  },

  /* Bunny ears: branching flat pads dotted with glochids */
  bunny(v, D, pal) {
    const r = mulberry32(v.seed);
    const pads = [];
    const k = v.size;
    const main = { x: 0, y: 0, rx: 18 + 30 * k, ry: 24 + 42 * k, rot: 0, born: 0, depth: 0 };
    pads.push(main);
    const births = [10, 18, 34, 48, 70, 90, 118, 150, 185, 230];
    const queue = [main];
    let bi = 0;
    while (queue.length && bi < births.length) {
      const parent = queue.shift();
      for (const side of [-1, 1]) {
        if (bi >= births.length) break;
        const born = births[bi++];
        const grow = clamp((v.growth - born) / 22, 0, 1);
        if (grow <= 0) continue;
        const scale = (0.72 - parent.depth * 0.06) * (0.35 + 0.65 * grow);
        const ang = parent.rot + side * (28 + r() * 16);
        const pr = parent.rot * DEG;
        const tipX = parent.x + Math.sin(pr) * parent.ry * 1.75 + side * parent.rx * 0.45 * Math.cos(pr);
        const tipY = parent.y - Math.cos(pr) * parent.ry * 1.75 + side * parent.rx * 0.45 * Math.sin(pr) * 0.3;
        const child = { x: tipX, y: tipY, rx: main.rx * scale, ry: main.ry * scale, rot: ang, born, depth: parent.depth + 1 };
        pads.push(child);
        queue.push(child);
      }
    }
    const grad = this.bodyGrad(D, pal);
    let out = '';
    // Draw children first so the main pad (with the face) sits in front
    const order = pads.slice(1).reverse().concat([main]);
    for (const p of order) {
      const cx = p.x + Math.sin(p.rot * DEG) * p.ry, cy = p.y - Math.cos(p.rot * DEG) * p.ry;
      const rx = p.rx * (1 - 0.14 * v.shrivel), ry = p.ry * (1 + 0.1 * v.etiol);
      out += `<g transform="rotate(${p.rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})">`;
      out += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="url(#${grad})" stroke="${pal.line}" stroke-width="3"/>`;
      let dots = '';
      const step = 10 + 2 * k;
      for (let yy = -ry + step * 0.7; yy < ry - step * 0.4; yy += step * 0.86) {
        const row = Math.round((yy + ry) / (step * 0.86));
        for (let xx = -rx + step * 0.6 + (row % 2) * step * 0.5; xx < rx - step * 0.4; xx += step) {
          if ((xx * xx) / (rx * rx) + (yy * yy) / (ry * ry) > 0.8) continue;
          dots += `<circle cx="${(cx + xx).toFixed(1)}" cy="${(cy + yy).toFixed(1)}" r="${(1.6 + k * 0.9).toFixed(1)}"/>`;
        }
      }
      out += `<g fill="#F6E7B2" stroke="#D9BE6A" stroke-width="0.7">${dots}</g>`;
      out += `<ellipse cx="${(cx - rx * 0.35).toFixed(1)}" cy="${(cy - ry * 0.4).toFixed(1)}" rx="${(rx * 0.2).toFixed(1)}" ry="${(ry * 0.14).toFixed(1)}" fill="#fff" opacity="0.28"/>`;
      if (v.bloom && p.depth >= 1 && p.born >= births[Math.min(3, births.length - 1)] - 40) {
        const fy = cy - ry * 0.95;
        out += v.bloom === 'bud' ? this.bud(cx + rx * 0.3, fy, 8 + k * 5, '#F7E27A') : this.flower(cx + rx * 0.3, fy - 4, 8 + k * 7, v.bloom === 'fading' ? '#E5D79A' : SPECIES.bunny.bloom, 0);
      }
      out += `</g>`;
    }
    const mcx = 0, mcy = -main.ry, mrx = main.rx, mry = main.ry;
    const clip = D.clip(`<ellipse cx="${mcx}" cy="${mcy}" rx="${mrx}" ry="${mry}"/>`);
    out += this.conditionOverlays(v, D, clip, mcx, mcy, mrx, mry);
    out += this.face({ ...v, faceLid: pal.base }, 0, mcy + mry * 0.1, clamp(mrx / 30, 0.62, 1.5));
    return out;
  },

  /* Christmas cactus: arching chains of toothed segments */
  christmas(v, D, pal) {
    const r = mulberry32(v.seed);
    const k = v.size;
    const segL = 18 + 14 * k, segW = 12 + 9 * k;
    const total = Math.round(3 + v.growth / 5.5);
    const grad = D.lin([[0, pal.light], [0.5, pal.base], [1, pal.dark]], 0, 0, 1, 1);
    const segs = [];
    const stems = [{ x: 0, y: 0, a: -90, d: 0 }, { x: -segW * 0.4, y: 0, a: -128, d: 0 }, { x: segW * 0.4, y: 0, a: -52, d: 0 }];
    const frontier = stems.slice();
    let made = 0;
    while (made < total && frontier.length) {
      frontier.sort((a, b) => a.d - b.d);
      const f = frontier.shift();
      const droop = (f.a > -90 ? 1 : -1) * (10 + f.d * 6) * (f.d > 0 ? 1 : 0);
      const ang = f.a + droop * 0.6 + (r() - 0.5) * 10;
      const L = segL * (f.d === 0 ? 1.1 : 1);
      const ex = f.x + Math.cos(ang * DEG) * L, ey = f.y + Math.sin(ang * DEG) * L;
      segs.push({ x: f.x, y: f.y, ex, ey, ang, d: f.d });
      made++;
      frontier.push({ x: ex, y: ey, a: ang + (ang > -90 ? 6 : -6), d: f.d + 1 });
      if (f.d >= 1 && r() < 0.35 && made < total) frontier.push({ x: ex, y: ey, a: ang + (r() < 0.5 ? 28 : -28), d: f.d + 1 });
    }
    let out = '';
    const drawSeg = (s, wScale = 1) => {
      const w = segW * wScale * (1 - 0.18 * v.shrivel);
      const len = Math.hypot(s.ex - s.x, s.ey - s.y);
      const tx = `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${(s.ang + 90).toFixed(1)})`;
      const hw = w / 2;
      const d = `M 0 0 C ${-hw} ${-len * 0.1} ${-hw * 1.05} ${-len * 0.45} ${-hw * 0.8} ${-len * 0.55} L ${-hw * 1.15} ${-len * 0.62} L ${-hw * 0.78} ${-len * 0.78} L ${-hw * 1.1} ${-len * 0.95} L ${-hw * 0.3} ${-len} L ${hw * 0.3} ${-len} L ${hw * 1.1} ${-len * 0.95} L ${hw * 0.78} ${-len * 0.78} L ${hw * 1.15} ${-len * 0.62} L ${hw * 0.8} ${-len * 0.55} C ${hw * 1.05} ${-len * 0.45} ${hw} ${-len * 0.1} 0 0 Z`;
      return `<g transform="${tx}"><path d="${d}" fill="url(#${grad})" stroke="${pal.line}" stroke-width="2.6" stroke-linejoin="round"/><path d="M 0 ${-len * 0.1} L 0 ${-len * 0.9}" stroke="${pal.dark}" stroke-width="1.4" opacity="0.5"/></g>`;
    };
    const deep = segs.slice().sort((a, b) => b.d - a.d);
    for (const s of deep) if (s !== segs[0]) out += drawSeg(s);
    // Flowers hang from the chain tips
    if (v.bloom) {
      const tips = segs.filter((s) => !segs.some((o) => Math.abs(o.x - s.ex) < 0.1 && Math.abs(o.y - s.ey) < 0.1)).slice(0, 7);
      for (const t of tips) {
        const col = v.bloom === 'fading' ? '#C98AA5' : SPECIES.christmas.bloom;
        if (v.bloom === 'bud') out += this.bud(t.ex, t.ey, 8 + k * 4, '#F07AA8');
        else out += `<g transform="translate(${t.ex.toFixed(1)} ${t.ey.toFixed(1)}) rotate(${(t.ang + 90).toFixed(0)})"><path d="M 0 0 C -5 -10 -4 -18 -12 -24 M 0 0 C 5 -10 4 -18 12 -24" stroke="${col}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M -3 0 Q 0 -22 3 0 Z" fill="${col}"/><path d="M 0 -6 L 0 -28" stroke="#FCE0EC" stroke-width="1.2"/><circle cx="0" cy="-28" r="1.8" fill="#FFE27A"/></g>`;
      }
    }
    // Central segment with the face, drawn larger in front
    const s0 = segs[0];
    const faceSeg = { ...s0, ex: s0.x, ey: s0.y - segL * 1.35, ang: -90 };
    out += drawSeg(faceSeg, 1.55);
    const fy = -segL * 0.72;
    const clip = D.clip(`<ellipse cx="0" cy="${fy}" rx="${segW * 0.75}" ry="${segL * 0.62}"/>`);
    out += this.conditionOverlays(v, D, clip, 0, fy, segW * 0.75, segL * 0.62);
    out += this.face({ ...v, faceLid: pal.base }, 0, fy + 2, clamp(segW / 18, 0.62, 1.2));
    return out;
  },
};

/* Collects <defs> with ids unique to one SVG. */
class Defs {
  constructor(prefix) { this.p = prefix; this.n = 0; this.items = []; }
  id() { return `${this.p}-${++this.n}`; }
  add(s) { this.items.push(s); }
  lin(stops, x1 = 0, y1 = 0, x2 = 1, y2 = 1) {
    const id = this.id();
    this.items.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`);
    return id;
  }
  rad(stops, fx = 0.35, fy = 0.3, r = 0.8) {
    const id = this.id();
    this.items.push(`<radialGradient id="${id}" cx="${fx}" cy="${fy}" r="${r}" fx="${fx}" fy="${fy}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`);
    return id;
  }
  clip(shape) {
    const id = this.id();
    this.items.push(`<clipPath id="${id}">${shape}</clipPath>`);
    return id;
  }
  out() { return this.items.join(''); }
}
