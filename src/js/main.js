/* Game controller: boot, real-time ticking, weather, saving. */

const IDLE_LINES = {
  rain: ['Listen to that rain. I’m staying cozy in here.', 'Rainy day. Perfect for sitting still, my specialty.'],
  storm: ['Th-thunder! I’m fine. Totally fine.', 'Big storm out there. Glad I’m on this side of the glass.'],
  snow: ['Snow! Good thing I’m inside where it’s warm.', 'Look at it come down. Winter is my resting season.'],
  fog: ['Can’t see a thing out there.', 'Foggy. Very mysterious.'],
  clear: ['Soaking up the sun. This is the life.', 'Blue skies. My favourite.', 'Sunshine is my snack.'],
  cloudy: ['Clouds today. I’ll take what light I can get.', 'A grey day. Still cozy.'],
  night: ['Fun fact: cacti breathe at night to save water.', 'Night night.', 'Stars are out. Or at least I hope so.'],
  golden: ['Ooh, golden hour.', 'Look at that light.'],
  any: ['Tip: when in doubt, don’t water. Cacti forgive thirst more than soggy roots.', 'A quarter turn every few days keeps me growing straight.', 'I grow a little every day, even when you can’t tell.'],
};
const POKE_LINES = ['Ow! Spiky, remember?', 'Hehe, that tickles.', 'Careful, I’m prickly!', 'Hi there!', 'Boop.', 'Personal space, please.'];

