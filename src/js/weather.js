/* Weather: normalising live data, manual sky, climate estimates, and photo choice. */

const ACCU_SERVER = 'AccuWeather®';
const ACCU_TOOLS = { current: 'widgets-current-claude', search: 'widgets-search-claude' };

/* AccuWeather icon numbers -> normalised condition (33+ are night icons). */
const ACCU_ICONS = {
  1: 'clear', 2: 'mostly_clear', 3: 'partly', 4: 'partly', 5: 'haze', 6: 'cloudy', 7: 'overcast', 8: 'overcast',
  11: 'fog', 12: 'rain', 13: 'rain', 14: 'rain', 15: 'storm', 16: 'storm', 17: 'storm', 18: 'rain',
  19: 'flurries', 20: 'flurries', 21: 'flurries', 22: 'snow', 23: 'snow', 24: 'freezing_rain', 25: 'sleet',
  26: 'freezing_rain', 29: 'sleet', 30: 'clear', 31: 'clear', 32: 'partly',
  33: 'clear', 34: 'mostly_clear', 35: 'partly', 36: 'partly', 37: 'haze', 38: 'cloudy', 39: 'rain', 40: 'rain',
  41: 'storm', 42: 'storm', 43: 'flurries', 44: 'snow',
};

const TEXT_RULES = [
  [/thunder|t-?storm|lightning/i, 'storm'],
  [/freezing (rain|drizzle)|ice pellets|glaze|\bice\b/i, 'freezing_rain'],
  [/sleet|wintry mix|rain and snow|snow and rain/i, 'sleet'],
  [/flurr/i, 'flurries'],
  [/blizzard|snow/i, 'snow'],
  [/heavy rain|downpour|torrential|pouring/i, 'heavy_rain'],
  [/drizzle|sprinkle|light rain/i, 'drizzle'],
  [/rain|shower/i, 'rain'],
  [/fog|mist/i, 'fog'],
  [/haz|smoke|dust/i, 'haze'],
  [/overcast|dreary/i, 'overcast'],
  [/mostly cloudy|considerable cloud/i, 'cloudy'],
  [/partly|intermittent clouds|some clouds|variable clouds|few clouds/i, 'partly'],
  [/mostly (sunny|clear)/i, 'mostly_clear'],
  [/cloud/i, 'overcast'],
  [/sunny|clear|fair|sunshine/i, 'clear'],
];

function condFromText(text) {
  if (!text) return null;
  for (const [re, cond] of TEXT_RULES) if (re.test(text)) return cond;
  return null;
}

function walkJson(obj, fn, depth = 0, seen = new Set()) {
  if (obj == null || depth > 9 || typeof obj !== 'object' || seen.has(obj)) return;
  seen.add(obj);
  if (Array.isArray(obj)) {
    for (const v of obj.slice(0, 60)) walkJson(v, fn, depth + 1, seen);
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    fn(k, v, obj);
    walkJson(v, fn, depth + 1, seen);
  }
}

/* Pull a temperature in °C out of the many shapes weather APIs use. */
function readTempC(v, holder) {
  if (v == null) return null;
  if (typeof v === 'number') {
    const unit = String(holder?.Unit ?? holder?.unit ?? holder?.units ?? '').toUpperCase();
    if (unit.startsWith('F')) return (v - 32) / 1.8;
    if (unit.startsWith('C')) return v;
    return null;
  }
  if (typeof v === 'string') {
    const m = v.match(/(-?\d+(?:\.\d+)?)\s*°?\s*([CF])\b/i);
    if (m) return m[2].toUpperCase() === 'F' ? (parseFloat(m[1]) - 32) / 1.8 : parseFloat(m[1]);
    return null;
  }
  if (typeof v === 'object') {
    if (v.Metric && typeof v.Metric.Value === 'number') return v.Metric.Value;
    if (v.metric && typeof v.metric.value === 'number') return v.metric.value;
    if (v.Imperial && typeof v.Imperial.Value === 'number') return (v.Imperial.Value - 32) / 1.8;
    if (v.imperial && typeof v.imperial.value === 'number') return (v.imperial.value - 32) / 1.8;
    if (typeof v.Value === 'number') return readTempC(v.Value, v);
    if (typeof v.value === 'number') return readTempC(v.value, v);
    if (typeof v.celsius === 'number') return v.celsius;
    if (typeof v.fahrenheit === 'number') return (v.fahrenheit - 32) / 1.8;
  }
  return null;
}

