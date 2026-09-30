/* Cartoon tools: icons, the caddy, and tap / drag interactions. */

const ICONS = {
  water: `<svg viewBox="0 0 64 64"><defs><linearGradient id="ic-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD0F5"/><stop offset="1" stop-color="#2F8FC9"/></linearGradient></defs>
    <path d="M44 22 C54 16 58 26 52 34" fill="none" stroke="#1C4F73" stroke-width="7" stroke-linecap="round"/><path d="M44 22 C54 16 58 26 52 34" fill="none" stroke="#5DB9E8" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M20 30 L6 18" stroke="#1C4F73" stroke-width="8" stroke-linecap="round"/><path d="M20 30 L6 18" stroke="#5DB9E8" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="6" cy="17" rx="5" ry="3.4" transform="rotate(-42 6 17)" fill="#9BDDF8" stroke="#1C4F73" stroke-width="2.4"/>
    <path d="M18 24 Q18 20 22 20 L44 20 Q48 20 48 24 L50 50 Q50 55 45 55 L23 55 Q18 55 18 50 Z" fill="url(#ic-w)" stroke="#1C4F73" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 26 L24 48" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/><rect x="17" y="17" width="32" height="6" rx="3" fill="#A8E1FA" stroke="#1C4F73" stroke-width="2.6"/></svg>`,
  meter: `<svg viewBox="0 0 64 64"><path d="M32 34 L32 60" stroke="#46505A" stroke-width="6" stroke-linecap="round"/><path d="M32 34 L32 60" stroke="#C9D2DA" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="32" cy="22" r="18" fill="#FDFBF4" stroke="#2C3A33" stroke-width="3"/>
    <path d="M18 24 A14 14 0 0 1 24 12" stroke="#E0A33C" stroke-width="5" fill="none"/><path d="M25 11.5 A14 14 0 0 1 39 11.5" stroke="#6DBE5A" stroke-width="5" fill="none"/><path d="M40 12 A14 14 0 0 1 46 24" stroke="#3C8FD6" stroke-width="5" fill="none"/>
    <path d="M32 24 L25 14" stroke="#D6453D" stroke-width="2.6" stroke-linecap="round"/><circle cx="32" cy="24" r="3" fill="#2C3A33"/></svg>`,
  turn: `<svg viewBox="0 0 64 64"><path d="M14 30 L50 30 L46 56 L18 56 Z" fill="#D8733F" stroke="#6A2E14" stroke-width="3" stroke-linejoin="round"/><rect x="11" y="24" width="42" height="9" rx="3.5" fill="#E4834F" stroke="#6A2E14" stroke-width="3"/>
    <path d="M20 16 A16 9 0 0 1 48 14" fill="none" stroke="#2C3A33" stroke-width="3.4" stroke-linecap="round"/><path d="M48 14 L42 9 M48 14 L41 18" stroke="#2C3A33" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M22 36 L22 50" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/></svg>`,
  food: `<svg viewBox="0 0 64 64"><rect x="24" y="4" width="16" height="10" rx="3" fill="#F2C94C" stroke="#6B4E0F" stroke-width="3"/><path d="M20 18 Q20 14 24 14 L40 14 Q44 14 44 18 L46 54 Q46 59 41 59 L23 59 Q18 59 18 54 Z" fill="#7BC96F" stroke="#24532B" stroke-width="3" stroke-linejoin="round"/>
    <rect x="21" y="28" width="22" height="20" rx="4" fill="#FFFDF3" stroke="#24532B" stroke-width="2"/><path d="M32 45 L32 35 M32 38 Q28 38 28 34 M32 40 Q36 40 36 36" stroke="#3E8B3E" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <path d="M24 20 L24 26" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/></svg>`,
  swab: `<svg viewBox="0 0 64 64"><path d="M14 50 L48 14" stroke="#7A6A55" stroke-width="6" stroke-linecap="round"/><path d="M14 50 L48 14" stroke="#F2E9D8" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="50" cy="12" rx="8" ry="6" transform="rotate(-46 50 12)" fill="#FFFFFF" stroke="#8E8373" stroke-width="2.6"/><ellipse cx="12" cy="52" rx="8" ry="6" transform="rotate(-46 12 52)" fill="#FFFFFF" stroke="#8E8373" stroke-width="2.6"/>
    <path d="M44 34 q4 -6 8 0 q-4 5 -8 0z" fill="#9ED3F5" stroke="#2B6C99" stroke-width="1.6"/></svg>`,
  mist: `<svg viewBox="0 0 64 64"><path d="M22 26 L42 26 L44 56 Q44 60 40 60 L24 60 Q20 60 20 56 Z" fill="#BFE6FA" fill-opacity=".85" stroke="#23577A" stroke-width="3" stroke-linejoin="round"/>
    <path d="M22 42 L42 42 L43 56 Q43 58 40 58 L24 58 Q21 58 21 56 Z" fill="#5DB9E8" opacity=".7"/>
    <path d="M24 12 L44 12 L44 26 L24 26 Z" fill="#FFFFFF" stroke="#23577A" stroke-width="3" stroke-linejoin="round"/><path d="M24 14 L12 14 L12 19 L24 19" fill="#FFFFFF" stroke="#23577A" stroke-width="3" stroke-linejoin="round"/>
    <path d="M40 26 Q46 34 40 38" stroke="#23577A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="6" cy="12" r="1.6" fill="#5DB9E8"/><circle cx="5" cy="18" r="1.6" fill="#5DB9E8"/><circle cx="8" cy="22" r="1.3" fill="#5DB9E8"/></svg>`,
  cloth: `<svg viewBox="0 0 64 64"><path d="M10 26 Q20 16 34 22 Q46 12 56 22 L54 46 Q44 38 32 46 Q20 38 10 48 Z" fill="#F7C948" stroke="#7A5A0C" stroke-width="3" stroke-linejoin="round"/>
    <path d="M14 34 Q22 28 32 34 Q42 26 52 32" stroke="#E3A91E" stroke-width="2.4" fill="none"/><path d="M16 42 Q24 36 32 41" stroke="#E3A91E" stroke-width="2.2" fill="none"/>
    <path d="M50 8 L52 13 L57 15 L52 17 L50 22 L48 17 L43 15 L48 13 Z" fill="#FFFFFF" stroke="#7A5A0C" stroke-width="1.6"/></svg>`,
  lamp: `<svg viewBox="0 0 64 64"><path d="M40 58 L40 34 Q40 26 32 24" stroke="#3A3F47" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M8 26 L30 14 Q36 12 38 18 L40 24 Q41 29 36 31 L12 36 Q7 36 7 31 Z" fill="#5C6470" stroke="#1D2127" stroke-width="3" stroke-linejoin="round"/>
    <path d="M10 33 L38 27" stroke="#F7B8E8" stroke-width="4" stroke-linecap="round"/><path d="M11 37 L4 50 M19 36 L16 52 M28 34 L28 50" stroke="#F4A7DF" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
    <rect x="32" y="56" width="16" height="5" rx="2" fill="#3A3F47"/></svg>`,
  repot: `<svg viewBox="0 0 64 64"><path d="M8 30 L46 30 L42 58 L12 58 Z" fill="#3C94D6" stroke="#123E6B" stroke-width="3" stroke-linejoin="round"/><rect x="5" y="23" width="44" height="10" rx="4" fill="#4AA3E3" stroke="#123E6B" stroke-width="3"/>
    <path d="M52 6 L44 30" stroke="#8A6A33" stroke-width="5" stroke-linecap="round"/><path d="M40 26 Q36 36 42 42 Q50 40 52 30 Z" fill="#B9C3CC" stroke="#3A444D" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M14 36 L14 52" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4"/></svg>`,
  window: `<svg viewBox="0 0 64 64"><rect x="10" y="6" width="44" height="52" rx="3" fill="#FBF8F1" stroke="#2C3A33" stroke-width="3"/><rect x="15" y="11" width="34" height="18" fill="#9FD3F2" stroke="#2C3A33" stroke-width="2"/><rect x="15" y="33" width="34" height="20" fill="#9FD3F2" stroke="#2C3A33" stroke-width="2"/><path d="M32 22 L32 14 M28 18 L32 13 L36 18" stroke="#2C3A33" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`,
  curtain: `<svg viewBox="0 0 64 64"><path d="M8 8 H56" stroke="#8A6A33" stroke-width="4" stroke-linecap="round"/><path d="M12 10 Q16 34 10 58 L30 58 Q24 34 30 10 Z" fill="#FFFFFF" fill-opacity=".9" stroke="#8E8373" stroke-width="2.4"/><path d="M34 10 Q40 34 34 58 L54 58 Q48 34 54 10 Z" fill="#FFFFFF" fill-opacity=".9" stroke="#8E8373" stroke-width="2.4"/><path d="M18 14 Q21 34 16 54 M42 14 Q45 34 40 54" stroke="#D9D2C3" stroke-width="2" fill="none"/></svg>`,
};