const Game = {
  S: null,
  demo: false,
  wx: null,
  sky: null,
  mood: 'content',
  preview: null,
  showcase: null,
  pokeUntil: 0,
  lastFrame: 0,
  lastLight: 0,
  lastSay: 0,
  liveTimer: 0,
  catching: false,
  caught: [],
  pendingHome: null,

  async boot(hot = {}) {
    this.emit = this.emit.bind(this);
    UI.init();
    Scene.build();
    Tools.init();
    let S = hot.state || Store.loadLocal();
    if (S) this.adopt(S, { report: true });
    else this.showIntro();
    window.addEventListener('resize', debounce(() => { Scene.layout(); this.applyWeather(true); }, 120));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { this.save(true); return; }
      this.tick();
      if (this.S?.wx.mode === 'live' && Date.now() - (this.S.wx.current?.at || 0) > 25 * MIN) this.refreshLive();
    });
    window.addEventListener('pagehide', () => this.save(true));
    setInterval(() => this.tick(), 20000);
    setInterval(() => this.maybeSpeak(), 15000);
    this.loop();
    window.claude?.hot?.snapshot?.(() => ({ state: this.demo ? null : this.S }));

    // Cloud save (cross-device) and live weather arrive later, if this view supports them.
    Store.init().then((cloud) => {
      if (!cloud) { if (this.S && !this.demo) this.save(true); return; }
      const mine = this.demo ? null : this.S;
      if (!mine || (cloud.actedAt || cloud.createdAt) > (mine.actedAt || mine.createdAt)) {
        UI.closeModal();
        this.adopt(cloud, { report: true });
      } else this.save(true);
    });
    this.liveReady = Live.init();
    this.liveReady.then((ok) => {
      if (!ok && this.S?.wx.mode === 'live') { this.S.wx.mode = 'manual'; this.refresh(); }
      if (ok && this.S && !this.demo && this.S.wx.mode === 'live') this.refreshLive();
    });
  },

  /* Start from a saved game, catching the simulation up to now. */
  adopt(S, { report = false } = {}) {
    this.demo = false;
    this.S = S;
    S.home = S.home || guessHome();
    const away = Date.now() - (S.stats.lastVisit || S.sim.t);
    const before = { m0: S.plant.moisture, h0: S.plant.health, g0: S.plant.growth };
    this.catching = true;
    this.caught = [];
    simulate(S, Date.now(), (t, d) => this.emit(t, d));
    this.catching = false;
    S.stats.visits = (S.stats.visits || 0) + 1;
    S.stats.lastVisit = Date.now();
    Scene.layout();
    this.applyWeather(true);
    this.updateMood();
    Scene.renderPlant(S, this.mood, true);
    UI.render(S);
    Audio2.enable(S.settings.sound);
    this.visitBadges();
    if (report && away > 3 * HOUR) {
      UI.openReport({ away, m0: before.m0, h0: before.h0, dg: S.plant.growth - before.g0, events: this.caught });
    } else setTimeout(() => this.maybeSpeak(true), 1400);
    this.save(true);
  },

  /* Background scene for the very first visit (not saved). */
  showIntro() {
    this.demo = true;
    const S = newGame({ species: 'barrel', name: 'Goldie' });
    S.plant.growth = 22;
    S.plant.moisture = 40;
    S.wx.current = { cond: 'partly', tempC: climateTempC(Date.now(), S.home.lat), humidity: 60, cloud: 45, precip: 0, src: 'default', at: Date.now() };
    this.S = S;
    Scene.layout();
    this.applyWeather(true);
    this.mood = 'happy';
    Scene.renderPlant(S, this.mood, true);
    UI.render(S);
    UI.openWelcome();
  },

  plant({ species, name, color, facing, placeQuery }) {
    const home = guessHome();
    if (placeQuery) Object.assign(home, { query: placeQuery, name: placeQuery, guessed: false });
    const S = newGame({ species, name, color, facing, home });
    S.plant.moisture = 5;
    S.plant.dryHours = 0;
    S.actedAt = Date.now();
    this.demo = false;
    this.S = S;
    unlock(S, 'planted', null);
    UI.closeModal();
    Scene.layout();
    this.applyWeather(true);
    this.updateMood();
    Scene.renderPlant(S, 'happy', true);
    Scene.el.plant.classList.add('planting');
    setTimeout(() => Scene.el.plant.classList.remove('planting'), 1400);
    FX.sparkle(Scene.potTop().x, Scene.potTop().y - 30, '#FFE27A', 18);
    Audio2.play('grow');
    UI.render(S);
    this.save(true);
    setTimeout(() => UI.say(`Hi! I’m ${S.plant.name}. My soil is dry — could I get a drink? Drag the watering can onto my pot, or just tap it.`, 9000), 1100);
    if (placeQuery) (this.liveReady || Promise.resolve(false)).then((ok) => { if (ok) this.goLive(placeQuery, false); });
  },

  reset() {
    Store.clearLocal();
    Store.clearCloud();
    UI.closeModal();
    setTimeout(() => this.showIntro(), 260);
  },

  /* ---------- events from the simulation ---------- */
  emit(type, data) {
    const S = this.S;
    if (!S) return;
    const name = S.plant.name;
    const push = (text, tone = 'info', big = false) => {
      if (this.catching) this.caught.push(text);
      else UI.toast(text, big ? 'big' : tone);
    };
    switch (type) {
      case 'stage':
        push(`${name} reached the ${STAGES[data].name} stage!`, 'good', true);
        if (!this.catching) { FX.sparkle(Scene.potTop().x, Scene.potTop().y - 80, '#FFE27A', 22); Audio2.play('grow'); Scene.squish(); }
        break;
      case 'bud': push(`Flower buds on ${name}! Keep the care steady.`, 'good', true); break;
      case 'bloom':
        push(`${name} is blooming!`, 'good', true);
        if (!this.catching) { FX.sparkle(Scene.potTop().x, Scene.potTop().y - 120, '#FF8FB1', 26); Audio2.play('chime'); }
        break;
      case 'pests': push('Mealybugs spotted! Dab them off with the swab.', 'warn'); break;
      case 'pup': push(`A baby offset appeared on ${name}.`, 'good'); break;
      case 'rootbound': push('The roots have filled the pot. Time to repot.', 'warn'); break;
      case 'day': if (!this.catching) UI.toast(`Day ${data} on the windowsill.`, 'info'); break;
      case 'ach': {
        const a = ACHIEVEMENTS[data];
        const pot = Object.entries(POT_STYLES).find(([, p]) => p.unlock === data);
        push(`Badge: ${a.name}${pot ? ` · ${pot[1].name} pot unlocked` : ''}`, 'good');
        if (!this.catching) Audio2.play('chime');
        break;
      }
      default: break;
    }
  },

  afterAction(res) {
    const S = this.S;
    if (!S || this.demo) return;
    S.actedAt = Date.now();
    this.coach();
    if (res?.text) UI.toast(res.text, res.tone || 'info');
    this.updateMood();
    if (res?.tone === 'good' && this.mood !== 'thirsty') { this.pokeMood = 'happy'; this.pokeUntil = Date.now() + 2500; this.updateMood(); }
    Scene.renderPlant(S, this.mood);
    Scene.updateLight();
    UI.render(S);
    this.save(true);
  },

  /* Gentle first-session tips, each shown once. */
  coach() {
    const S = this.S;
    S.tips = S.tips || {};
    const once = (id, ms, text) => {
      if (S.tips[id]) return;
      S.tips[id] = Date.now();
      setTimeout(() => UI.say(text, 8000), ms);
    };
    if (S.stats.waterings >= 1) once('afterWater', 1800, 'Thank you! Now I need to dry out completely before the next drink. I grow a little every day, so come back tomorrow.');
    else return;
    if (S.tips.afterWater && Date.now() - S.tips.afterWater > 20000) once('meterTip', 600, 'Not sure if I’m thirsty? The moisture meter tells you exactly how wet my soil is.');
  },

  poke() {
    if (!this.S) return;
    this.pokeMood = 'ouch';
    this.pokeUntil = Date.now() + 1300;
    this.updateMood();
    Scene.renderPlant(this.S, this.mood);
    Scene.squish();
    Audio2.play('pop');
    const top = needs(this.S, Date.now(), this.wx)[0];
    UI.say(top && Math.random() < 0.6 ? top.text : POKE_LINES[Math.floor(Math.random() * POKE_LINES.length)], 3600);
  },

  updateMood() {
    if (!this.S) return;
    const phase = this.sky?.phase || 'day';
    this.mood = this.pokeUntil > Date.now() ? this.pokeMood : moodOf(this.S, Date.now(), phase === 'night' ? 'night' : 'day');
  },

  idleLine() {
    const w = this.wx, ph = this.sky?.phase;
    let key = 'any';
    if (ph === 'night') key = 'night';
    else if ((ph === 'sunset' || ph === 'sunrise') && w && SUNNY.has(w.cond)) key = 'golden';
    else if (w) key = WET.has(w.cond) ? 'rain' : w.cond === 'storm' ? 'storm' : SNOWY.has(w.cond) ? 'snow' : w.cond === 'fog' ? 'fog' : ['cloudy', 'overcast'].includes(w.cond) ? 'cloudy' : 'clear';
    const pool = IDLE_LINES[key].concat(IDLE_LINES.any);
    const i = Math.floor(Date.now() / (10 * MIN)) % pool.length;
    return pool[i];
  },

  maybeSpeak(force = false) {
    if (!this.S || this.demo || UI.modalOpen() || Tools.drag || document.hidden) return;
    const now = Date.now();
    if (!force && now - this.lastSay < 55000) return;
    const top = needs(this.S, now, this.wx)[0];
    if (!top && !force && Math.random() < 0.6) return;
    this.lastSay = now;
    UI.say(top ? top.text : this.idleLine());
  },

  /* ---------- time ---------- */
  tick() {
    const S = this.S;
    if (!S) return;
    if (!this.demo) {
      simulate(S, Date.now(), (t, d) => this.emit(t, d));
      S.stats.lastVisit = Date.now();
    }
    const phase = skyPhase(Date.now(), S.home.lat, S.home.lon).phase;
    if (!this.preview && phase !== this.sky?.phase) this.applyWeather();
    else if (Date.now() - this.lastLight > 60000) { this.lastLight = Date.now(); Scene.updateLight(); }
    this.updateMood();
    Scene.renderPlant(S, this.mood);
    UI.render(S);
    if (!this.demo) Store.saveLocal(S);
  },

  loop() {
    const frame = (ts) => {
      const now = Date.now();
      const dt = Math.min(0.1, (ts - (this.lastFrame || ts)) / 1000);
      this.lastFrame = ts;
      if (!document.hidden && Room.L) {
        const p = Scene.parallax;
        p.x += (p.tx - p.x) * 0.06;
        p.y += (p.ty - p.y) * 0.06;
        Scene.el.outside.style.setProperty('--px', `${p.x.toFixed(2)}px`);
        Scene.el.outside.style.setProperty('--py', `${p.y.toFixed(2)}px`);
        if (FX.active()) { FX.frame(now, dt); this.fxIdle = false; }
        else if (!this.fxIdle) { FX.frame(now, dt); this.fxIdle = true; }
        if (this.preview && now > this.preview.until) this.endPreview();
        if (this.pokeUntil && now > this.pokeUntil) {
          this.pokeUntil = 0;
          this.updateMood();
          Scene.renderPlant(this.S, this.mood);
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  },

  /* ---------- weather ---------- */
  currentWeather() {
    const S = this.S;
    if (this.preview) {
      const c = this.preview.cond;
      return { cond: c, label: CONDITIONS[c].label, tempC: S.wx.current?.tempC ?? 12, humidity: 70, cloud: CONDITIONS[c].cloud, precip: CONDITIONS[c].precip, src: 'preview' };
    }
    const cur = S.wx.current;
    if (cur) return cur;
    return { cond: 'partly', label: 'Partly cloudy', tempC: climateTempC(Date.now(), S.home.lat), humidity: 60, cloud: 45, precip: 0, src: 'default', at: Date.now() };
  },

  applyWeather(instant = false) {
    const S = this.S;
    if (!S) return;
    const now = Date.now();
    const sp = skyPhase(now, S.home.lat, S.home.lon);
    const phase = this.preview?.phase && this.preview.phase !== 'day' ? this.preview.phase : this.preview ? 'day' : sp.phase;
    this.sky = { ...sp, phase };
    this.wx = this.currentWeather();
    const scene = chooseScene(this.wx.cond, phase, seasonOf(now, S.home.lat), dayKey(now));
    Scene.setSky(scene, instant);
    FX.setWeather(this.wx, scene.grade, S);
    Scene.updateLight(true);
    this.lastLight = now;
    Audio2.setRain(Audio2.on ? FX.rainI : 0);
    this.updateMood();
    Scene.renderPlant(S, this.mood);
    UI.render(S);
    if (!this.preview) this.visitBadges();
  },

  logWeather(entry) {
    const log = this.S.wx.log;
    const last = log[log.length - 1];
    if (last && last.cond === entry.cond && Math.abs((last.tempC ?? 0) - (entry.tempC ?? 0)) < 0.6 && entry.t - last.t < 20 * MIN) return;
    log.push(entry);
    const cutoff = Date.now() - 6 * DAY;
    while (log.length && (log[0].t < cutoff || log.length > 300)) log.shift();
  },

  setManual(cond) {
    const S = this.S;
    if (!S || this.demo) return;
    this.stopPreview();
    const prev = S.wx.current;
    const tempC = prev?.tempC ?? climateTempC(Date.now(), S.home.lat);
    S.wx.mode = 'manual';
    S.wx.current = { cond, label: CONDITIONS[cond].label, tempC, humidity: WET.has(cond) || cond === 'fog' ? 88 : 60, cloud: CONDITIONS[cond].cloud, precip: CONDITIONS[cond].precip, src: 'manual', at: Date.now() };
    this.logWeather({ t: Date.now(), cond, tempC, cloud: CONDITIONS[cond].cloud, precip: CONDITIONS[cond].precip, humidity: S.wx.current.humidity, src: 'manual' });
    this.applyWeather();
    UI.toast(`Sky set to ${CONDITIONS[cond].label.toLowerCase()}.`, 'info');
    this.save(true);
  },

  setManualTemp(c) {
    const S = this.S;
    if (!S || this.demo) return;
    if (!S.wx.current) this.setManual('partly');
    S.wx.current.tempC = c;
    if (S.wx.mode !== 'live') S.wx.current.src = 'manual';
    const cur = S.wx.current;
    this.logWeather({ t: Date.now(), cond: cur.cond, tempC: c, cloud: cur.cloud, precip: cur.precip, humidity: cur.humidity, src: cur.src });
    this.applyWeather();
    this.save(true);
  },

  async goLive(query, quiet = false) {
    const S = this.S;
    if (!S || this.demo) return;
    if (query) Object.assign(S.home, { query, name: query, guessed: false, key: S.home.query === query ? S.home.key : null });
    S.wx.mode = 'live';
    await this.refreshLive(quiet);
  },

  async refreshLive(quiet = false) {
    const S = this.S;
    if (!S || this.demo || !Live.mcp || this.liveBusy) return;
    this.liveBusy = true;
    clearTimeout(this.liveTimer);
    Live.state = 'loading';
    Live.message = 'Checking AccuWeather…';
    try {
      const q = S.home.query || (S.home.guessed ? S.home.name : S.home.name);
      const { weather, place } = await Live.fetchCurrent({ query: q, lat: S.home.lat, lon: S.home.lon, key: S.home.key });
      Object.assign(S.home, { key: place.key || S.home.key, name: place.name || S.home.name, region: place.region || '' });
      if (place.lat != null && place.lon != null) { S.home.lat = place.lat; S.home.lon = place.lon; }
      S.wx.mode = 'live';
      S.wx.current = { ...weather, src: 'live', at: Date.now() };
      this.logWeather({ t: Date.now(), cond: weather.cond, tempC: weather.tempC, cloud: weather.cloud, precip: weather.precip, humidity: weather.humidity, src: 'live' });
      Live.state = 'live';
      Live.message = `Live from AccuWeather for ${S.home.name}. Updates every 30 minutes.`;
      this.applyWeather();
      if (!quiet) UI.toast(`Live weather: ${CONDITIONS[weather.cond].label.toLowerCase()} in ${S.home.name}.`, 'good');
      this.save(true);
    } catch (e) {
      Live.state = 'error';
      Live.message = Live.errorText(e, S.home.query || S.home.name);
      if (!S.wx.current || Date.now() - (S.wx.current.at || 0) > 3 * HOUR) S.wx.mode = 'manual';
      if (!quiet) UI.toast(Live.message, 'warn');
      this.refresh();
    } finally {
      this.liveBusy = false;
      if (S.wx.mode === 'live') this.liveTimer = setTimeout(() => this.refreshLive(true), 30 * MIN);
    }
  },

  /* ---------- previews ---------- */
  startPreview(cond, phase = 'day', ms = 12000) {
    this.preview = { cond, phase, until: Date.now() + ms };
    this.applyWeather();
  },
  endPreview() {
    if (this.showcase?.length) {
      const [c, ph] = this.showcase.shift();
      this.startPreview(c, ph, 5200);
      UI.toast(`${CONDITIONS[c].label}${ph !== 'day' ? ` · ${ph}` : ''}`, 'info');
      return;
    }
    this.stopPreview();
  },
  stopPreview() {
    if (!this.preview && !this.showcase) return;
    this.preview = null;
    this.showcase = null;
    FX.snowDepth = 0;
    FX.drops = [];
    this.applyWeather();
  },
  playShowcase() {
    this.showcase = [['clear', 'day'], ['partly', 'day'], ['cloudy', 'day'], ['fog', 'day'], ['rain', 'day'], ['storm', 'day'], ['snow', 'day'], ['clear', 'sunset'], ['clear', 'dusk'], ['clear', 'night'], ['rain', 'night']];
    this.preview = { cond: 'clear', phase: 'day', until: 0 };
    this.endPreview();
  },

  /* ---------- window & curtain ---------- */
  toggleWindow() {
    const S = this.S;
    if (!S || this.demo) return;
    S.env.windowOpen = S.env.windowOpen > 0.05 ? 0 : 0.6;
    Scene.repaintWindow();
    this.windowChanged();
  },
  windowChanged() {
    const S = this.S;
    if (!S || this.demo) return;
    Audio2.play('turn');
    const w = this.wx;
    if (S.env.windowOpen > 0.05) {
      const mild = w && w.tempC != null && w.tempC >= 15 && w.tempC <= 29 && !WET.has(w.cond) && w.cond !== 'storm' && !SNOWY.has(w.cond);
      if (mild) unlock(S, 'freshAir', this.emit.bind(this));
      UI.toast(mild ? 'Window open. Fresh air helps keep pests away.' : 'Window open. Keep an eye on the weather.', mild ? 'good' : 'info');
    } else UI.toast('Window closed.', 'info');
    this.afterAction(null);
  },
  toggleCurtain() {
    const S = this.S;
    if (!S || this.demo) return;
    S.env.curtain = !S.env.curtain;
    Audio2.play('click');
    this.afterAction({ tone: 'info', text: S.env.curtain ? 'Sheer curtain drawn. It softens harsh sun.' : 'Curtain open. Full light again.' });
  },

  /* Badges for visiting in real weather */
  visitBadges() {
    const S = this.S;
    if (!S || this.demo || this.preview) return;
    const live = S.wx.mode === 'live' && S.wx.current?.src === 'live' && Date.now() - S.wx.current.at < 2 * HOUR;
    const c = S.wx.current?.cond;
    const em = this.emit.bind(this);
    if (live && c) {
      if (WET.has(c)) unlock(S, 'rainBuddy', em);
      if (SNOWY.has(c)) unlock(S, 'snowDay', em);
      if (c === 'storm') unlock(S, 'stormWatch', em);
    }
    const now = Date.now();
    const ph = skyPhase(now, S.home.lat, S.home.lon).phase;
    if (ph === 'night' && c && ['clear', 'mostly_clear'].includes(c) && (live || S.wx.mode === 'manual')) unlock(S, 'stargazer', em);
    const { rise } = sunCrossings(now, S.home.lat, S.home.lon);
    if (rise && Math.abs(now - rise) < 50 * MIN) unlock(S, 'earlyBird', em);
  },

  refresh() {
    if (!this.S) return;
    this.applyWeather();
  },

  save(cloud = false) {
    const S = this.S;
    if (!S || this.demo) return;
    Store.saveLocal(S);
    if (cloud) Store.saveCloud(S);
  },
};

if (/debug/.test(location.hash)) window.__cactus = { Game, Scene, FX, Room, Store, Live };

function start(hot) {
  Game.boot(hot || {}).catch((e) => console.error(e));
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => (window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {})));
} else {
  window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
}