/* Best-effort reading of a current-conditions payload of unknown shape. */
function parseCurrentConditions(result) {
  const payload = result && 'payload' in result ? result.payload : result;
  const texts = [];
  for (const block of result?.content || []) if (block?.type === 'text' && block.text) texts.push(block.text);
  const out = { text: null, icon: null, isDay: null, tempC: null, humidity: null, cloud: null, wind: null, precipType: null, hasPrecip: null, place: null, lat: null, lon: null };

  const visit = (k, v, holder) => {
    const key = k.toLowerCase().replace(/[^a-z]/g, '');
    if (out.text == null && typeof v === 'string' && v.length < 80 && /^(weathertext|iconphrase|phrase|shortphrase|condition|conditions|conditiontext|summary|description|weather|text|weatherdescription)$/.test(key) && condFromText(v)) out.text = v;
    if (out.icon == null && typeof v === 'number' && /^(weathericon|icon|iconcode|iconnumber)$/.test(key) && v >= 1 && v <= 44) out.icon = v;
    if (out.isDay == null && typeof v === 'boolean' && /^(isdaytime|isday|daytime|day)$/.test(key)) out.isDay = v;
    if (out.tempC == null && /^(temperature|temp|tempc|temperaturec|tempf|temperaturef|airtemperature|currenttemperature)$/.test(key)) {
      let c = readTempC(v, holder);
      if (c == null && typeof v === 'number') c = /f$/.test(key) ? (v - 32) / 1.8 : /c$/.test(key) ? v : null;
      if (c != null && c > -70 && c < 60) out.tempC = c;
    }
    if (out.humidity == null && typeof v === 'number' && /^(relativehumidity|humidity|indoorrelativehumidity)$/.test(key) && v >= 0 && v <= 100) out.humidity = v;
    if (out.cloud == null && typeof v === 'number' && /^(cloudcover|clouds|cloudiness)$/.test(key) && v >= 0 && v <= 100) out.cloud = v;
    if (out.wind == null && /^(wind|windspeed)$/.test(key)) {
      const s = typeof v === 'number' ? v : v?.Speed?.Metric?.Value ?? v?.speed?.metric?.value ?? v?.Speed?.Value ?? v?.speed;
      if (typeof s === 'number') out.wind = s;
    }
    if (out.hasPrecip == null && typeof v === 'boolean' && /^(hasprecipitation|precipitation|isprecipitating)$/.test(key)) out.hasPrecip = v;
    if (out.precipType == null && typeof v === 'string' && /^(precipitationtype|preciptype)$/.test(key)) out.precipType = v;
    if (out.place == null && typeof v === 'string' && /^(localizedname|englishname|city|cityname|locationname)$/.test(key) && v.length < 60) out.place = v;
    if (out.lat == null && typeof v === 'number' && /^(latitude|lat)$/.test(key) && Math.abs(v) <= 90) out.lat = v;
    if (out.lon == null && typeof v === 'number' && /^(longitude|lon|lng)$/.test(key) && Math.abs(v) <= 180) out.lon = v;
  };
  if (payload && typeof payload === 'object') walkJson(payload, visit);

  const allText = [typeof payload === 'string' ? payload : '', ...texts].join('\n');
  if (out.tempC == null) {
    const m = allText.match(/(-?\d+(?:\.\d+)?)\s*°\s*([CF])\b/i);
    if (m) out.tempC = m[2].toUpperCase() === 'F' ? (parseFloat(m[1]) - 32) / 1.8 : parseFloat(m[1]);
  }
  let cond = out.icon ? ACCU_ICONS[out.icon] : null;
  if (!cond) cond = condFromText(out.text);
  if (!cond) cond = condFromText(allText.slice(0, 600));
  if (out.icon && out.isDay == null) out.isDay = out.icon < 33;
  if (!cond) return null;
  if (out.hasPrecip && out.precipType && ['clear', 'mostly_clear', 'partly', 'cloudy', 'overcast'].includes(cond)) {
    cond = /snow/i.test(out.precipType) ? 'snow' : /ice|sleet|mixed/i.test(out.precipType) ? 'sleet' : 'rain';
  }
  return {
    cond,
    label: out.text || CONDITIONS[cond].label,
    tempC: out.tempC,
    humidity: out.humidity,
    cloud: out.cloud ?? CONDITIONS[cond].cloud,
    precip: CONDITIONS[cond].precip,
    wind: out.wind,
    isDay: out.isDay,
    place: out.place,
    lat: out.lat,
    lon: out.lon,
  };
}

