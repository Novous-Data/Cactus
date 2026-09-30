// Exercises the live-weather + cloud-save code paths against a mocked window.claude.
// The real AccuWeather connector's schema is unknown here, so several plausible shapes are tried.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://127.0.0.1:8765/preview.html#debug';

const VARIANTS = {
  structured: {
    schemas: {
      'widgets-current-claude': { type: 'object', properties: { location: { type: 'string', description: 'City name or postal code' }, units: { type: 'string', enum: ['imperial', 'metric'] } }, required: ['location'] },
      'widgets-search-claude': { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    },
    results: {
      'widgets-current-claude': (input) => ({
        content: [{ type: 'text', text: 'Current conditions' }],
        structuredContent: { location: { LocalizedName: 'Mineola', GeoPosition: { Latitude: 40.749, Longitude: -73.64 } }, current: [{ WeatherText: 'Light rain', WeatherIcon: 12, IsDayTime: true, Temperature: { Metric: { Value: 14.4, Unit: 'C' }, Imperial: { Value: 58, Unit: 'F' } }, RelativeHumidity: 91, CloudCover: 100, Wind: { Speed: { Metric: { Value: 18.5, Unit: 'km/h' } } }, HasPrecipitation: true, PrecipitationType: 'Rain' }] },
        _input: input,
      }),
    },
  },
  keyed: {
    schemas: {
      'widgets-current-claude': { type: 'object', properties: { locationKey: { type: 'string', description: 'AccuWeather location key' } }, required: ['locationKey'] },
      'widgets-search-claude': { type: 'object', properties: { q: { type: 'string', description: 'Search text' } }, required: ['q'] },
    },
    results: {
      'widgets-search-claude': () => ({ content: [{ type: 'text', text: JSON.stringify([{ Key: '2627473', LocalizedName: 'Mineola', AdministrativeArea: { ID: 'NY' }, GeoPosition: { Latitude: 40.749, Longitude: -73.64 } }]) }] }),
      'widgets-current-claude': (input) => {
        if (input.locationKey !== '2627473') throw { code: 'tool_error', message: 'bad key ' + JSON.stringify(input) };
        return { content: [{ type: 'text', text: JSON.stringify({ WeatherText: 'Mostly cloudy', WeatherIcon: 6, IsDayTime: true, Temperature: { Imperial: { Value: 63, Unit: 'F' } }, RelativeHumidity: 64 }) }] };
      },
    },
  },
  text: {
    schemas: { 'widgets-current-claude': { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] } },
    results: { 'widgets-current-claude': () => ({ content: [{ type: 'text', text: 'Right now in Mineola, NY it is 29°F with light snow and humidity 80%.' }] }) },
  },
  notConnected: {
    schemas: {},
    results: { 'widgets-current-claude': () => { throw { code: 'server_not_connected', message: 'no connector' }; } },
  },
};

(async () => {
  const browser = await chromium.launch();
  for (const [name, v] of Object.entries(VARIANTS)) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, timezoneId: 'America/New_York' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.exposeFunction('__mockCall', async (tool, input) => {
      const fn = v.results[tool];
      if (!fn) return { __throw: { code: 'tool_error', message: 'unknown tool ' + tool } };
      try { return fn(input); } catch (e) { return { __throw: e }; }
    });
    await page.addInitScript(([schemas]) => {
      localStorage.clear();
      const store = {};
      window.__calls = [];
      window.__db = store;
      window.claude = {
        use: async (n) => {
          await new Promise((r) => setTimeout(r, 50));
          if (n === 'mcp') return {
            describeTool: async (s, t) => { if (!schemas[t]) throw { code: 'bad_request' }; return { name: t, inputSchema: schemas[t] }; },
            callTool: async (s, t, input) => { window.__calls.push({ s, t, input }); const r = await window.__mockCall(t, input); if (r && r.__throw) throw r.__throw; if (r && r.structuredContent && !('payload' in r)) r.payload = r.structuredContent; else if (r && !('payload' in r)) { try { r.payload = JSON.parse(r.content[0].text); } catch { r.payload = r.content[0].text; } } return r; },
          };
          if (n === 'db') return { doc: (p) => ({ get: async () => ({ exists: !!store[p], data: () => store[p] }), set: async (d) => { store[p] = JSON.parse(JSON.stringify(d)); }, delete: async () => { delete store[p]; } }) };
          if (n === 'user') return { id: async () => 'user-123' };
          return null;
        },
      };
    }, [v.schemas]);
    await page.goto(URL);
    await page.waitForTimeout(800);
    // Plant via the onboarding with a place, which triggers live weather.
    await page.click('.species-card[data-id="barrel"]', { force: true });
    await page.click('.wel-foot .btn.primary', { force: true });
    await page.fill('#placeInput', 'Mineola, NY');
    await page.click('.naming .btn.primary', { force: true });
    await page.waitForTimeout(2500);
    const out = await page.evaluate(() => {
      const c = window.__cactus;
      return { mode: c.Game.S.wx.mode, cur: c.Game.S.wx.current, home: c.Game.S.home, live: c.Live.state, msg: c.Live.message, calls: window.__calls, cloud: Object.keys(window.__db) };
    });
    console.log(`\n== ${name}`);
    console.log(JSON.stringify(out, null, 1).slice(0, 1400));
    if (errors.length) console.log('ERRORS', errors);
    await page.screenshot({ path: `/home/user/Cactus/shots/live-${name}.png` });
    await ctx.close();
  }
  await browser.close();
})();
