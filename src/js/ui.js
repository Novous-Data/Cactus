/* HUD, dialogs, onboarding, journal, settings. */

const SVG_ICONS = {
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#F4B63A" stroke="#7A5A0C" stroke-width="1.6"/><g stroke="#E09A1A" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></g></svg>',
  drop: '<svg viewBox="0 0 24 24"><path d="M12 3 C16 9 18 12 18 15 A6 6 0 0 1 6 15 C6 12 8 9 12 3Z" fill="#6BB8EE" stroke="#1F5F8B" stroke-width="1.6"/><path d="M9.5 15.5 A3 3 0 0 0 11 18" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>',
  sprout: '<svg viewBox="0 0 24 24"><path d="M12 21 V11" stroke="#2F6B34" stroke-width="2" stroke-linecap="round"/><path d="M12 13 C12 8 8 6 4 7 C4 11 7 13 12 13Z" fill="#7BC96F" stroke="#2F6B34" stroke-width="1.5"/><path d="M12 11 C12 6 16 4 20 5 C20 9 17 11 12 11Z" fill="#9BD67C" stroke="#2F6B34" stroke-width="1.5"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20 C6 16 3 13 3 9 A4.5 4.5 0 0 1 12 7 A4.5 4.5 0 0 1 21 9 C21 13 18 16 12 20Z" fill="#F26D7D" stroke="#8E2F3B" stroke-width="1.6"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 5 Q4 3 6 3 H19 V19 H6 Q4 19 4 21 Z" fill="#E4834F" stroke="#6A2E14" stroke-width="1.6"/><path d="M4 21 Q4 19 6 19 H19 V21 Z" fill="#FBF3E4" stroke="#6A2E14" stroke-width="1.4"/><path d="M8 7 H15 M8 10 H13" stroke="#FBF3E4" stroke-width="1.6" stroke-linecap="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><path d="M12 8.5 A3.5 3.5 0 1 0 12 15.5 A3.5 3.5 0 1 0 12 8.5Z M10.5 2 h3 l.5 2.6 2 .9 2.2-1.5 2.1 2.1-1.5 2.2.9 2 2.6.5v3l-2.6.5-.9 2 1.5 2.2-2.1 2.1-2.2-1.5-2 .9-.5 2.6h-3l-.5-2.6-2-.9-2.2 1.5-2.1-2.1 1.5-2.2-.9-2L2 13.5v-3l2.6-.5.9-2L4 5.8l2.1-2.1 2.2 1.5 2-.9Z" fill="#AFC0CC" stroke="#2C3A33" stroke-width="1.4" fill-rule="evenodd"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 22 C8 16 5 13 5 9 A7 7 0 0 1 19 9 C19 13 16 16 12 22Z" fill="#E8566B" stroke="#6B2A22" stroke-width="1.6"/><circle cx="12" cy="9" r="2.6" fill="#fff"/></svg>',
};

function weatherIcon(cond, isNight) {
  const sunOrMoon = isNight
    ? '<path d="M15 4 A8 8 0 1 0 20 15 A6.5 6.5 0 1 1 15 4Z" fill="#F6E7A8" stroke="#7A6A2C" stroke-width="1.4"/>'
    : '<circle cx="12" cy="11" r="5.2" fill="#F4B63A" stroke="#7A5A0C" stroke-width="1.4"/>';
  const cloud = (x = 0, y = 0, fill = '#FFFFFF') => `<path transform="translate(${x} ${y})" d="M7 20 H18 A4 4 0 0 0 18 12 A5.5 5.5 0 0 0 7.5 11 A4.5 4.5 0 0 0 7 20Z" fill="${fill}" stroke="#4A5A66" stroke-width="1.4"/>`;
  const rainL = '<g stroke="#3C8FD6" stroke-width="1.8" stroke-linecap="round"><path d="M9 21 l-1 2.5M13 21 l-1 2.5M17 21 l-1 2.5"/></g>';
  const snowL = '<g fill="#8FB8D8"><circle cx="9" cy="22.5" r="1.3"/><circle cx="13" cy="23" r="1.3"/><circle cx="17" cy="22.5" r="1.3"/></g>';
  let body;
  switch (cond) {
    case 'clear': body = sunOrMoon; break;
    case 'mostly_clear': case 'partly': case 'haze': body = `<g transform="translate(-3 -3)">${sunOrMoon}</g>${cloud(2, 0)}`; break;
    case 'cloudy': case 'overcast': body = `${cloud(-3, -4, '#E3E8EC')}${cloud(1, 0)}`; break;
    case 'fog': body = `${cloud(0, -4, '#EEF1F3')}<g stroke="#8B98A3" stroke-width="1.8" stroke-linecap="round"><path d="M4 19 H20 M6 22 H18"/></g>`; break;
    case 'storm': body = `${cloud(0, -3, '#C9D1D8')}<path d="M13 16 l-3 5 h3 l-2 4 5-6 h-3 l2-3Z" fill="#F4C430" stroke="#7A5A0C" stroke-width="1"/>`; break;
    case 'flurries': case 'snow': body = `${cloud(0, -3)}${snowL}`; break;
    case 'sleet': case 'freezing_rain': body = `${cloud(0, -3)}${rainL}<circle cx="11" cy="23" r="1.2" fill="#8FB8D8"/>`; break;
    default: body = `${cloud(0, -3, '#DDE4EA')}${rainL}`;
  }
  return `<svg viewBox="0 0 24 26" aria-hidden="true">${body}</svg>`;
}