/* Location search result -> {key, name, lat, lon}. */
function parseLocation(result) {
  const payload = result && 'payload' in result ? result.payload : result;
  let best = null;
  const consider = (o) => {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return;
    const key = o.Key ?? o.key ?? o.locationKey ?? o.LocationKey ?? o.location_key ?? o.id;
    const name = o.LocalizedName ?? o.localizedName ?? o.EnglishName ?? o.name ?? o.city;
    if (key == null || name == null) return;
    const geo = o.GeoPosition || o.geoPosition || o.geo || o;
    best = best || {
      key: String(key), name: String(name),
      region: o.AdministrativeArea?.ID || o.AdministrativeArea?.LocalizedName || o.region || '',
      lat: typeof geo.Latitude === 'number' ? geo.Latitude : geo.latitude ?? geo.lat ?? null,
      lon: typeof geo.Longitude === 'number' ? geo.Longitude : geo.longitude ?? geo.lon ?? null,
    };
  };
  if (Array.isArray(payload)) payload.forEach(consider);
  consider(payload);
  if (!best && payload && typeof payload === 'object') walkJson(payload, (k, v) => { if (!best) { if (Array.isArray(v)) v.forEach(consider); else consider(v); } });
  if (!best) {
    const text = (result?.content || []).map((b) => b.text || '').join('\n');
    const m = text.match(/(?:location\s*key|key)\W+(\d{3,})/i);
    if (m) best = { key: m[1], name: '', region: '', lat: null, lon: null };
  }
  return best;
}

/* Fill a tool's input from its JSON schema using what we know about the place. */
function buildToolInput(schema, ctx) {
  const props = schema && typeof schema === 'object' ? schema.properties || {} : {};
  const required = new Set(schema?.required || []);
  const input = {};
  for (const [name, spec] of Object.entries(props)) {
    const n = name.toLowerCase();
    const desc = String(spec?.description || '').toLowerCase();
    const type = Array.isArray(spec?.type) ? spec.type.find((t) => t !== 'null') : spec?.type || (spec?.enum ? typeof spec.enum[0] : 'string');
    let v;
    if (type === 'object' && spec?.properties) {
      v = buildToolInput(spec, ctx);
    } else if (/(^|_)lat(itude)?$/.test(n) || n === 'lat') v = ctx.lat;
    else if (/(^|_)(lon|lng|long|longitude)$/.test(n)) v = ctx.lon;
    else if (/location_?key|locationkey|^key$|loc_?id|location_?id|citykey/.test(n) || /location key/.test(desc)) v = ctx.key;
    else if (/query|^q$|city|location|place|search|address|name|text|term|zip|postal/.test(n)) v = ctx.query;
    else if (/unit|metric|system/.test(n)) {
      if (spec?.enum) v = spec.enum.find((e) => /metric|celsius|^c$/i.test(String(e))) ?? spec.enum[0];
      else v = type === 'boolean' ? true : 'metric';
    } else if (/lang|locale/.test(n)) v = 'en-us';
    else if (/detail/.test(n) && type === 'boolean') v = true;
    else if (spec?.default !== undefined) v = spec.default;
    if (v == null || v === '') {
      if (required.has(name)) return null;
      continue;
    }
    if (type === 'number' || type === 'integer') v = Number(v);
    else if (type === 'string') v = String(v);
    else if (type === 'boolean') v = Boolean(v);
    input[name] = v;
  }
  return input;
}

/* Typical temperature for a place and time, for hours with no observation. */
function climateTempC(t, lat) {
  const a = Math.abs(lat);
  const mean = 27 - 0.36 * a;
  const amp = clamp(0.33 * a - 1.5, 1, 20);
  const d = new Date(t);
  const doy = (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / DAY;
  const peak = lat >= 0 ? 200 : 17;
  const hour = d.getHours() + d.getMinutes() / 60;
  return mean + amp * Math.cos(TAU * (doy - peak) / 365) + 4.5 * Math.cos(TAU * (hour - 15) / 24);
}

/* Weather to use for simulation at time t: nearest earlier observation, else climate. */
function weatherAt(log, t, lat) {
  let best = null;
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].t <= t + 5 * MIN) { best = log[i]; break; }
  }
  const est = { cond: 'partly', cloud: 55, precip: 0.08, tempC: climateTempC(t, lat), humidity: 60, estimated: true };
  if (!best) return est;
  const age = t - best.t;
  const hold = best.src === 'manual' ? 6 * HOUR : 3 * HOUR;
  if (age > hold + 3 * HOUR) return est;
  const w = {
    cond: best.cond, cloud: best.cloud ?? CONDITIONS[best.cond].cloud, precip: best.precip ?? CONDITIONS[best.cond].precip,
    tempC: best.tempC ?? climateTempC(t, lat), humidity: best.humidity ?? 60,
  };
  if (age <= hold) return w;
  const k = (age - hold) / (3 * HOUR); // fade towards the estimate
  return { ...w, cloud: lerp(w.cloud, est.cloud, k), precip: lerp(w.precip, est.precip, k), tempC: lerp(w.tempC, est.tempC, k) };
}