const Tools = {
  ghost: null,
  drag: null,
  busy: false,

  init() {
    const caddy = $('#caddy .tools');
    for (const t of TOOLS) {
      const b = el('button', { class: 'tool', type: 'button', id: `tool-${t.id}`, dataset: { tool: t.id }, 'aria-label': `${t.name} (${t.key})` },
        el('span', { class: 'tool-icon', html: ICONS[t.id] }),
        el('span', { class: 'tool-name', text: t.name }),
        el('kbd', { text: t.key }));
      b.addEventListener('pointerdown', (e) => this.down(e, t.id, b));
      b.addEventListener('click', (e) => { if (e.detail === 0) this.use(t.id); }); // keyboard activation
      b.addEventListener('mouseenter', () => UI.hint(t.tip, 'tool'));
      b.addEventListener('mouseleave', () => UI.hint(null, 'tool'));
      caddy.append(b);
    }
    requestAnimationFrame(() => { const box = $('.caddy-box'); if (box) box.scrollLeft = 0; });
    window.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (UI.modalOpen()) return;
      const t = TOOLS.find((x) => x.key.toLowerCase() === e.key.toLowerCase());
      if (t) { e.preventDefault(); this.use(t.id); }
    });
  },

  refresh(S) {
    const lampBtn = $('#tool-lamp');
    if (lampBtn) lampBtn.classList.toggle('on', !!S.env.lamp);
    const needed = new Set(needs(S, Date.now(), Game.wx).map((n) => n.tool));
    for (const b of $$('.tool')) b.classList.toggle('nudge', needed.has(b.dataset.tool));
    const size = sizeFromGrowth(S.plant.growth);
    $('#tool-repot')?.classList.toggle('dim', size < POT_SIZES[S.plant.pot.size].cap * 0.8 && S.plant.pot.size < 3);
  },

  down(e, id, btn) {
    if (e.button !== 0 || this.busy) return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    let dragging = false;
    const move = (ev) => {
      if (!dragging && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 8) {
        dragging = true;
        this.startDrag(id, ev);
      }
      if (dragging) this.moveDrag(ev);
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (dragging) this.endDrag(ev, ev.type === 'pointercancel');
      else if (ev.type === 'pointerup') this.use(id);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    void btn;
  },

  makeGhost(id, x, y) {
    const gh = el('div', { class: `tool-ghost tool-ghost-${id}`, html: ICONS[id] });
    document.body.append(gh);
    this.ghost = gh;
    this.placeGhost(x, y);
    return gh;
  },
  placeGhost(x, y, rot = 0) {
    if (!this.ghost) return;
    this.ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -60%) rotate(${rot}deg)`;
  },
  dropGhost() {
    const gh = this.ghost;
    this.ghost = null;
    if (!gh) return;
    gh.classList.add('bye');
    setTimeout(() => gh.remove(), 260);
  },

  targetFor(id) {
    if (id === 'cloth') return 'glass';
    return 'plant';
  },
  overTarget(id, x, y) {
    const L = Room.L;
    if (!L) return false;
    if (this.targetFor(id) === 'glass') {
      const I = L.inner;
      return x > I.x && x < I.x + I.w && y > I.y && y < I.y + I.h;
    }
    const r = Scene.plantRect();
    return x > r.x - 20 && x < r.x + r.w + 20 && y > r.y - 30 && y < r.y + r.h + 10;
  },

  startDrag(id, e) {
    this.drag = { id, wiped: 0, last: { x: e.clientX, y: e.clientY } };
    this.makeGhost(id, e.clientX, e.clientY);
    document.body.classList.add('dragging');
    Audio2.play('pick');
  },
  moveDrag(e) {
    const d = this.drag;
    if (!d) return;
    const over = this.overTarget(d.id, e.clientX, e.clientY);
    const tilt = d.id === 'water' && over ? -38 : 0;
    this.placeGhost(e.clientX, e.clientY, tilt);
    Scene.highlight(over ? this.targetFor(d.id) : null);
    if (d.id === 'water' && over) FX.pour(e.clientX - 34, e.clientY - 18, 0.4);
    if (d.id === 'cloth' && over) {
      d.wiped += Math.hypot(e.clientX - d.last.x, e.clientY - d.last.y);
      FX.wipeAt(e.clientX, e.clientY);
      if (d.wiped > 900 && !d.done) { d.done = true; this.apply('cloth', e.clientX, e.clientY); }
    }
    d.last = { x: e.clientX, y: e.clientY };
  },
  endDrag(e, cancelled) {
    const d = this.drag;
    this.drag = null;
    document.body.classList.remove('dragging');
    Scene.highlight(null);
    if (!d) return;
    const over = !cancelled && this.overTarget(d.id, e.clientX, e.clientY);
    if (over && !(d.id === 'cloth' && d.done)) this.animateUse(d.id, e.clientX, e.clientY, true);
    else this.dropGhost();
  },

  /* Tap / keyboard: fly to the target and act. */
  use(id) {
    if (this.busy || !Game.S) return;
    if (id === 'lamp') return this.apply('lamp');
    if (id === 'repot') return UI.openRepot();
    if (id === 'turn') return this.apply('turn');
    const btn = $(`#tool-${id}`);
    const b = btn.getBoundingClientRect();
    const r = Scene.plantRect();
    const target = id === 'cloth'
      ? { x: Room.L.inner.x + Room.L.inner.w * 0.3, y: Room.L.inner.y + Room.L.inner.h * 0.35 }
      : { x: r.x + r.w / 2, y: r.y + Math.min(r.h * 0.35, 80) };
    this.makeGhost(id, b.x + b.width / 2, b.y + b.height / 2);
    this.ghost.classList.add('flying');
    requestAnimationFrame(() => {
      this.placeGhost(target.x, target.y);
      setTimeout(() => { this.ghost?.classList.remove('flying'); this.animateUse(id, target.x, target.y, false); }, 380);
    });
  },

  animateUse(id, x, y, fromDrag) {
    this.busy = true;
    const done = () => { this.busy = false; };
    const P = Scene.potTop();
    const gh = this.ghost;
    const at = (gx, gy, rot = 0, ms = 300) => {
      if (!gh) return;
      gh.style.transition = `transform ${ms}ms cubic-bezier(.3,.7,.3,1)`;
      this.placeGhost(gx, gy, rot);
    };
    switch (id) {
      case 'water': {
        at(P.x - 46, P.y - 60, -40, 280);
        let n = 0;
        const iv = setInterval(() => { FX.pour(P.x - 76, P.y - 70, 1); if (++n > 22) clearInterval(iv); }, 55);
        Audio2.play('pour');
        setTimeout(() => { this.apply('water'); this.dropGhost(); done(); }, 1350);
        break;
      }
      case 'meter': {
        at(P.x + 8, P.y - 18, 0, 260);
        setTimeout(() => { at(P.x + 8, P.y + 6, 0, 360); }, 260);
        setTimeout(() => { this.apply('meter'); this.dropGhost(); done(); }, 900);
        break;
      }
      case 'food': {
        at(P.x - 10, P.y - 64, -120, 300);
        setTimeout(() => FX.drops(P.x - 26, P.y - 46, '#A5D86E', 10), 320);
        setTimeout(() => { this.apply('food'); this.dropGhost(); done(); }, 1000);
        break;
      }
      case 'swab': {
        const r = Scene.plantRect();
        let k = 0;
        const iv = setInterval(() => {
          at(r.x + r.w * (0.3 + 0.4 * (k % 2)), r.y + r.h * (0.3 + 0.08 * k), k % 2 ? 20 : -10, 160);
          if (++k > 6) clearInterval(iv);
        }, 170);
        setTimeout(() => { this.apply('swab'); this.dropGhost(); done(); }, 1300);
        break;
      }
      case 'mist': {
        const r = Scene.plantRect();
        at(r.x + r.w + 40, r.y + r.h * 0.35, 0, 260);
        let k = 0;
        const iv = setInterval(() => { FX.mist(r.x + r.w + 8, r.y + r.h * 0.3); Audio2.play('spritz'); if (++k > 2) clearInterval(iv); }, 330);
        setTimeout(() => { this.apply('mist'); this.dropGhost(); done(); }, 1200);
        break;
      }
      case 'cloth': {
        const I = Room.L.inner;
        const path = [[0.25, 0.3], [0.7, 0.28], [0.3, 0.55], [0.75, 0.5], [0.35, 0.75], [0.7, 0.72]];
        path.forEach(([px, py], i) => setTimeout(() => {
          const gx = I.x + I.w * px, gy = I.y + I.h * py;
          at(gx, gy, i % 2 ? 12 : -12, 200);
          FX.wipeAt(gx, gy);
        }, i * 190));
        setTimeout(() => { this.apply('cloth', x, y); this.dropGhost(); done(); }, path.length * 190 + 120);
        break;
      }
      default:
        this.apply(id, x, y);
        this.dropGhost();
        done();
    }
    void fromDrag;
  },

  apply(id, x, y) {
    try { this.applyInner(id, x, y); } catch (e) { console.error(e); this.dropGhost(); this.busy = false; }
  },

  applyInner(id, x, y) {
    const S = Game.S;
    let res = null;
    switch (id) {
      case 'water':
        res = Actions.water(S, 72);
        if (unlock(S, 'firstDrink', Game.emit)) { /* toast via emit */ }
        FX.sparkle(Scene.potTop().x, Scene.potTop().y, '#7CC4F2', 8);
        break;
      case 'food': res = Actions.feed(S); FX.sparkle(Scene.potTop().x, Scene.potTop().y - 10, '#A5D86E', 10); break;
      case 'turn':
        res = Actions.turn(S);
        Scene.spin();
        Audio2.play('turn');
        if (S.plant.turns >= 10) unlock(S, 'spinner', Game.emit);
        break;
      case 'swab': {
        const had = S.plant.pests > 0;
        res = Actions.swab(S);
        if (had) unlock(S, 'pestFree', Game.emit);
        break;
      }
      case 'mist': res = Actions.mist(S); break;
      case 'cloth':
        res = Actions.clean(S);
        unlock(S, 'sparkling', Game.emit);
        FX.sparkle(x || Room.L.inner.x + Room.L.inner.w / 2, y || Room.L.inner.y + Room.L.inner.h / 3, '#FFFFFF', 16);
        Audio2.play('shine');
        Scene.repaintWindow();
        break;
      case 'lamp':
        S.env.lamp = !S.env.lamp;
        res = { tone: 'info', text: S.env.lamp ? 'Grow light on. Extra light helps on dark days.' : 'Grow light off.' };
        Audio2.play('click');
        break;
      case 'meter': {
        const m = meterReading(S.plant.moisture);
        UI.showMeter(m);
        const thirsty = S.plant.species === 'christmas' ? m.v <= 4 : m.v <= 1;
        res = { tone: 'info', text: m.zone === 'DRY' ? (thirsty ? `Reads ${m.v}: dry all the way down. Water now.` : `Reads ${m.v}: nearly dry. Water when it hits 1.`) : m.zone === 'MOIST' ? `Reads ${m.v}: still moist. Hold off on water.` : `Reads ${m.v}: wet. No water for a while.` };
        break;
      }
      default: break;
    }
    Game.afterAction(res);
  },
};
