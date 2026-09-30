/* Scene composition (layers, sky photos, lighting) and animated effects. */

const Scene = {
  el: {},
  photoFront: 'a',
  photoName: null,
  grade: 'day',
  plantKey: '',
  box: { x: 0, y: 0, w: 1, h: 1 },
  sun: null,
  parallax: { x: 0, y: 0, tx: 0, ty: 0 },

  build() {
    const s = $('#scene');
    this.el = {
      scene: s,
      outside: $('#outside'),
      photoA: $('#photoA'),
      photoB: $('#photoB'),
      flash: $('#photoFlash'),
      grade: $('#skyGrade'),
      fxOut: $('#fxOut'),
      interior: $('#interior'),
      win: $('#win'),
      fxGlass: $('#fxGlass'),
      room: $('#room'),
      patch: $('#patch'),
      shadow: $('#plantShadow'),
      plant: $('#plant'),
      fxRoom: $('#fxRoom'),
      roomLight: $('#roomLight'),
      flashRoom: $('#flashRoom'),
      lamp: $('#growLamp'),
      curtain: $('#curtain'),
      sashHit: $('#sashHit'),
      reflect: $('#glassReflect'),
    };
    this.el.flash.src = photoSrc('lightning');
    s.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      this.parallax.tx = (e.clientX / innerWidth - 0.5) * -14;
      this.parallax.ty = (e.clientY / innerHeight - 0.5) * -8;
    });
    this.el.plant.addEventListener('pointerdown', (e) => {
      if (Tools.drag || Tools.busy) return;
      e.preventDefault();
      Game.poke();
    });
    this.el.plant.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Game.poke(); }
    });
    this.initSash();
  },

  layout() {
    const W = innerWidth, H = innerHeight;
    Room.dpr = Math.min(2, window.devicePixelRatio || 1);
    const L = Room.layout(W, H);
    Room.L = L;
    const S = Game.S;
    const wall = WALL_COLORS[S?.env.wall || 'plaster'].base;
    Room.paint(this.el.room, L, wall);
    this.repaintWindow();
    const I = L.inner, m = 26;
    this.box = { x: I.x - m, y: I.y - m, w: I.w + m * 2, h: I.h + m * 2 };
    Object.assign(this.el.outside.style, { left: `${this.box.x}px`, top: `${this.box.y}px`, width: `${this.box.w}px`, height: `${this.box.h}px` });
    for (const c of [this.el.fxOut, this.el.fxGlass, this.el.fxRoom, this.el.patch]) {
      c.width = Math.round(W * Room.dpr);
      c.height = Math.round(H * Room.dpr);
    }
    Object.assign(this.el.curtain.style, { left: `${I.x}px`, top: `${I.y - 4}px`, width: `${I.w}px`, height: `${I.h + 4}px` });
    Object.assign(this.el.reflect.style, { left: `${I.x}px`, top: `${I.y}px`, width: `${I.w}px`, height: `${I.h}px` });
    const lampSize = clamp(L.ow * 0.16, 70, 150);
    Object.assign(this.el.lamp.style, { left: `${L.ox + L.ow + L.cw * 0.4 - lampSize * 0.55}px`, top: `${L.oy + L.oh * 0.18}px`, width: `${lampSize}px`, height: `${lampSize}px` });
    this.placePlant();
    this.placeSash();
    FX.resize(L);
    document.documentElement.style.setProperty('--sill-y', `${L.stool.frontY}px`);
    document.documentElement.style.setProperty('--win-top', `${L.oy - L.cw}px`);
    document.documentElement.style.setProperty('--win-left', `${L.ox - L.cw}px`);
    document.documentElement.style.setProperty('--win-right', `${W - (L.ox + L.ow + L.cw)}px`);
    this.plantKey = '';
    if (S) { this.renderPlant(S, Game.mood, true); this.updateLight(true); }
  },

  repaintWindow() {
    if (!Room.L || !Game.S) return;
    Room.paintWindow(this.el.win, Room.L, Game.S.env);
    this.placeSash();
  },

  placePlant() {
    const L = Room.L;
    const box = [-230, -580, 460, 660];
    const u = L.unit;
    const w = box[2] * u, h = box[3] * u;
    for (const n of [this.el.plant, this.el.shadow]) {
      Object.assign(n.style, { left: `${L.potX + box[0] * u}px`, top: `${L.potY + box[1] * u}px`, width: `${w}px`, height: `${h}px` });
    }
    this.el.shadow.style.transformOrigin = `${-box[0] * u}px ${-box[1] * u}px`;
  },

  /* Screen rect of the plant body (for aiming tools). */
  plantRect() {
    const g = this.el.plant.querySelector('.plant-g');
    if (g) {
      const r = g.getBoundingClientRect();
      if (r.width > 4) return { x: r.x, y: r.y, w: r.width, h: r.height };
    }
    const L = Room.L;
    return { x: L.potX - 50, y: L.potY - 200, w: 100, h: 160 };
  },
  potTop() {
    const L = Room.L, S = Game.S;
    const pw = POT_SIZES[S?.plant.pot.size || 0].w;
    return { x: L.potX, y: L.potY - pw * 0.82 * L.unit + 6 * L.unit };
  },

  highlight(target) {
    this.el.plant.classList.toggle('target', target === 'plant');
    this.el.scene.classList.toggle('target-glass', target === 'glass');
  },
  spin() {
    const p = this.el.plant;
    p.classList.remove('spin');
    void p.offsetWidth;
    p.classList.add('spin');
  },
  squish() {
    const p = this.el.plant;
    p.classList.remove('squish');
    void p.offsetWidth;
    p.classList.add('squish');
  },

  renderPlant(S, mood, force = false) {
    const v = Plant.visual(S, { mood });
    const key = JSON.stringify(v);
    if (!force && key === this.plantKey) return;
    this.plantKey = key;
    const svg = Plant.svg(v);
    this.el.plant.innerHTML = svg;
    this.el.shadow.innerHTML = svg;
  },

  /* ---------- sky photos ---------- */
  setSky(scene, instant = false) {
    const { photo, grade } = scene;
    const G = GRADES[grade] || GRADES.day;
    const front = this.photoFront === 'a' ? this.el.photoA : this.el.photoB;
    const back = this.photoFront === 'a' ? this.el.photoB : this.el.photoA;
    this.el.grade.style.background = G.overlay;
    this.el.grade.style.mixBlendMode = G.blend;
    if (photo === this.photoName) {
      front.style.filter = G.filter;
      this.grade = grade;
      return;
    }
    this.photoName = photo;
    this.grade = grade;
    const meta = PHOTOS[photo];
    back.style.objectPosition = meta.focus;
    back.style.filter = G.filter;
    const show = () => {
      back.classList.add('on');
      front.classList.remove('on');
      this.photoFront = this.photoFront === 'a' ? 'b' : 'a';
      FX.photo = back;
    };
    back.style.transition = instant ? 'none' : '';
    front.style.transition = instant ? 'none' : '';
    if (back.getAttribute('src') !== photoSrc(photo)) {
      back.onload = show;
      back.onerror = show;
      back.src = photoSrc(photo);
    } else show();
    UI.setCredit(photo);
  },

  /* Displayed rect of the current photo, for droplet refraction. */
  photoMap() {
    const img = FX.photo;
    if (!img || !img.naturalWidth) return null;
    const b = this.box;
    const s = Math.max(b.w / img.naturalWidth, b.h / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    const [fx, fy] = (img.style.objectPosition || '50% 50%').split(' ').map((p) => parseFloat(p) / 100);
    return { img, s, x: b.x + (b.w - dw) * (isNaN(fx) ? 0.5 : fx) + this.parallax.x, y: b.y + (b.h - dh) * (isNaN(fy) ? 0.5 : fy) + this.parallax.y };
  },

  /* ---------- lighting ---------- */
  updateLight(force = false) {
    const S = Game.S, L = Room.L;
    if (!S || !L) return;
    const now = Date.now();
    const sun = sunPosition(now, S.home.lat, S.home.lon);
    const w = Game.wx || { cond: 'partly', cloud: 45, precip: 0 };
    const lt = windowLight(sun, w, S.env);
    const day = daylightLevel(sun.el);
    const cloud = (w.cloud ?? 50) / 100;
    const night = 1 - day;
    // Interior exposure: daylight through the window, lamps at night.
    const bright = lerp(0.58, 1.02, day) * (1 - 0.1 * cloud * day) + lt.direct * 0.08;
    const warm = sun.el > -4 && sun.el < 10 ? (1 - Math.abs(sun.el - 3) / 7) * 0.22 * (1 - cloud) : 0;
    const f = `brightness(${bright.toFixed(3)}) saturate(${lerp(0.8, 1, day).toFixed(2)}) sepia(${(warm + night * 0.12).toFixed(3)})`;
    this.el.interior.style.filter = f;
    this.el.shadow.style.filter = '';
    // Warm lamp glow at night, cool daylight wash by day
    const rl = this.el.roomLight;
    rl.style.opacity = (0.25 + night * 0.75).toFixed(2);
    rl.style.background = night > 0.4
      ? `radial-gradient(120% 90% at 8% 0%, rgba(255,190,120,${(0.42 * night).toFixed(2)}), rgba(255,170,90,0) 60%), radial-gradient(60% 50% at 50% ${((L.stool.backY / L.H) * 100).toFixed(0)}%, rgba(255,210,150,${(0.12 * night).toFixed(2)}), rgba(0,0,0,0) 70%)`
      : `radial-gradient(70% 60% at 50% ${(((L.oy + L.oh * 0.5) / L.H) * 100).toFixed(0)}%, rgba(235,245,255,${(0.16 * day).toFixed(2)}), rgba(0,0,0,0) 70%)`;
    rl.style.mixBlendMode = night > 0.4 ? 'soft-light' : 'screen';
    this.sun = { ...sun, direct: lt.direct, rel: lt.rel, day };
    this.el.reflect.style.opacity = (clamp(night * 1.2, 0, 1) * 0.9).toFixed(2);
    this.el.lamp.classList.toggle('on', !!S.env.lamp);
    this.el.scene.classList.toggle('lamp-on', !!S.env.lamp);
    this.el.curtain.classList.toggle('drawn', !!S.env.curtain);
    this.paintPatch();
    void force;
  },

  /* Sun patch on the sill + the plant's cast shadow. */
  paintPatch() {
    const L = Room.L, st = L.stool, c = this.el.patch, g = c.getContext('2d');
    const dpr = Room.dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, L.W, L.H);
    const sun = this.sun || { direct: 0, rel: 0, el: 0 };
    const k = clamp(sun.direct * 2.6, 0, 1);
    const panes = Room.panes(L);
    const low = panes[1];
    // Contact shadow under the pot, always.
    const pw = POT_SIZES[Game.S.plant.pot.size].w * L.unit;
    let rg = g.createRadialGradient(L.potX, L.potY, 0, L.potX, L.potY, pw * 0.75);
    rg.addColorStop(0, 'rgba(30,18,8,0.55)');
    rg.addColorStop(1, 'rgba(30,18,8,0)');
    g.save();
    g.translate(L.potX, L.potY);
    g.scale(1, 0.22);
    g.translate(-L.potX, -L.potY);
    g.fillStyle = rg;
    g.fillRect(L.potX - pw, L.potY - pw, pw * 2, pw * 2);
    g.restore();
    const sh = this.el.shadow;
    if (Game.S.env.lamp) {
      const lr = pw * 1.3;
      const lg2 = g.createRadialGradient(L.potX, L.potY, 0, L.potX, L.potY, lr);
      lg2.addColorStop(0, 'rgba(255,170,235,0.34)');
      lg2.addColorStop(1, 'rgba(255,170,235,0)');
      g.save();
      g.translate(L.potX, L.potY); g.scale(1, 0.32); g.translate(-L.potX, -L.potY);
      g.globalCompositeOperation = 'screen';
      g.fillStyle = lg2;
      g.fillRect(L.potX - lr, L.potY - lr, lr * 2, lr * 2);
      g.restore();
    }
    if (k < 0.04 || !low) {
      sh.style.opacity = '0';
      FX.beam = null;
      return;
    }
    // Light through the lower pane lands on the sill, skewed by the sun's direction.
    const shift = Math.tan(clamp(sun.rel, -70, 70) * DEG) * (st.frontY - st.backY) * 1.6;
    const x0 = low.x, x1 = low.x + low.w;
    const yb = st.backY + (st.frontY - st.backY) * clamp(0.35 - sun.el / 120, 0.05, 0.4);
    const poly = [[x0 - shift * 0.25, yb], [x1 - shift * 0.25, yb], [x1 * 1 - shift + (x1 - L.vp.x) * 0.12, st.frontY], [x0 - shift + (x0 - L.vp.x) * 0.12, st.frontY]];
    g.save();
    g.filter = `blur(${(3 + (1 - k) * 4).toFixed(1)}px)`;
    g.globalCompositeOperation = 'screen';
    const lg = g.createLinearGradient(0, yb, 0, st.frontY);
    lg.addColorStop(0, `rgba(255,236,190,${(0.55 * k).toFixed(2)})`);
    lg.addColorStop(1, `rgba(255,226,170,${(0.32 * k).toFixed(2)})`);
    g.fillStyle = lg;
    g.beginPath();
    poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fill();
    g.restore();
    // Cast shadow: flattened, skewed copy of the plant falling towards the viewer.
    const skew = clamp(sun.rel * 0.9, -55, 55);
    // Shadow length from sun height, but never longer than the sill in front of the pot.
    const pr = this.plantRect();
    const tall = Math.max(40, L.potY - pr.y);
    const room = (st.frontY - L.potY) * 0.92;
    const want = tall * clamp(0.35 / Math.tan(Math.max(6, sun.el) * DEG), 0.12, 1.2);
    const len = Math.min(want, room) / tall;
    sh.style.opacity = (0.3 * k).toFixed(2);
    sh.style.transform = `scaleY(${(-len).toFixed(3)}) skewX(${skew.toFixed(1)}deg)`;
    FX.beam = { x0, x1, top: low.y + low.h * 0.15, bottom: low.y + low.h, yb, frontY: st.frontY, shift, k };
  },

  /* ---------- window sash dragging ---------- */
  initSash() {
    const hit = this.el.sashHit;
    let startY = 0, startOpen = 0, moved = false;
    const move = (e) => {
      const L = Room.L, G = Room.geo;
      const range = G.half - G.bottom * 0.6;
      const v = clamp(startOpen + (startY - e.clientY) / range, 0, 1);
      if (Math.abs(e.clientY - startY) > 4) moved = true;
      Game.S.env.windowOpen = v;
      this.repaintWindow();
      void L;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      hit.classList.remove('grab');
      const S = Game.S;
      if (!moved) S.env.windowOpen = S.env.windowOpen > 0.1 ? 0 : 0.6;
      S.env.windowOpen = S.env.windowOpen < 0.08 ? 0 : S.env.windowOpen;
      this.repaintWindow();
      Game.windowChanged();
    };
    hit.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !Game.S) return;
      e.preventDefault();
      startY = e.clientY;
      startOpen = Game.S.env.windowOpen;
      moved = false;
      hit.classList.add('grab');
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  },
  placeSash() {
    const L = Room.L, G = Room.geo;
    if (!L || !G) return;
    const I = L.inner;
    const y = I.y + I.h - G.bottom - G.lift;
    Object.assign(this.el.sashHit.style, { left: `${I.x + I.w * 0.12}px`, top: `${y - 6}px`, width: `${I.w * 0.76}px`, height: `${G.bottom + 12}px` });
  },
};