const UI = {
  toastQ: [],
  modalStack: [],

  init() {
    $('#btnJournal').addEventListener('click', () => this.openJournal());
    $('#btnSettings').addEventListener('click', () => this.openSettings());
    $('#btnHelp').addEventListener('click', () => this.openHelp());
    $('#btnWindow').addEventListener('click', () => Game.toggleWindow());
    $('#btnCurtain').addEventListener('click', () => Game.toggleCurtain());
    $('#weatherChip').addEventListener('click', () => this.openWeather());
    $('#needBtn').addEventListener('click', () => {
      const n = $('#needBtn').dataset.tool;
      if (n === 'window') Game.toggleWindow();
      else if (n === 'curtain') Game.toggleCurtain();
      else if (n) Tools.use(n);
    });
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && !this.modalLocked) this.closeModal(); });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalOpen() && !this.modalLocked) { this.closeModal(); return; }
      if (this.modalOpen() || e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea, select')) return;
      const k = e.key.toLowerCase();
      if (k === 'o') { e.preventDefault(); Game.toggleWindow(); }
      else if (k === 'u') { e.preventDefault(); Game.toggleCurtain(); }
      else if (k === 'j') { e.preventDefault(); this.openJournal(); }
    });
    $('#creditBtn').addEventListener('click', () => this.openCredits());
  },

  modalOpen() { return !$('#modal').hidden; },

  openModal(content, { locked = false, wide = false, cls = '' } = {}) {
    const m = $('#modal');
    const sheet = $('#modal .sheet');
    sheet.className = `sheet ${wide ? 'wide' : ''} ${cls}`;
    sheet.replaceChildren(content);
    m.hidden = false;
    this.modalLocked = locked;
    requestAnimationFrame(() => m.classList.add('show'));
    const f = sheet.querySelector('[autofocus]') || sheet;
    sheet.tabIndex = -1;
    setTimeout(() => f.focus({ preventScroll: true }), 60);
  },
  closeModal() {
    const m = $('#modal');
    m.classList.remove('show');
    this.modalLocked = false;
    setTimeout(() => { if (!m.classList.contains('show')) m.hidden = true; }, 220);
  },

  /* ---------- HUD ---------- */
  render(S) {
    const P = S.plant, sp = SPECIES[P.species];
    const n = dayNumber(S);
    const st = stageIndex(P.growth);
    $('#dayNum').textContent = n;
    $('#plantName').textContent = P.name;
    $('#plantSpecies').textContent = sp.latin;
    const next = STAGES[st + 1];
    $('#stageName').textContent = STAGES[st].name;
    $('#stageDots').innerHTML = STAGES.map((s, i) => `<i class="${i <= st ? 'on' : ''}"></i>`).join('');
    $('#plantHeight').textContent = fmtSize(S);

    const m = P.moisture;
    const mr = meterReading(m);
    this.bar('#mSoil', m / 100, mr.zone === 'DRY' ? 'dry' : mr.zone === 'WET' ? 'wet' : 'ok', `${mr.zone.toLowerCase()} · ${mr.v}/10`);
    const light = S.day.light;
    this.bar('#mLight', clamp(light / sp.lightNeed, 0, 1), light >= sp.lightNeed ? 'ok' : light > sp.lightNeed * 0.5 ? 'mid' : 'low', `${light.toFixed(1)} of ${sp.lightNeed} h`);
    this.bar('#mHealth', P.health / 100, P.health > 70 ? 'ok' : P.health > 40 ? 'mid' : 'low', `${Math.round(P.health)}`);
    const g0 = STAGES[st].at, g1 = next ? next.at : g0 + 100;
    this.bar('#mGrowth', next ? (P.growth - g0) / (g1 - g0) : 1, 'grow', next ? `to ${next.name}` : 'fully grown');

    const list = needs(S, Date.now(), Game.wx);
    const top = list[0];
    const nb = $('#needBtn');
    if (top) {
      nb.hidden = false;
      nb.dataset.tool = top.tool || '';
      $('#needText').textContent = top.text;
      const t = TOOLS.find((x) => x.id === top.tool);
      $('#needAct').textContent = t ? t.name : top.tool === 'window' ? 'Close window' : top.tool === 'curtain' ? 'Curtain' : 'OK';
      $('#needAct').hidden = !top.tool;
    } else {
      nb.hidden = false;
      nb.dataset.tool = '';
      $('#needText').textContent = Game.idleLine();
      $('#needAct').hidden = true;
    }
    $('#btnWindow').classList.toggle('on', S.env.windowOpen > 0.05);
    $('#btnWindow .tool-name').textContent = S.env.windowOpen > 0.05 ? 'Close' : 'Open';
    $('#btnCurtain').classList.toggle('on', !!S.env.curtain);
    Tools.refresh(S);
    this.renderWeather(S);
  },

  bar(sel, v, tone, label) {
    const b = $(sel);
    b.querySelector('.fill').style.width = `${(clamp(v, 0, 1) * 100).toFixed(1)}%`;
    b.dataset.tone = tone;
    b.querySelector('.val').textContent = label;
  },

  renderWeather(S) {
    const w = Game.wx;
    const chip = $('#weatherChip');
    const isNight = Game.sky?.phase === 'night' || Game.sky?.phase === 'dusk' || Game.sky?.phase === 'dawn';
    if (!w) return;
    $('#wxIcon').innerHTML = weatherIcon(w.cond, isNight);
    $('#wxTemp').textContent = w.tempC == null ? '—' : fmtTemp(w.tempC, S.settings.units);
    $('#wxCond').textContent = Game.preview ? `Preview: ${CONDITIONS[w.cond].label}` : w.label || CONDITIONS[w.cond].label;
    const src = Game.preview ? 'preview' : S.wx.mode === 'live' && S.wx.current?.src === 'live' ? 'live' : 'manual';
    chip.dataset.src = src;
    $('#wxPlace').textContent = S.home.name || 'Your window';
    $('#wxSrc').textContent = src === 'live' ? `Live ${fmtAgoShort(Date.now() - (S.wx.current?.at || Date.now()))}` : src === 'preview' ? 'Preview' : 'Set by you';
    const now = Date.now();
    const { rise, set } = sunCrossings(now, S.home.lat, S.home.lon);
    let sunTxt = '';
    if (rise && now < rise) sunTxt = `Sunrise ${fmtClock(rise)}`;
    else if (set && now < set) sunTxt = `Sunset ${fmtClock(set)}`;
    else if (rise) sunTxt = `Sunrise ${fmtClock(rise + DAY)}`;
    $('#clockTime').textContent = fmtClock(now);
    $('#clockSun').textContent = sunTxt;
  },

  setCredit(photo) {
    const p = PHOTOS[photo];
    if (!p) return;
    $('#creditBtn').textContent = `Photo: ${p.author}`;
    $('#creditBtn').title = `“${p.title}” by ${p.author}, CC BY 2.0. Click for all credits.`;
  },

  /* ---------- toasts, bubble, hint, meter ---------- */
  toast(text, tone = 'info', icon = '') {
    if (!text) return;
    const t = el('div', { class: `toast ${tone}`, role: 'status' }, icon ? el('span', { class: 'ti', html: icon }) : null, el('span', { text }));
    $('#toasts').append(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, tone === 'big' ? 5200 : 3800);
    while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
  },

  say(text, ms = 5200) {
    const b = $('#bubble');
    if (!text) { b.classList.remove('in'); return; }
    b.textContent = text;
    b.hidden = false;
    const r = Scene.plantRect();
    const bw = Math.min(260, innerWidth - 32);
    b.style.maxWidth = `${bw}px`;
    const left = clamp(r.x + r.w / 2, bw / 2 + 12, innerWidth - bw / 2 - 12);
    b.style.left = `${left}px`;
    b.style.top = `${Math.max(90, r.y - 14)}px`;
    b.classList.remove('in');
    void b.offsetWidth;
    b.classList.add('in');
    clearTimeout(this.sayT);
    this.sayT = setTimeout(() => b.classList.remove('in'), ms);
  },

  hint(text, from) {
    const h = $('#hint');
    if (!text) { if (h.dataset.from === from) h.classList.remove('in'); return; }
    h.textContent = text;
    h.dataset.from = from;
    h.classList.add('in');
  },

  showMeter(m) {
    const pop = $('#meterPop');
    const p = Scene.potTop();
    const ang = -60 + ((m.v - 1) / 9) * 120;
    pop.innerHTML = `<svg viewBox="0 0 120 84"><path d="M14 70 A48 48 0 0 1 41 27" stroke="#E0A33C" stroke-width="12" fill="none"/><path d="M43 26 A48 48 0 0 1 78 26" stroke="#6DBE5A" stroke-width="12" fill="none"/><path d="M80 27 A48 48 0 0 1 106 70" stroke="#3C8FD6" stroke-width="12" fill="none"/>
      <text x="14" y="82" font-size="9" font-weight="800" fill="#7A5A0C">DRY</text><text x="47" y="16" font-size="9" font-weight="800" fill="#2F6B34">MOIST</text><text x="92" y="82" font-size="9" font-weight="800" fill="#1F5F8B">WET</text>
      <g class="needle" style="transform:rotate(${ang}deg)"><path d="M60 70 L60 30" stroke="#D6453D" stroke-width="3.5" stroke-linecap="round"/></g><circle cx="60" cy="70" r="6" fill="#2C3A33"/></svg>
      <b>${m.v}</b><span>${m.zone}</span>`;
    pop.style.left = `${clamp(p.x + 90, 90, innerWidth - 90)}px`;
    pop.style.top = `${Math.max(80, p.y - 120)}px`;
    pop.hidden = false;
    pop.classList.remove('in');
    void pop.offsetWidth;
    pop.classList.add('in');
    clearTimeout(this.meterT);
    this.meterT = setTimeout(() => pop.classList.remove('in'), 4200);
  },

  /* ---------- onboarding ---------- */
  openWelcome() {
    const pick = { species: null, color: 'pink' };
    const cards = SPECIES_ORDER.map((id) => {
      const sp = SPECIES[id];
      const box = { bunny: [-120, -250, 240, 272], saguaro: [-95, -235, 190, 257], christmas: [-120, -225, 240, 247], moon: [-105, -245, 210, 267] }[id] || [-100, -215, 200, 237];
      const prev = Plant.svg({ ...demoVisual(id, 0.42), color: 'pink' }, box, 'mini');
      const dots = (n, icon) => `<span class="dots" title="${n} of 3">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}">${icon}</i>`).join('')}</span>`;
      const card = el('button', { class: 'species-card', type: 'button', dataset: { id }, 'aria-pressed': 'false' },
        el('div', { class: 'sc-art', html: prev }),
        el('div', { class: 'sc-body' },
          el('div', { class: 'sc-head' }, el('h3', { text: sp.name }), el('span', { class: `pill diff-${sp.difficulty.toLowerCase()}`, text: sp.difficulty })),
          el('p', { class: 'latin', text: sp.latin }),
          el('p', { class: 'blurb', text: sp.blurb }),
          el('div', { class: 'traits', html: `<span>Sun ${dots(sp.sun, SVG_ICONS.sun)}</span><span>Water ${dots(sp.water, SVG_ICONS.drop)}</span><span>Growth ${dots(sp.speed, SVG_ICONS.sprout)}</span>` })));
      card.addEventListener('click', () => {
        pick.species = id;
        $$('.species-card').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.id === id)));
        next.disabled = false;
        $('#pickFact').textContent = sp.fact;
      });
      return card;
    });
    const next = el('button', { class: 'btn primary', type: 'button', disabled: true, text: 'Next' });
    next.addEventListener('click', () => this.openNaming(pick));
    const view = el('div', { class: 'welcome' },
      el('div', { class: 'wel-head' },
        el('p', { class: 'eyebrow', text: 'Windowsill Cactus' }),
        el('h2', { text: 'Pick your baby cactus' }),
        el('p', { class: 'lede', text: 'It lives on your windowsill in real time. The weather outside is your real weather. Water it, turn it, and watch it grow day by day.' })),
      el('div', { class: 'species-grid' }, cards),
      el('div', { class: 'wel-foot' }, el('p', { class: 'fact', id: 'pickFact', text: 'Tip: Golden Barrel, Bunny Ears and Old Lady are the most forgiving.' }), next));
    this.openModal(view, { locked: true, wide: true, cls: 'onboard' });
  },

  openNaming(pick) {
    const sp = SPECIES[pick.species];
    const home = Game.pendingHome || guessHome();
    const name = el('input', { id: 'nameInput', type: 'text', maxlength: 18, value: sp.nick, autocomplete: 'off', 'aria-label': 'Cactus name' });
    const sugg = ['Spike', 'Prickles', 'Pokey', 'Sunny', 'Cleo', 'Pip', sp.nick].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6)
      .map((s) => el('button', { class: 'chip-btn', type: 'button', text: s, onclick: () => { name.value = s; } }));
    let facing = 'S';
    const face = el('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Window faces' }, ...Object.entries(WINDOW_FACING).map(([k, f]) => {
      const b = el('button', { type: 'button', class: k === facing ? 'on' : '', role: 'radio', 'aria-checked': String(k === facing), dataset: { k } }, el('b', { text: k }), el('span', { text: f.label }));
      b.addEventListener('click', () => { facing = k; $$('.seg button', face.parentElement).forEach((x) => { x.classList.toggle('on', x.dataset.k === k); x.setAttribute('aria-checked', String(x.dataset.k === k)); }); $('#faceNote').textContent = f.note; });
      return b;
    }));
    const place = el('input', { id: 'placeInput', type: 'text', value: home.guessed ? '' : home.name, placeholder: home.name !== 'your area' ? `e.g. ${home.name}` : 'City or town', autocomplete: 'address-level2', 'aria-label': 'Your city or town' });
    let colorRow = null;
    if (pick.species === 'moon') {
      colorRow = el('div', { class: 'field' }, el('label', { text: 'Colour' }), el('div', { class: 'swatches' }, ...Object.entries(SPECIES.moon.colors).map(([k, c]) => {
        const b = el('button', { type: 'button', class: `swatch ${k === pick.color ? 'on' : ''}`, style: { background: c }, 'aria-label': k, dataset: { k } });
        b.addEventListener('click', () => { pick.color = k; $$('.swatch').forEach((x) => x.classList.toggle('on', x.dataset.k === k)); });
        return b;
      })));
    }
    const back = el('button', { class: 'btn ghost', type: 'button', text: 'Back', onclick: () => this.openWelcome() });
    const go = el('button', { class: 'btn primary', type: 'button', text: 'Plant it' });
    go.addEventListener('click', () => {
      const q = place.value.trim();
      Game.plant({ species: pick.species, name: name.value.trim() || sp.nick, color: pick.color, facing, placeQuery: q });
    });
    const art = el('div', { class: 'name-art', html: Plant.svg({ ...demoVisual(pick.species, 0.3), color: pick.color, mood: 'happy' }, [-110, -220, 220, 250], 'mini') });
    const view = el('div', { class: 'naming' },
      art,
      el('div', { class: 'name-body' },
        el('p', { class: 'eyebrow', text: sp.name }),
        el('h2', { text: 'Make it yours' }),
        el('div', { class: 'field' }, el('label', { for: 'nameInput', text: 'Name' }), name, el('div', { class: 'chips' }, sugg)),
        colorRow,
        el('div', { class: 'field' }, el('label', { text: 'Which way does your window face?' }), face, el('p', { class: 'note', id: 'faceNote', text: WINDOW_FACING.S.note })),
        el('div', { class: 'field' }, el('label', { for: 'placeInput', text: 'Where is your window?' }), place, el('p', { class: 'note', text: 'Used to match the view to your real weather and sunset. Leave blank to use your time zone.' })),
        el('div', { class: 'row end' }, back, go)));
    this.openModal(view, { locked: true, wide: true, cls: 'onboard' });
  },

  /* ---------- welcome back ---------- */
  openReport(rep) {
    const S = Game.S;
    const rows = [];
    rows.push(['Away', fmtDuration(rep.away)]);
    rows.push(['Soil', `${meterReading(rep.m0).zone.toLowerCase()} → ${meterReading(S.plant.moisture).zone.toLowerCase()}`]);
    rows.push(['Grew', rep.dg > 0.05 ? `${rep.dg.toFixed(1)} growth points` : 'resting']);
    rows.push(['Health', `${Math.round(rep.h0)} → ${Math.round(S.plant.health)}`]);
    const days = S.journal.filter((j) => j.k > dayKey(Date.now() - rep.away - DAY)).slice(-5);
    const wx = days.map((j) => el('li', {}, el('span', { class: 'wx-i', html: weatherIcon(j.cond || 'partly', false) }), el('b', { text: fmtDate(new Date(`${j.k}T12:00:00`).getTime(), { weekday: 'short' }) }), el('span', { text: `${CONDITIONS[j.cond]?.label || 'Unknown'} · ${j.light.toFixed(1)} h good light` })));
    const events = rep.events.slice(0, 6).map((e) => el('li', { text: e }));
    const list = needs(S, Date.now(), Game.wx);
    const view = el('div', { class: 'report' },
      el('p', { class: 'eyebrow', text: `Day ${dayNumber(S)}` }),
      el('h2', { text: `Welcome back to ${S.plant.name}` }),
      el('dl', { class: 'stats' }, rows.map(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])),
      wx.length ? el('div', {}, el('h4', { text: 'Weather while you were away' }), el('ul', { class: 'wx-list' }, wx)) : null,
      events.length ? el('div', {}, el('h4', { text: 'What happened' }), el('ul', { class: 'events' }, events)) : null,
      el('p', { class: 'todo', text: list[0] ? `Next: ${list[0].text}` : 'Everything looks good. Just enjoy the view.' }),
      el('div', { class: 'row end' }, el('button', { class: 'btn primary', type: 'button', text: 'Back to the sill', autofocus: true, onclick: () => this.closeModal() })));
    this.openModal(view);
  },

  /* ---------- weather ---------- */
  openWeather() {
    const S = Game.S;
    const w = Game.wx;
    const cur = S.wx.current;
    const live = Live.state;
    const status = el('p', { class: 'note', id: 'liveStatus', text: Live.message || (S.wx.mode === 'live' ? 'Live weather is on.' : 'You are setting the sky by hand.') });
    const place = el('input', { id: 'wxPlaceInput', type: 'text', value: S.home.query || (S.home.guessed ? '' : S.home.name), placeholder: S.home.name, 'aria-label': 'City or town' });
    const liveBtn = el('button', { class: 'btn primary', type: 'button', text: S.wx.mode === 'live' ? 'Refresh live weather' : 'Use live weather', disabled: live === 'unavailable' });
    liveBtn.addEventListener('click', async () => {
      liveBtn.disabled = true;
      liveBtn.textContent = 'Checking AccuWeather…';
      await Game.goLive(place.value.trim());
      this.openWeather();
    });
    const chips = MANUAL_CONDITIONS.map((c) => {
      const b = el('button', { type: 'button', class: `sky-chip ${w?.cond === c && S.wx.mode !== 'live' ? 'on' : ''}` }, el('span', { html: weatherIcon(c, false) }), el('span', { text: CONDITIONS[c].label }));
      b.addEventListener('click', () => { Game.setManual(c); this.closeModal(); });
      return b;
    });
    const temp = el('input', { id: 'manualTemp', type: 'range', min: -15, max: 40, step: 1, value: Math.round(cur?.tempC ?? climateTempC(Date.now(), S.home.lat)), 'aria-label': 'Outside temperature' });
    const tempOut = el('output', { for: 'manualTemp', text: fmtTemp(Number(temp.value), S.settings.units) });
    temp.addEventListener('input', () => { tempOut.textContent = fmtTemp(Number(temp.value), S.settings.units); });
    temp.addEventListener('change', () => Game.setManualTemp(Number(temp.value)));
    const previews = el('div', { class: 'preview-row' }, ...[['clear', 'day'], ['partly', 'day'], ['rain', 'day'], ['storm', 'day'], ['snow', 'day'], ['fog', 'day'], ['clear', 'sunset'], ['clear', 'dusk'], ['clear', 'night'], ['rain', 'night']].map(([c, ph]) => {
      const b = el('button', { type: 'button', class: 'mini-btn', text: `${CONDITIONS[c].label}${ph !== 'day' ? ` · ${ph}` : ''}` });
      b.addEventListener('click', () => { Game.startPreview(c, ph); this.closeModal(); });
      return b;
    }), el('button', { type: 'button', class: 'mini-btn accent', text: 'Play all', onclick: () => { Game.playShowcase(); this.closeModal(); } }));
    const detail = [];
    if (w) {
      detail.push(['Now', `${CONDITIONS[w.cond].label}${w.tempC != null ? `, ${fmtTemp(w.tempC, S.settings.units)}` : ''}`]);
      if (w.humidity != null) detail.push(['Humidity', `${Math.round(w.humidity)}%`]);
      detail.push(['Sill temp', fmtTemp(sillTemp(sunPosition(Date.now(), S.home.lat, S.home.lon), { tempC: w.tempC ?? 18 }, S.env, Scene.sun?.direct || 0), S.settings.units)]);
      detail.push(['Source', S.wx.mode === 'live' ? `AccuWeather · ${S.home.name}` : 'Set by you']);
    }
    const view = el('div', { class: 'weather-panel' },
      el('p', { class: 'eyebrow', text: 'Outside your window' }),
      el('h2', { text: 'Weather' }),
      el('dl', { class: 'stats' }, detail.map(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])),
      el('section', {},
        el('h4', { text: 'Live weather' }),
        el('p', { class: 'note', text: 'Pulls your current conditions from the free AccuWeather connector, so the view matches the sky outside.' }),
        el('div', { class: 'row' }, place, liveBtn),
        status),
      el('section', {},
        el('h4', { text: 'Or match the sky by hand' }),
        el('div', { class: 'sky-grid' }, chips),
        el('div', { class: 'field inline' }, el('label', { for: 'manualTemp', text: 'Outside' }), temp, tempOut)),
      el('section', {}, el('h4', { text: 'Preview the views' }), previews),
      el('div', { class: 'row end' }, el('button', { class: 'btn ghost', type: 'button', text: 'Done', onclick: () => this.closeModal() })));
    this.openModal(view);
  },

  /* ---------- journal ---------- */
  openJournal() {
    const S = Game.S, P = S.plant;
    const entries = S.journal.slice().reverse();
    const today = S.day;
    const chart = this.growthChart(S);
    const rows = [
      el('li', { class: 'today' },
        el('div', { class: 'jd' }, el('b', { text: `Day ${dayNumber(S)}` }), el('span', { text: 'Today' })),
        el('div', { class: 'jx' }, el('p', { text: this.dayLine(today, true) }), today.notes.length ? el('p', { class: 'hand', text: today.notes.join(' ') }) : null)),
      ...entries.slice(0, 60).map((j) => el('li', {},
        el('div', { class: 'jd' }, el('b', { text: `Day ${j.n}` }), el('span', { text: fmtDate(new Date(`${j.k}T12:00:00`).getTime(), { month: 'short', day: 'numeric' }) })),
        el('span', { class: 'wx-i', html: weatherIcon(j.cond || 'partly', false) }),
        el('div', { class: 'jx' }, el('p', { text: this.dayLine(j) }), j.notes?.length ? el('p', { class: 'hand', text: j.notes.join(' ') }) : null))),
    ];
    const ach = Object.entries(ACHIEVEMENTS).map(([id, a]) => el('li', { class: S.ach[id] ? 'got' : '' , title: a.desc },
      el('span', { class: 'medal', html: S.ach[id] ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" fill="#F4C430" stroke="#7A5A0C" stroke-width="1.6"/><path d="M12 8.5 l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4Z" fill="#FFF3C4"/></svg>' : '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" fill="#E8E2D3" stroke="#B5AC98" stroke-width="1.6"/></svg>' }),
      el('div', {}, el('b', { text: a.name }), el('span', { text: a.desc }))));
    const view = el('div', { class: 'journal' },
      el('div', { class: 'j-head' },
        el('div', {}, el('p', { class: 'eyebrow', text: `${SPECIES[P.species].name} · planted ${fmtDate(P.plantedAt, { month: 'short', day: 'numeric', year: 'numeric' })}` }), el('h2', { text: `${P.name}’s journal` })),
        el('button', { class: 'btn ghost', type: 'button', text: 'Close', onclick: () => this.closeModal() })),
      el('div', { class: 'j-grid' },
        el('section', { class: 'j-chart' }, el('h4', { text: 'Size over time' }), chart,
          el('dl', { class: 'stats small' }, [
            [el('dt', { text: 'Now' }), el('dd', { text: fmtSize(S) })],
            [el('dt', { text: 'Stage' }), el('dd', { text: STAGES[stageIndex(P.growth)].name })],
            [el('dt', { text: 'Waterings' }), el('dd', { text: String(S.stats.waterings) })],
            [el('dt', { text: 'Flowers' }), el('dd', { text: String(P.bloomCount || 0) })],
          ])),
        el('section', { class: 'j-days' }, el('h4', { text: 'Days' }), el('ol', { class: 'days' }, rows)),
        el('section', { class: 'j-ach' }, el('h4', { text: `Badges · ${Object.keys(S.ach).length}/${Object.keys(ACHIEVEMENTS).length}` }), el('ul', { class: 'ach' }, ach))));
    this.openModal(view, { wide: true, cls: 'journal-sheet' });
  },

  dayLine(j, live = false) {
    const parts = [];
    if (j.cond) parts.push(CONDITIONS[j.cond]?.label);
    else if (live && Game.wx) parts.push(CONDITIONS[Game.wx.cond].label);
    const units = Game.S.settings.units;
    if (j.hi != null) parts.push(`${fmtTemp(j.hi, units)} / ${fmtTemp(j.lo, units)}`);
    parts.push(`${(j.light || 0).toFixed(1)} h good light`);
    const acts = Object.entries(j.acts || {}).map(([k, n]) => ({ water: 'watered', feed: 'fed', turn: 'turned', swab: 'swabbed', mist: 'misted', clean: 'wiped the glass', repot: 'repotted' }[k]) + (n > 1 ? ` ×${n}` : ''));
    if (acts.length) parts.push(acts.join(', '));
    return parts.filter(Boolean).join(' · ');
  },

  growthChart(S) {
    const pts = S.journal.map((j) => ({ n: j.n, s: j.size ?? 0.2 }));
    pts.push({ n: dayNumber(S), s: sizeFromGrowth(S.plant.growth) });
    const W = 320, H = 150, pad = { l: 34, r: 12, t: 16, b: 24 };
    const n0 = Math.min(...pts.map((p) => p.n)), n1 = Math.max(n0 + 6, ...pts.map((p) => p.n));
    const inch = S.settings.units === 'F';
    const unitLbl = inch ? 'inches' : 'cm';
    const toCm = (s) => sizeToCm(S.plant.species, s) / (inch ? 2.54 : 1);
    const maxCm = Math.max(2, ...pts.map((p) => toCm(p.s))) * 1.15;
    const X = (n) => pad.l + ((n - n0) / (n1 - n0)) * (W - pad.l - pad.r);
    const Y = (cm) => H - pad.b - (cm / maxCm) * (H - pad.t - pad.b);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.n).toFixed(1)} ${Y(toCm(p.s)).toFixed(1)}`).join(' ');
    const area = `${line} L${X(pts[pts.length - 1].n).toFixed(1)} ${Y(0)} L${X(pts[0].n).toFixed(1)} ${Y(0)} Z`;
    const ticks = [0, maxCm / 2, maxCm].map((v) => `<g><line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="grid"/><text x="${pad.l - 6}" y="${(Y(v) + 3).toFixed(1)}" text-anchor="end">${v.toFixed(1)}</text></g>`).join('');
    const last = pts[pts.length - 1];
    return el('div', { class: 'chart', html: `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Plant size by day">${ticks}
      <path d="${area}" class="area"/><path d="${line}" class="line"/>
      <circle cx="${X(last.n).toFixed(1)}" cy="${Y(toCm(last.s)).toFixed(1)}" r="4.5" class="dot"/>
      <text x="${pad.l}" y="${H - 6}">Day ${n0}</text><text x="${W - pad.r}" y="${H - 6}" text-anchor="end">Day ${n1}</text>
      <text x="${W - pad.r}" y="${pad.t - 2}" text-anchor="end" class="unit">${unitLbl}</text></svg>` });
  },

  /* ---------- settings ---------- */
  openSettings() {
    const S = Game.S;
    const seg = (label, opts, cur, onPick) => {
      const wrap = el('div', { class: 'seg small', role: 'radiogroup', 'aria-label': label });
      for (const [k, name] of opts) {
        const b = el('button', { type: 'button', class: k === cur ? 'on' : '', role: 'radio', 'aria-checked': String(k === cur), text: name });
        b.addEventListener('click', () => {
          $$('button', wrap).forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
          b.classList.add('on'); b.setAttribute('aria-checked', 'true');
          onPick(k);
        });
        wrap.append(b);
      }
      return el('div', { class: 'field' }, el('label', { text: label }), wrap);
    };
    const walls = el('div', { class: 'swatches' }, ...Object.entries(WALL_COLORS).map(([k, c]) => {
      const b = el('button', { type: 'button', class: `swatch ${S.env.wall === k ? 'on' : ''}`, style: { background: c.base }, title: c.name, 'aria-label': c.name });
      b.addEventListener('click', () => { S.env.wall = k; $$('.swatch', walls).forEach((x) => x.classList.remove('on')); b.classList.add('on'); Scene.layout(); Game.save(true); });
      return b;
    }));
    const reset = el('button', { class: 'btn danger ghost', type: 'button', text: 'Start over with a new cactus' });
    reset.addEventListener('click', () => {
      if (reset.dataset.confirm) { Game.reset(); return; }
      reset.dataset.confirm = '1';
      reset.textContent = `Tap again to say goodbye to ${S.plant.name}`;
      setTimeout(() => { reset.dataset.confirm = ''; reset.textContent = 'Start over with a new cactus'; }, 4000);
    });
    const view = el('div', { class: 'settings' },
      el('p', { class: 'eyebrow', text: 'Windowsill Cactus' }),
      el('h2', { text: 'Settings' }),
      seg('Temperature', [['F', '°F'], ['C', '°C']], S.settings.units, (k) => { S.settings.units = k; Game.refresh(); Game.save(true); }),
      seg('Window faces', Object.entries(WINDOW_FACING).map(([k, f]) => [k, f.label]), S.env.facing, (k) => { S.env.facing = k; Game.refresh(); Game.save(true); }),
      seg('Cactus face', [['on', 'Show'], ['off', 'Hide']], S.settings.face === false ? 'off' : 'on', (k) => { S.settings.face = k === 'on'; Game.refresh(); Game.save(true); }),
      seg('Sound', [['on', 'On'], ['off', 'Off']], S.settings.sound ? 'on' : 'off', (k) => { S.settings.sound = k === 'on'; Audio2.enable(S.settings.sound); Game.save(true); }),
      el('div', { class: 'field' }, el('label', { text: 'Wall colour' }), walls),
      el('p', { class: 'note', text: Store.cloudOn ? 'Your cactus is saved to your Claude account, so it follows you between devices.' : 'Your cactus is saved in this browser.' }),
      el('div', { class: 'row between' }, el('div', { class: 'row', style: { marginTop: 0 } }, el('button', { class: 'btn ghost', type: 'button', text: 'How to play', onclick: () => this.openHelp() }), el('button', { class: 'btn ghost', type: 'button', text: 'Photo credits', onclick: () => this.openCredits() })), reset),
      el('div', { class: 'row end' }, el('button', { class: 'btn primary', type: 'button', text: 'Done', onclick: () => this.closeModal() })));
    this.openModal(view);
  },

  openHelp() {
    const step = (icon, title, text) => el('li', {}, el('span', { class: 'hi', html: icon }), el('div', {}, el('b', { text: title }), el('span', { text })));
    const view = el('div', { class: 'help' },
      el('p', { class: 'eyebrow', text: 'Windowsill Cactus' }),
      el('h2', { text: 'How to play' }),
      el('ol', {},
        step(ICONS.water, 'Water, then wait', 'Give a deep soak only when the soil is completely dry. The Soil bar and the moisture meter tell you. Too much water rots roots.'),
        step(SVG_ICONS.sun, 'Light comes from your real sky', 'Sunny days fill the Light bar faster than cloudy ones. Set which way your window faces in Settings. The lamp helps on dark days.'),
        step(ICONS.turn, 'Turn the pot', 'Cacti lean toward the window. A quarter turn every few days keeps growth straight.'),
        step(SVG_ICONS.sprout, 'It grows in real time', 'Every real day is a day on the sill. Come back daily to see it grow, bloom, and fill the journal.'),
        step(ICONS.window, 'Use the window', 'Drag the lower sash, or press Open, for fresh air on mild days. Close it when rain or cold comes in.'),
        step(ICONS.repot, 'Repot when crowded', 'When the roots fill the pot, move up a size. Milestones unlock new pot styles.')),
      el('p', { class: 'keys', html: 'Tap a tool to use it, or drag it onto your cactus. Keys: <kbd>W</kbd> water · <kbd>M</kbd> meter · <kbd>T</kbd> turn · <kbd>F</kbd> feed · <kbd>O</kbd> window · <kbd>J</kbd> journal' }),
      el('div', { class: 'row end' }, el('button', { class: 'btn primary', type: 'button', text: 'Got it', onclick: () => this.closeModal() })));
    this.openModal(view);
  },

  openCredits() {
    const items = Object.entries(PHOTOS).map(([k, p]) => el('li', {}, el('a', { href: p.url, target: '_blank', rel: 'noopener', text: `“${p.title}”` }), ` by ${p.author}`));
    const view = el('div', { class: 'credits' },
      el('p', { class: 'eyebrow', text: 'The view outside' }),
      el('h2', { text: 'Photo credits' }),
      el('p', { class: 'note', html: 'Real photographs from the <a href="https://storage.googleapis.com/openimages/web/index.html" target="_blank" rel="noopener">Open Images</a> collection, each licensed <a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noopener">CC BY 2.0</a>. They were resized, lightly colour-adjusted, and are tinted in-game for time of day.' }),
      el('ul', { class: 'credit-list' }, items),
      el('p', { class: 'note', text: 'Live conditions come from the AccuWeather connector when it is connected.' }),
      el('div', { class: 'row end' }, el('button', { class: 'btn primary', type: 'button', text: 'Close', onclick: () => this.closeModal() })));
    this.openModal(view);
  },

  openRepot() {
    const S = Game.S, P = S.plant;
    let size = Math.min(3, P.pot.size + (sizeFromGrowth(P.growth) > POT_SIZES[P.pot.size].cap * 0.8 ? 1 : 0));
    let style = P.pot.style;
    const preview = el('div', { class: 'repot-art' });
    const draw = () => {
      const v = Plant.visual(S, { mood: 'happy' });
      preview.innerHTML = Plant.svg({ ...v, pot: size, potStyle: style }, [-150, -330, 300, 360], 'mini');
    };
    const sizes = el('div', { class: 'seg small' }, ...POT_SIZES.map((p, i) => {
      const b = el('button', { type: 'button', class: i === size ? 'on' : '', disabled: i < P.pot.size, text: `${p.name} ${p.cm} cm` });
      b.addEventListener('click', () => { size = i; $$('button', sizes).forEach((x, k) => x.classList.toggle('on', k === i)); draw(); });
      return b;
    }));
    const styles = el('div', { class: 'pot-grid' }, ...Object.entries(POT_STYLES).map(([k, p]) => {
      const open = !p.unlock || S.ach[p.unlock];
      const b = el('button', { type: 'button', class: `pot-opt ${k === style ? 'on' : ''}`, disabled: !open, title: open ? p.name : `Locked: ${p.how}` },
        el('span', { class: 'pot-dot', dataset: { style: k } }), el('b', { text: p.name }), el('small', { text: open ? 'Unlocked' : p.how }));
      b.addEventListener('click', () => { style = k; $$('.pot-opt', styles).forEach((x) => x.classList.remove('on')); b.classList.add('on'); draw(); });
      return b;
    }));
    const cap = POT_SIZES[P.pot.size].cap, s = sizeFromGrowth(P.growth);
    const status = s > cap ? 'The roots have filled this pot. Go up one size.' : s > cap * 0.8 ? 'Getting snug. A bigger pot soon.' : 'Plenty of room for now. You can still change the pot style.';
    const go = el('button', { class: 'btn primary', type: 'button', text: 'Repot' });
    go.addEventListener('click', () => {
      const res = Actions.repot(S, size, style);
      if (size > 0 && res) unlock(S, 'repotted', Game.emit);
      this.closeModal();
      Scene.squish();
      FX.sparkle(Scene.potTop().x, Scene.potTop().y, '#E4834F', 14);
      Game.afterAction(res);
      Scene.updateLight(true);
    });
    const view = el('div', { class: 'repot' },
      preview,
      el('div', {},
        el('p', { class: 'eyebrow', text: 'Repot' }),
        el('h2', { text: 'A new home' }),
        el('p', { class: 'note', text: status }),
        el('div', { class: 'field' }, el('label', { text: 'Pot size' }), sizes),
        el('div', { class: 'field' }, el('label', { text: 'Style' }), styles),
        el('div', { class: 'row end' }, el('button', { class: 'btn ghost', type: 'button', text: 'Cancel', onclick: () => this.closeModal() }), go)));
    draw();
    this.openModal(view, { wide: true });
  },
};