const WET = new Set(['drizzle', 'rain', 'heavy_rain', 'freezing_rain', 'sleet']);
const SNOWY = new Set(['snow', 'flurries']);
const SUNNY = new Set(['clear', 'mostly_clear', 'partly', 'haze']);

function dayPhotoFor(cond, season, dk) {
  switch (cond) {
    case 'clear':
    case 'mostly_clear': return season === 'summer' && Number(dk.slice(-2)) % 2 ? 'farm' : 'clear';
    case 'partly': return 'partly';
    case 'haze': return 'hazy';
    case 'cloudy': return season === 'autumn' ? 'cloudy_fall' : 'cloudy';
    case 'overcast': return season === 'autumn' ? 'cloudy_fall' : 'cloudy';
    case 'fog': return 'fog';
    case 'storm': return 'storm';
    case 'flurries': return 'snow_sun';
    case 'snow': return 'snow';
    default: return WET.has(cond) ? 'rain' : 'partly';
  }
}

/* Which photo to show and how to grade it for the current sky. */
function chooseScene(cond, phase, season, dk) {
  if (phase === 'night') {
    if (WET.has(cond) || cond === 'storm') return { photo: 'night_rain', grade: 'native-night' };
    if (SNOWY.has(cond)) return { photo: 'snow', grade: 'night' };
    if (cond === 'fog') return { photo: 'fog', grade: 'night' };
    if (cond === 'cloudy' || cond === 'overcast') return { photo: 'cloudy', grade: 'night' };
    return { photo: 'night', grade: 'native-night' };
  }
  if (phase === 'dawn' || phase === 'dusk') {
    if (SUNNY.has(cond)) return { photo: 'dusk', grade: 'native' };
    return { photo: dayPhotoFor(cond, season, dk), grade: 'twilight' };
  }
  if (phase === 'sunrise' || phase === 'sunset') {
    if (SUNNY.has(cond)) return { photo: 'golden', grade: 'native' };
    return { photo: dayPhotoFor(cond, season, dk), grade: 'golden' };
  }
  return { photo: dayPhotoFor(cond, season, dk), grade: 'day' };
}

const GRADES = {
  day: { filter: 'none', overlay: 'transparent', blend: 'normal' },
  native: { filter: 'none', overlay: 'transparent', blend: 'normal' },
  'native-night': { filter: 'brightness(.92)', overlay: 'transparent', blend: 'normal' },
  golden: { filter: 'saturate(1.12) sepia(.22) brightness(.9)', overlay: 'linear-gradient(180deg, rgba(255,150,70,.35), rgba(255,190,120,.12) 60%, rgba(80,40,20,.1))', blend: 'soft-light' },
  twilight: { filter: 'brightness(.5) saturate(.7)', overlay: 'linear-gradient(180deg, rgba(70,70,150,.55), rgba(230,120,120,.25))', blend: 'multiply' },
  night: { filter: 'brightness(.26) saturate(.5) contrast(1.08)', overlay: 'linear-gradient(180deg, rgba(20,30,80,.55), rgba(10,15,40,.6))', blend: 'multiply' },
};

/* ---------- live weather through the AccuWeather connector ---------- */

