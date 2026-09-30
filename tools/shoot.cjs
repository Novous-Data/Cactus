// Screenshot harness: node tools/shoot.cjs [scenario ...]
// Scenarios seed localStorage with a save so each game state can be checked visually.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const URL = process.env.URL || 'http://127.0.0.1:8765/preview.html';
const OUT = path.join(__dirname, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const DAY = 864e5;
function save({ species = 'barrel', growth = 40, moisture = 30, cond = 'partly', tempC = 16, t = Date.now(), pot = 0, style = 'terracotta', extra = {}, env = {}, plantedDaysAgo = 9, mode = 'manual' } = {}) {
  const now = t;
  return {
    v: 1, id: 'shot1234', createdAt: now - plantedDaysAgo * DAY, updatedAt: now, actedAt: now,
    plant: Object.assign({
      species, name: 'Spike', color: 'pink', plantedAt: now - plantedDaysAgo * DAY, growth, health: 92, moisture, saucer: 0, nutrients: 40,
      rot: 0, dryHours: 0, cold: 0, heat: 0, sunburn: 0, etiol: 0, lean: 0, leanDir: 1, dust: 0, pests: 0, bloom: null, bloomCount: 0,
      lastBloomAt: 0, pups: 0, pupProgress: 0, pot: { size: pot, style }, lastWaterAt: 0, lastFeedAt: 0, lastTurnAt: now, lastRepotAt: 0,
      turns: 0, lightAvg: 6, healthyStreak: 3, stage: 0,
    }, extra),
    env: Object.assign({ windowOpen: 0, curtain: false, lamp: false, glassDirt: 10, facing: 'S', wall: 'plaster', sillWet: 0 }, env),
    home: { lat: 40.75, lon: -73.64, name: 'Mineola', query: 'Mineola', guessed: false },
    wx: { mode, current: { cond, label: '', tempC, humidity: 70, cloud: 50, precip: 0.6, src: mode === 'live' ? 'live' : 'manual', at: now }, log: [{ t: now - 60000, cond, tempC, cloud: 50, precip: 0.6, humidity: 70, src: 'manual' }] },
    sim: { t: now }, day: { key: new Date(now).toISOString().slice(0, 10), light: 3.2, hours: {}, tMin: null, tMax: null, acts: {}, growth: 0, notes: [] },
    journal: [], ach: { planted: now }, settings: { units: 'F', sound: false, face: true }, stats: { waterings: 3, visits: 4, lastVisit: now, feeds: 0 }, tips: {},
  };
}

// Fixed clock times (local) for lighting scenarios
// Wall-clock time in New York (EDT, UTC-4) today
function at(h, m = 0) { const d = new Date(); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h + 4, m); }

const SCENARIOS = {
  welcome: { state: null },
  day: { state: save({ species: 'barrel', growth: 60 }), clock: at(13) },
  rain: { state: save({ species: 'bunny', growth: 110, cond: 'rain', pot: 1 }), clock: at(12) },
  storm: { state: save({ species: 'saguaro', growth: 210, cond: 'storm', pot: 2 }), clock: at(15) },
  snow: { state: save({ species: 'oldlady', growth: 150, cond: 'snow', tempC: -3, pot: 2, extra: { pups: 2, bloom: { stage: 'open', since: Date.now() } } }), clock: at(11) },
  sunset: { state: save({ species: 'moon', growth: 90, cond: 'clear', pot: 1, style: 'sky' }), clock: at(18, 40) },
  night: { state: save({ species: 'christmas', growth: 170, cond: 'clear', pot: 2, style: 'talavera', extra: { bloom: { stage: 'open', since: Date.now() } } }), clock: at(22) },
  fog: { state: save({ species: 'barrel', growth: 230, cond: 'fog', pot: 3, style: 'midnight', extra: { bloom: { stage: 'open', since: Date.now() } } }), clock: at(9) },
  sunny: { state: save({ species: 'moon', growth: 90, cond: 'clear', pot: 1, style: 'sky' }), clock: at(13, 30) },
  away: { state: (() => { const st = save({ species: 'bunny', growth: 30, moisture: 70, cond: 'partly', t: Date.now() - 3.2 * DAY, plantedDaysAgo: 6 }); st.sim.t = Date.now() - 3.2 * DAY; st.stats.lastVisit = st.sim.t; st.day.key = new Date(st.sim.t).toISOString().slice(0, 10); return st; })(), clock: null, wait: 4000 },
  thirsty: { state: save({ species: 'barrel', growth: 20, moisture: 1, extra: { dryHours: 200 } }), clock: at(14) },
};

(async () => {
  const names = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const mobile = process.argv.includes('--mobile');
  const tablet = process.argv.includes('--tablet');
  const browser = await chromium.launch();
  for (const name of names.length ? names : Object.keys(SCENARIOS)) {
    const sc = SCENARIOS[name];
    const ctx = await browser.newContext(tablet
      ? { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, timezoneId: 'America/New_York', locale: 'en-US' }
      : mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/New_York', locale: 'en-US' }
      : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, timezoneId: 'America/New_York', locale: 'en-US' });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${name}] console.${m.type()}:`, m.text()); });
    page.on('pageerror', (e) => console.log(`[${name}] pageerror:`, e.message, e.stack?.split('\n').slice(0, 3).join(' | ')));
    await page.addInitScript(([state, clock]) => {
      try { localStorage.clear(); if (state) localStorage.setItem('windowsill-cactus-v1', JSON.stringify(state)); } catch {}
      if (clock) {
        const off = clock - Date.now();
        const RealDate = Date;
        const now = () => RealDate.now() + off;
        // eslint-disable-next-line no-global-assign
        Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(now()); } static now() { return now(); } };
      }
    }, [sc.state, sc.clock || null]);
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(sc.wait || 3200);
    const file = path.join(OUT, `${name}${mobile ? '-m' : tablet ? '-t' : ''}.png`);
    await page.screenshot({ path: file });
    console.log('saved', file);
    await ctx.close();
  }
  await browser.close();
})();