/* A made-up visual state for previews (species cards). */
function demoVisual(species, size) {
  const growth = -115 * Math.log(1 - (size - 0.2) / 0.8);
  return {
    species, seed: Plant.hash(species + 'demo'), color: 'pink', size, growth, stage: stageIndex(growth),
    pot: size > 0.5 ? 1 : 0, potStyle: 'terracotta', moisture: 40, saucer: false, shrivel: 0, rot: 0, etiol: 0, burn: 0, cold: 0,
    dust: 0, pests: 0, health: 100, bloom: null, pups: 0, lean: 0, mood: 'happy', face: true,
  };
}

function fmtTemp(c, units) {
  return units === 'F' ? `${Math.round(c * 1.8 + 32)}°F` : `${Math.round(c)}°C`;
}
function fmtAgoShort(ms) {
  const m = Math.round(ms / MIN);
  if (m < 2) return 'now';
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

/* Height (or width for globes) in cm from the visual size. */
function sizeToCm(species, size) {
  const u = 6 / 94; // cm per plant unit (tiny pot is 6 cm)
  switch (species) {
    case 'barrel': return 2 * 112 * size * u;
    case 'oldlady': return 2 * 100 * size * 0.96 * u;
    case 'moon': return (30 + 70 * size + 2 * 0.9 * (16 + 60 * size)) * u;
    case 'saguaro': return (38 + 250 * Math.max(0, size - 0.2) / 0.8) * u;
    case 'bunny': return (2 * (24 + 42 * size)) * (1 + 0.7 * smoothstep(0.3, 0.9, size)) * u;
    case 'christmas': return (22 + 180 * size) * u;
    default: return 100 * size * u;
  }
}
function fmtSize(S) {
  const cm = sizeToCm(S.plant.species, sizeFromGrowth(S.plant.growth));
  return S.settings.units === 'F' ? `${(cm / 2.54).toFixed(1)} in` : `${cm.toFixed(1)} cm`;
}