const Live = {
  mcp: null,
  schemas: {},
  state: 'off', // off | unavailable | ready | loading | live | error
  message: '',
  lastTry: 0,

  async init() {
    try {
      this.mcp = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('mcp') : null;
    } catch { this.mcp = null; }
    this.state = this.mcp ? 'ready' : 'unavailable';
    if (!this.mcp) this.message = 'Live weather needs the page open inside Claude.';
    return !!this.mcp;
  },

  errorText(e, place) {
    switch (e?.code) {
      case 'server_not_connected':
      case 'server_not_found':
        return 'Add the AccuWeather connector in claude.ai → Settings → Connectors (free, no account), then reload.';
      case 'needs_reauth': return 'Reconnect AccuWeather in claude.ai → Settings → Connectors.';
      case 'selection_required': return 'Pick which AccuWeather connector to use when Claude asks, then try again.';
      case 'not_in_manifest':
      case 'consent_required': return 'Live weather is switched off for this page. You can set the sky by hand.';
      case 'blocked_by_policy':
      case 'approval_required': return 'Your organisation blocks the AccuWeather connector here.';
      case 'tool_error': return `AccuWeather couldn’t find “${place}”. Try a nearby city name.`;
      case 'not_granted':
      case 'capability_disabled':
      case 'capability_removed': return 'Live weather isn’t available in this view.';
      case 'parse': return 'AccuWeather answered, but the reply wasn’t readable. Set the sky by hand for now.';
      default: return 'AccuWeather didn’t answer. The game will try again soon.';
    }
  },

  async describe(tool) {
    if (this.schemas[tool] !== undefined) return this.schemas[tool];
    try {
      const d = await this.mcp.describeTool(ACCU_SERVER, tool);
      this.schemas[tool] = d?.inputSchema || null;
    } catch (e) {
      // Connection problems are worth reporting; anything else just means "no schema".
      if (['server_not_connected', 'server_not_found', 'needs_reauth', 'selection_required', 'blocked_by_policy'].includes(e?.code)) throw e;
      return null;
    }
    return this.schemas[tool];
  },

  /* The connector's schema is only readable once the viewer has allowed it for this page. */
  async ensureConsent() {
    let perms = null;
    try { perms = await window.claude.use('permissions'); } catch { perms = null; }
    if (!perms) return;
    const name = `mcp:${ACCU_SERVER}`;
    let st = await perms.state(name).catch(() => 'unavailable');
    if (st === 'prompt') {
      const res = await perms.request([name]).catch(() => ({}));
      st = res?.[name] || st;
    }
    if (st === 'denied') throw { code: 'not_in_manifest' };
  },

  async call(tool, input) {
    try {
      return await this.mcp.callTool(ACCU_SERVER, tool, input, { cache: false });
    } catch (e) {
      if (e?.retryable) {
        await sleep(clamp(e.retryAfterMs || 2500, 1000, 15000) + Math.random() * 800);
        return this.mcp.callTool(ACCU_SERVER, tool, input, { cache: false });
      }
      throw e;
    }
  },

  /* place: {query, lat, lon, key}. Resolves {weather, place} or throws {code}. */
  async fetchCurrent(place) {
    if (!this.mcp) throw { code: 'not_granted' };
    this.lastTry = Date.now();
    await this.ensureConsent();
    const ctx = { query: place.query, lat: place.lat, lon: place.lon, key: place.key };
    // The first call asks the viewer for consent; schemas become readable after that.
    let schema = await this.describe(ACCU_TOOLS.current);
    let input = schema ? buildToolInput(schema, ctx) : null;
    let found = null;
    const needsKey = schema && Object.keys(schema.properties || {}).some((k) => /key|loc_?id|location_?id/i.test(k) || /location key/i.test(schema.properties[k]?.description || ''));
    if ((!input || needsKey) && !ctx.key) {
      const sSchema = await this.describe(ACCU_TOOLS.search);
      const sInput = (sSchema && buildToolInput(sSchema, ctx)) || { query: ctx.query };
      const res = await this.call(ACCU_TOOLS.search, sInput);
      found = parseLocation(res);
      if (found) ctx.key = found.key;
      if (!schema) { this.schemas[ACCU_TOOLS.current] = undefined; schema = await this.describe(ACCU_TOOLS.current); }
      input = schema ? buildToolInput(schema, ctx) : null;
    }
    if (!input) input = ctx.key ? { locationKey: ctx.key, query: ctx.query } : { query: ctx.query };
    const res = await this.call(ACCU_TOOLS.current, input);
    const w = parseCurrentConditions(res);
    if (!w) {
      console.info('[weather] unreadable AccuWeather reply', res);
      throw { code: 'parse' };
    }
    return {
      weather: w,
      place: {
        key: ctx.key || null,
        name: found?.name || w.place || place.query,
        region: found?.region || '',
        lat: found?.lat ?? w.lat ?? place.lat,
        lon: found?.lon ?? w.lon ?? place.lon,
      },
    };
  },
};