/* ---------------- animated effects ---------------- */
const FX = {
  photo: null,
  rainI: 0, snowI: 0, fogI: 0, storm: false, wind: 0, frost: 0, fogGlass: 0,
  bright: 1,
  rain: [], snow: [], fogs: [], drops: [], motes: [], parts: [],
  snowDepth: 0,
  beam: null,
  nextFlash: 0, flashAt: -1e9,
  frostTex: null,
  t: 0,

  resize(L) {
    this.L = L;
    this.frostTex = null;
    this.drops = [];
    this.rain = [];
    this.snow = [];
    this.motes = [];
  },

  setWeather(w, grade, S) {
    const c = w?.cond || 'partly';
    const p = w?.precip ?? CONDITIONS[c]?.precip ?? 0;
    this.rainI = WET.has(c) || c === 'storm' ? clamp(p + 0.15, 0.25, 1) : 0;
    this.snowI = SNOWY.has(c) ? clamp(p + 0.2, 0.3, 1) : c === 'sleet' ? 0.35 : 0;
    this.fogI = c === 'fog' ? 1 : c === 'haze' ? 0.25 : 0;
    this.storm = c === 'storm';
    this.wind = clamp((w?.wind ?? (c === 'storm' ? 35 : 10)) / 60, 0, 1);
    const t = w?.tempC;
    this.frost = t != null && t < -2 ? clamp((-2 - t) / 8, 0.15, 0.85) : 0;
    this.fogGlass = t != null && t < 6 && (w?.humidity ?? 60) > 70 ? 0.35 : 0;
    this.bright = { night: 0.3, 'native-night': 0.55, twilight: 0.55, golden: 0.9 }[grade] ?? 1;
    if (!this.storm) this.nextFlash = 0;
    void S;
  },

  active() {
    return this.rainI > 0 || this.snowI > 0 || this.fogI > 0 || this.drops.length > 0 || this.parts.length > 0 || (this.beam && this.beam.k > 0.05) || this.storm || this.snowDepth > 0;
  },

  frame(now, dt) {
    this.t += dt;
    const L = this.L;
    if (!L) return;
    const dpr = Room.dpr;
    const reduce = reducedMotion();
    const go = Scene.el.fxOut.getContext('2d');
    go.setTransform(dpr, 0, 0, dpr, 0, 0);
    go.clearRect(0, 0, L.W, L.H);
    const I = L.inner;
    go.save();
    go.beginPath();
    go.rect(I.x, I.y, I.w, I.h);
    go.clip();
    this.drawFog(go, I, dt);
    this.drawRain(go, I, dt, reduce);
    this.drawSnow(go, I, dt, reduce);
    this.drawSnowBank(go, I, dt);
    go.restore();

    const gg = Scene.el.fxGlass.getContext('2d');
    gg.setTransform(dpr, 0, 0, dpr, 0, 0);
    gg.clearRect(0, 0, L.W, L.H);
    const panes = Room.panes(L);
    this.drawCold(gg, panes);
    this.drawDrops(gg, panes, dt, reduce);

    const gr = Scene.el.fxRoom.getContext('2d');
    gr.setTransform(dpr, 0, 0, dpr, 0, 0);
    gr.clearRect(0, 0, L.W, L.H);
    this.drawBeam(gr, dt, reduce);
    this.drawParts(gr, dt);
    this.lightning(now);
  },

  drawFog(g, I, dt) {
    if (this.fogI <= 0) return;
    if (this.fogs.length < 7) {
      for (let i = 0; i < 7; i++) this.fogs.push({ x: I.x + Math.random() * I.w, y: I.y + I.h * (0.25 + Math.random() * 0.6), rx: I.w * (0.3 + Math.random() * 0.4), ry: I.h * (0.08 + Math.random() * 0.1), v: 6 + Math.random() * 10, a: 0.12 + Math.random() * 0.12 });
    }
    g.fillStyle = `rgba(225,230,235,${(0.14 * this.fogI).toFixed(3)})`;
    g.fillRect(I.x, I.y, I.w, I.h);
    for (const f of this.fogs) {
      f.x += f.v * dt;
      if (f.x - f.rx > I.x + I.w) f.x = I.x - f.rx;
      const rg = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.rx);
      rg.addColorStop(0, `rgba(236,240,243,${(f.a * this.fogI * this.bright).toFixed(3)})`);
      rg.addColorStop(1, 'rgba(236,240,243,0)');
      g.save();
      g.translate(f.x, f.y);
      g.scale(1, f.ry / f.rx);
      g.translate(-f.x, -f.y);
      g.fillStyle = rg;
      g.fillRect(f.x - f.rx, f.y - f.rx, f.rx * 2, f.rx * 2);
      g.restore();
    }
  },

  drawRain(g, I, dt, reduce) {
    const want = Math.round((reduce ? 60 : 260) * this.rainI * clamp(I.w * I.h / 400000, 0.4, 1.6));
    while (this.rain.length < want) this.rain.push(this.newStreak(I, true));
    if (this.rain.length > want) this.rain.length = want;
    if (!want) return;
    const slant = 0.12 + this.wind * 0.3;
    g.lineCap = 'round';
    for (const r of this.rain) {
      r.y += r.v * dt;
      r.x += r.v * dt * slant;
      if (r.y - r.len > I.y + I.h || r.x > I.x + I.w + 40) Object.assign(r, this.newStreak(I, false));
      g.strokeStyle = `rgba(215,225,238,${(r.a * (0.35 + 0.65 * this.bright)).toFixed(3)})`;
      g.lineWidth = r.z * 1.2;
      g.beginPath();
      g.moveTo(r.x, r.y);
      g.lineTo(r.x - r.len * slant, r.y - r.len);
      g.stroke();
    }
  },
  newStreak(I, anywhere) {
    const z = 0.3 + Math.random() * 0.7;
    return { x: I.x - 40 + Math.random() * (I.w + 40), y: anywhere ? I.y + Math.random() * I.h : I.y - Math.random() * 60, z, len: (14 + Math.random() * 22) * z, v: (700 + Math.random() * 600) * z, a: (0.18 + Math.random() * 0.3) * z };
  },

  drawSnow(g, I, dt, reduce) {
    const want = Math.round((reduce ? 50 : 220) * this.snowI * clamp(I.w * I.h / 400000, 0.4, 1.6));
    while (this.snow.length < want) this.snow.push(this.newFlake(I, true));
    if (this.snow.length > want) this.snow.length = want;
    for (const f of this.snow) {
      f.y += f.vy * dt;
      f.x += (this.wind * 40 * f.z + Math.sin(this.t * 1.3 + f.ph) * 14 * f.z) * dt;
      if (f.y - f.r > I.y + I.h) Object.assign(f, this.newFlake(I, false));
      const a = (0.55 + 0.45 * f.z) * (0.4 + 0.6 * this.bright);
      if (f.r > 2.2) {
        const rg = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 1.6);
        rg.addColorStop(0, `rgba(255,255,255,${a.toFixed(2)})`);
        rg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = rg;
        g.beginPath(); g.arc(f.x, f.y, f.r * 1.6, 0, TAU); g.fill();
      } else {
        g.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
        g.beginPath(); g.arc(f.x, f.y, f.r, 0, TAU); g.fill();
      }
    }
  },
  newFlake(I, anywhere) {
    const z = Math.random();
    return { x: I.x + Math.random() * I.w, y: anywhere ? I.y + Math.random() * I.h : I.y - 10, z, r: 0.7 + z * 2.8, vy: 22 + z * 60, ph: Math.random() * TAU };
  },

  drawSnowBank(g, I, dt) {
    const target = this.snowI > 0 ? 1 : 0;
    this.snowDepth = clamp(this.snowDepth + (target ? dt / 90 : -dt / 300), 0, 1);
    if (this.snowDepth <= 0.01) return;
    const G = Room.geo;
    if (!G) return;
    const base = I.y + I.h - G.bottom;
    const h = 4 + 16 * this.snowDepth;
    g.fillStyle = `rgba(248,250,255,${(0.92 * (0.5 + 0.5 * this.bright)).toFixed(2)})`;
    g.beginPath();
    g.moveTo(I.x, base + 2);
    for (let x = 0; x <= I.w; x += 10) g.lineTo(I.x + x, base - h * (0.75 + 0.25 * Math.sin(x * 0.07) * Math.cos(x * 0.023)));
    g.lineTo(I.x + I.w, base + 2);
    g.closePath();
    g.fill();
  },

  drawCold(g, panes) {
    if (this.frost <= 0 && this.fogGlass <= 0) return;
    for (const p of panes) {
      if (this.fogGlass > 0) {
        const lg = g.createLinearGradient(0, p.y + p.h * 0.55, 0, p.y + p.h);
        lg.addColorStop(0, 'rgba(240,244,248,0)');
        lg.addColorStop(1, `rgba(240,244,248,${(0.4 * this.fogGlass).toFixed(2)})`);
        g.fillStyle = lg;
        g.fillRect(p.x, p.y, p.w, p.h);
      }
      if (this.frost > 0) {
        if (!this.frostTex || this.frostTex.w !== Math.round(p.w)) this.frostTex = { w: Math.round(p.w), c: this.makeFrost(p.w, Math.max(p.h, 60)) };
        g.save();
        g.globalAlpha = this.frost;
        g.drawImage(this.frostTex.c, p.x, p.y, p.w, p.h);
        g.restore();
      }
    }
  },
  makeFrost(w, h) {
    const c = makeCanvas(w, h), g = c.getContext('2d');
    const edge = (x0, y0, x1, y1) => {
      const lg = g.createLinearGradient(x0, y0, x1, y1);
      lg.addColorStop(0, 'rgba(235,245,255,0.55)');
      lg.addColorStop(1, 'rgba(235,245,255,0)');
      return lg;
    };
    const d = Math.min(w, h) * 0.22;
    g.fillStyle = edge(0, h, 0, h - d); g.fillRect(0, h - d, w, d);
    g.fillStyle = edge(0, 0, d, 0); g.fillRect(0, 0, d, h);
    g.fillStyle = edge(w, 0, w - d, 0); g.fillRect(w - d, 0, d, h);
    const r = mulberry32(5);
    g.strokeStyle = 'rgba(255,255,255,0.55)';
    g.lineWidth = 0.8;
    const branch = (x, y, a, len, depth) => {
      if (depth > 3 || len < 3) return;
      let px = x, py = y;
      const segs = 5 + Math.floor(r() * 5);
      g.beginPath();
      g.moveTo(px, py);
      for (let i = 0; i < segs; i++) {
        a += (r() - 0.5) * 0.5;
        px += Math.cos(a) * len / segs; py += Math.sin(a) * len / segs;
        g.lineTo(px, py);
        if (r() < 0.35) { g.stroke(); branch(px, py, a + (r() < 0.5 ? 1 : -1) * 1.05, len * 0.5, depth + 1); g.beginPath(); g.moveTo(px, py); }
      }
      g.stroke();
    };
    for (let i = 0; i < 70; i++) {
      const side = Math.floor(r() * 3);
      if (side === 0) branch(r() * w, h, -Math.PI / 2 + (r() - 0.5), d * (0.6 + r()), 0);
      else if (side === 1) branch(0, r() * h, (r() - 0.5), d * (0.6 + r()), 0);
      else branch(w, r() * h, Math.PI + (r() - 0.5), d * (0.6 + r()), 0);
    }
    return c;
  },

  drawDrops(g, panes, dt, reduce) {
    const rate = this.rainI > 0 ? (reduce ? 6 : 30) * this.rainI + (this.storm ? 14 : 0) : 0;
    if (rate && panes.length) {
      let n = rate * dt;
      while (n > 0) {
        if (Math.random() < n) {
          const p = panes[Math.random() < 0.5 ? 0 : 1];
          const big = Math.random() < 0.22;
          this.drops.push({ x: p.x + Math.random() * p.w, y: p.y + Math.random() * p.h * 0.95, r: big ? 2.4 + Math.random() * 2.8 : 0.7 + Math.random() * 1.5, vy: 0, slide: false, trail: 0, pane: p === panes[0] ? 0 : 1, seed: Math.random() * 10 });
        }
        n -= 1;
      }
    }
    if (this.drops.length > 240) this.drops.splice(0, this.drops.length - 240);
    const map = Scene.photoMap();
    const dark = 1 - this.bright;
    const keep = [];
    for (const d of this.drops) {
      const p = panes[d.pane];
      if (!p) continue;
      if (this.rainI <= 0) d.r -= dt * 0.08;
      if (d.r < 0.5) continue;
      if (d.r > 3.3 && !reduce) {
        d.slide = true;
        d.vy = Math.min(d.vy + 70 * dt, 30 + d.r * 16);
        d.y += d.vy * dt;
        d.x += Math.sin(d.y * 0.05 + d.seed) * 0.25;
        d.trail += d.vy * dt;
        if (d.trail > 9) {
          d.trail = 0;
          keep.push({ x: d.x + (Math.random() - 0.5), y: d.y - d.r * 1.2, r: d.r * 0.28, vy: 0, slide: false, trail: 0, pane: d.pane, seed: 0 });
          d.r *= 0.985;
        }
      }
      if (d.y - d.r > p.y + p.h) continue;
      keep.push(d);
    }
    // Merge sliding drops with ones they touch
    for (const a of keep) {
      if (!a.slide) continue;
      for (const b of keep) {
        if (b === a || b.r <= 0 || b.pane !== a.pane) continue;
        const dx = a.x - b.x, dy = a.y - b.y;
        if (dx * dx + dy * dy < (a.r + b.r * 0.8) ** 2) { a.r = Math.min(7, Math.sqrt(a.r * a.r + b.r * b.r)); b.r = 0; }
      }
    }
    this.drops = keep.filter((d) => d.r > 0);
    for (const d of this.drops) {
      const p = panes[d.pane];
      if (d.y < p.y || d.x < p.x || d.x > p.x + p.w) continue;
      const rx = d.r * (d.slide ? 0.86 : 1), ry = d.r * (d.slide ? 1.18 : 1);
      if (d.r > 1.5 && map) {
        g.save();
        g.beginPath();
        g.ellipse(d.x, d.y, rx, ry, 0, 0, TAU);
        g.clip();
        // A drop is a tiny lens: it shows the scene above it, upside down and squeezed.
        const sx = (d.x - map.x) / map.s, sy = (d.y - d.r * 5 - map.y) / map.s;
        const sw = (d.r * 9) / map.s;
        g.translate(d.x, d.y);
        g.scale(1, -1);
        try { g.drawImage(map.img, sx - sw / 2, sy - sw / 2, sw, sw, -rx, -ry, rx * 2, ry * 2); } catch { /* not decoded yet */ }
        g.setTransform(Room.dpr, 0, 0, Room.dpr, 0, 0);
        const lg = g.createRadialGradient(d.x - rx * 0.2, d.y - ry * 0.25, 0, d.x, d.y, Math.max(rx, ry));
        lg.addColorStop(0, 'rgba(255,255,255,0.18)');
        lg.addColorStop(0.72, 'rgba(255,255,255,0.05)');
        lg.addColorStop(1, 'rgba(10,20,30,0.45)');
        g.fillStyle = lg;
        g.fillRect(d.x - rx, d.y - ry, rx * 2, ry * 2);
        if (dark > 0.05) { g.fillStyle = `rgba(8,12,24,${(dark * 0.45).toFixed(2)})`; g.fillRect(d.x - rx, d.y - ry, rx * 2, ry * 2); }
        g.restore();
        g.fillStyle = `rgba(255,255,255,${(0.45 * (0.4 + 0.6 * this.bright)).toFixed(2)})`;
        g.beginPath(); g.ellipse(d.x, d.y + ry * 0.62, rx * 0.5, ry * 0.18, 0, 0, TAU); g.fill();
        g.fillStyle = dark > 0.3 ? 'rgba(255,214,160,0.9)' : `rgba(255,255,255,${(0.85 * (0.4 + 0.6 * this.bright)).toFixed(2)})`;
        g.beginPath(); g.arc(d.x - rx * 0.35, d.y - ry * 0.4, Math.max(0.6, d.r * 0.22), 0, TAU); g.fill();
      } else {
        g.fillStyle = `rgba(225,235,242,${(0.28 * (0.4 + 0.6 * this.bright)).toFixed(2)})`;
        g.beginPath(); g.arc(d.x, d.y, d.r, 0, TAU); g.fill();
        g.fillStyle = `rgba(255,255,255,${(0.55 * (0.4 + 0.6 * this.bright)).toFixed(2)})`;
        g.beginPath(); g.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, Math.max(0.4, d.r * 0.3), 0, TAU); g.fill();
      }
    }
  },

  drawBeam(g, dt, reduce) {
    const b = this.beam;
    if (!b || b.k < 0.05) return;
    // Faint shaft of light from the lower pane down onto the sill
    const lg = g.createLinearGradient(0, b.top, 0, b.frontY);
    lg.addColorStop(0, 'rgba(255,240,205,0)');
    lg.addColorStop(0.6, `rgba(255,238,200,${(0.07 * b.k).toFixed(3)})`);
    lg.addColorStop(1, `rgba(255,232,190,${(0.1 * b.k).toFixed(3)})`);
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(b.x0, b.top); g.lineTo(b.x1, b.top);
    g.lineTo(b.x1 - b.shift, b.frontY); g.lineTo(b.x0 - b.shift, b.frontY);
    g.closePath();
    g.fill();
    if (reduce) return;
    while (this.motes.length < 36) this.motes.push({ u: Math.random(), v: Math.random(), du: (Math.random() - 0.5) * 0.02, dv: (Math.random() - 0.5) * 0.015, r: 0.6 + Math.random() * 1.3, ph: Math.random() * TAU });
    for (const m of this.motes) {
      m.u = (m.u + m.du * dt + 1) % 1;
      m.v = (m.v + m.dv * dt + 1) % 1;
      const y = lerp(b.top, b.frontY, m.v);
      const sh = b.shift * m.v;
      const x = lerp(b.x0, b.x1, m.u) - sh;
      const a = (0.25 + 0.35 * Math.sin(this.t * 1.5 + m.ph)) * b.k;
      if (a <= 0) continue;
      g.fillStyle = `rgba(255,248,225,${a.toFixed(2)})`;
      g.beginPath(); g.arc(x, y, m.r, 0, TAU); g.fill();
    }
  },

  lightning(now) {
    if (!this.storm) { Scene.el.flash.style.opacity = '0'; Scene.el.flashRoom.style.opacity = '0'; return; }
    if (!this.nextFlash) this.nextFlash = now + 3000 + Math.random() * 6000;
    if (now > this.nextFlash) {
      this.flashAt = now;
      this.nextFlash = now + 7000 + Math.random() * 14000;
      setTimeout(() => Audio2.play('thunder'), 900 + Math.random() * 2200);
    }
    const t = now - this.flashAt;
    const pulses = [[0, 90, 1], [140, 220, 0.45], [260, 420, 0.8]];
    let s = 0;
    for (const [a, b, v] of pulses) if (t >= a && t <= b) s = v * (1 - (t - a) / (b - a) * 0.6);
    Scene.el.flash.style.opacity = s.toFixed(2);
    Scene.el.flashRoom.style.opacity = (s * 0.35).toFixed(2);
  },

  /* ---------- one-shot particles ---------- */
  pour(x, y, k = 1) {
    for (let i = 0; i < 4 * k + 1; i++) this.parts.push({ type: 'water', x: x + Math.random() * 4, y: y + Math.random() * 4, vx: 60 + Math.random() * 40, vy: 20 + Math.random() * 30, life: 0, max: 0.9, r: 1.6 + Math.random() * 1.8, col: '#7CC4F2' });
  },
  drops(x, y, col, n = 8) {
    for (let i = 0; i < n; i++) this.parts.push({ type: 'water', x: x + (Math.random() - 0.5) * 8, y, vx: (Math.random() - 0.5) * 20, vy: 30 + Math.random() * 40, life: -i * 0.06, max: 0.9, r: 2 + Math.random() * 1.6, col });
  },
  sparkle(x, y, col = '#FFE27A', n = 12) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = 40 + Math.random() * 90;
      this.parts.push({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0, max: 0.7 + Math.random() * 0.5, r: 2 + Math.random() * 3, col });
    }
  },
  mist(x, y) {
    for (let i = 0; i < 26; i++) {
      const a = Math.PI + (Math.random() - 0.5) * 0.9, sp = 60 + Math.random() * 120;
      this.parts.push({ type: 'mist', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.6 + Math.random() * 0.4, r: 1 + Math.random() * 2, col: '#D6EEFB' });
    }
  },
  wipeAt(x, y) {
    for (let i = 0; i < 3; i++) this.parts.push({ type: 'spark', x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 30, vx: 0, vy: -10, life: 0, max: 0.45, r: 1.5 + Math.random() * 2, col: '#FFFFFF' });
  },
  drawParts(g, dt) {
    const alive = [];
    for (const p of this.parts) {
      p.life += dt;
      if (p.life < 0) { alive.push(p); continue; }
      if (p.life > p.max) continue;
      if (p.type === 'water') p.vy += 600 * dt;
      if (p.type === 'mist') { p.vx *= 0.94; p.vy *= 0.94; }
      if (p.type === 'spark') p.vy += 60 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      const k = 1 - p.life / p.max;
      g.globalAlpha = clamp(p.type === 'mist' ? k * 0.7 : k, 0, 1);
      g.fillStyle = p.col;
      if (p.type === 'spark') {
        const r = p.r * (0.6 + 0.4 * k);
        g.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU, rr = i % 2 ? r * 0.4 : r;
          const px = p.x + Math.cos(a) * rr, py = p.y + Math.sin(a) * rr;
          i ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        g.closePath();
        g.fill();
      } else {
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill();
      }
      alive.push(p);
    }
    g.globalAlpha = 1;
    this.parts = alive;
  },
};
