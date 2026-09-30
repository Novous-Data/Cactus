/* Game state and the real-time plant simulation (integrated in ≤1 hour steps). */

const SAVE_VERSION = 1;
const SEASON_GROWTH = [0.45, 0.5, 0.8, 1, 1.1, 1.1, 1.05, 1, 0.9, 0.75, 0.55, 0.45];

function usesFahrenheit() {
  try {
    const loc = (navigator.language || 'en-US').toUpperCase();
    return /-(US|LR|MM|BS|BZ|KY|PW)$/.test(loc);
  } catch { return true; }
}

function newGame({ species, name, color, facing, home }) {
  const now = Date.now();
  return {
    v: SAVE_VERSION,
    id: Math.random().toString(36).slice(2, 10),
    createdAt: now,
    updatedAt: now,
    plant: {
      species, name: name || SPECIES[species].nick, color: color || null, plantedAt: now,
      growth: 0, health: 88, moisture: 18, saucer: 0, nutrients: 35,
      rot: 0, dryHours: 0, cold: 0, heat: 0, sunburn: 0, etiol: 0,
      lean: 0, leanDir: Math.random() < 0.5 ? -1 : 1, dust: 0, pests: 0,
      bloom: null, bloomCount: 0, lastBloomAt: 0, pups: 0, pupProgress: 0,
      pot: { size: 0, style: 'terracotta' },
      lastWaterAt: 0, lastFeedAt: 0, lastTurnAt: now, lastRepotAt: 0, turns: 0,
      lightAvg: SPECIES[species].lightNeed, healthyStreak: 0, stage: 0,
    },
    env: { windowOpen: 0, curtain: false, lamp: false, glassDirt: 18, facing: facing || 'S', wall: 'plaster', sillWet: 0 },
    home: home || guessHome(),
    wx: { mode: 'manual', current: null, log: [], liveSince: 0 },
    sim: { t: now },
    day: freshDay(now),
    journal: [],
    ach: {},
    settings: { units: usesFahrenheit() ? 'F' : 'C', sound: false, face: true },
    stats: { waterings: 0, visits: 1, lastVisit: now, feeds: 0 },
    tips: {},
  };
}

function freshDay(t) {
  return { key: dayKey(t), light: 0, hours: {}, tMin: null, tMax: null, acts: {}, growth: 0, notes: [] };
}

function dayNumber(S, t = Date.now()) {
  return calendarDays(S.plant.plantedAt, t) + 1;
}

/* Light reaching the sill, 0..~1. */
function windowLight(sun, w, env) {
  const facingAz = WINDOW_FACING[env.facing]?.az ?? 180;
  const up = Math.max(0, Math.sin(sun.el * DEG));
  const rel = angleDiff(sun.az, facingAz);
  const beam = sun.el > 0 ? Math.max(0, Math.cos(sun.el * DEG) * Math.cos(rel * DEG)) * Math.pow(up, 0.4) : 0;
  const cloud = clamp((w.cloud ?? 50) / 100, 0, 1);
  const precip = clamp(w.precip ?? 0, 0, 1);
  const fog = w.cond === 'fog' ? 0.6 : 1;
  const glass = 1 - clamp(env.glassDirt, 0, 100) / 300;
  const curtain = env.curtain ? 0.5 : 1;
  const direct = beam * Math.pow(1 - cloud, 1.5) * (1 - 0.6 * precip) * fog * glass * curtain;
  const diffuse = 0.12 * Math.pow(up, 0.6) * (1 - 0.45 * cloud * cloud) * (1 - 0.35 * precip) * fog * glass * (env.curtain ? 0.8 : 1);
  return { direct, diffuse, total: direct + diffuse, rel };
}

function sillTemp(sun, w, env, direct) {
  const indoor = sun.el > 0 ? 21 : 19.5;
  const k = 0.12 + 0.5 * env.windowOpen;
  return indoor + ((w.tempC ?? indoor) - indoor) * k + direct * 5 * (env.curtain ? 0.5 : 1);
}

function simulate(S, to, emit = () => {}) {
  let t = S.sim.t;
  if (!(to > t)) return;
  if (to - t > 150 * DAY) t = to - 150 * DAY;
  while (t < to - 1000) {
    const next = Math.min(to, Math.floor(t / HOUR) * HOUR + HOUR);
    const mid = (t + next) / 2;
    if (dayKey(mid) !== S.day.key) closeDay(S, mid, emit);
    stepPlant(S, mid, (next - t) / HOUR, emit);
    t = next;
  }
  S.sim.t = to;
}

function stepPlant(S, t, dt, emit) {
  const P = S.plant, E = S.env, sp = SPECIES[P.species];
  const w = weatherAt(S.wx.log, t, S.home.lat);
  const sun = sunPosition(t, S.home.lat, S.home.lon);
  const L = windowLight(sun, w, E);
  const light = L.total + (E.lamp ? 0.42 : 0);
  const sill = sillTemp(sun, w, E, L.direct);
  const rh = clamp(45 + ((w.humidity ?? 55) - 50) * (0.25 + 0.5 * E.windowOpen), 20, 92);
  const size = sizeFromGrowth(P.growth);

  // Day log
  const D = S.day;
  const good = clamp(light / 0.35, 0, 1.2);
  D.light += good * dt;
  D.hours[w.cond] = (D.hours[w.cond] || 0) + dt;
  if (!w.estimated && w.tempC != null) {
    D.tMin = D.tMin == null ? w.tempC : Math.min(D.tMin, w.tempC);
    D.tMax = D.tMax == null ? w.tempC : Math.max(D.tMax, w.tempC);
  }
  P.lightAvg += (good * 24 - P.lightAvg) * (1 - Math.exp(-dt / 36));

  // Soil moisture
  const potF = [1.55, 1.25, 1, 0.85][P.pot.size];
  const tempF = clamp(1 + 0.06 * (sill - 20), 0.35, 2.3);
  const rhF = clamp(1 + (45 - rh) * 0.012, 0.6, 1.5);
  let dry = 0.3 * potF * tempF * (1 + 1.4 * light) * rhF * (0.75 + 0.5 * size) * (1 + 0.3 * E.windowOpen) * dt;
  if (P.saucer > 0) {
    P.saucer = Math.max(0, P.saucer - (0.9 + 0.3 * tempF) * dt);
    dry *= 0.25;
  }
  P.moisture = clamp(P.moisture - dry, 0, 100);
  if (E.windowOpen > 0.1 && (WET.has(w.cond) || w.cond === 'storm')) {
    P.moisture = clamp(P.moisture + 1.4 * (w.precip || 0.5) * E.windowOpen * dt, 0, 100);
    E.sillWet = Math.min(1, E.sillWet + 0.2 * dt);
    if (!D.notes.includes('Rain blew in through the open window.')) D.notes.push('Rain blew in through the open window.');
  } else E.sillWet = Math.max(0, E.sillWet - 0.08 * dt);

  // Rot from soggy soil
  const wet = P.moisture > 72 ? (P.moisture - 72) / 28 : 0;
  const rotIn = (wet + (P.saucer > 0 ? 0.6 : 0)) * 0.9 * sp.rotSens * (sill < 16 ? 1.8 : 1) * (light < 0.1 ? 1.25 : 1);
  P.rot = clamp(P.rot + (rotIn - (P.moisture < 40 ? 0.5 : 0.08)) * dt, 0, 100);

  // Drought
  if (P.moisture < 4) P.dryHours += dt; else P.dryHours = Math.max(0, P.dryHours - 3 * dt);
  const droughtDays = P.dryHours / 24;

  // Temperature stress
  if (sill < sp.coldMin) P.cold = clamp(P.cold + (sp.coldMin - sill) * 0.8 * dt, 0, 100);
  else P.cold = Math.max(0, P.cold - 1.2 * dt);
  if (sill > 36) P.heat = clamp(P.heat + (sill - 36) * dt, 0, 100);
  else P.heat = Math.max(0, P.heat - 1.5 * dt);

  // Harsh direct sun
  const burn = Math.max(0, L.direct - 0.45) * 6 * sp.sunburn - 0.08;
  P.sunburn = clamp(P.sunburn + burn * dt, 0, 100);

  // Food, dust, pests
  P.nutrients = Math.max(0, P.nutrients - 0.07 * dt);
  P.dust = clamp(P.dust + 0.02 * dt, 0, 100);
  E.glassDirt = clamp(E.glassDirt + 0.035 * dt, 0, 100);
  const pestChance = 0.0008 * (E.windowOpen > 0.2 ? 0.6 : 1) * (P.health < 50 ? 2 : 1) * (P.dust > 50 ? 1.3 : 1);
  if (P.pests === 0 && Math.random() < pestChance * dt) {
    P.pests = 1;
    emit('pests');
  } else if (P.pests > 0) P.pests = Math.min(12, P.pests + 0.012 * P.pests * dt);

  // Leaning towards the light
  P.lean = clamp(P.lean + P.leanDir * 0.0012 * Math.min(1, light * 2) * dt, -1, 1);

  // Health
  let dmg = 0;
  if (P.rot > 45) dmg += (P.rot - 45) * 0.02;
  if (droughtDays > sp.dryDays) dmg += 0.12;
  if (P.cold > 25) dmg += (P.cold - 25) * 0.01;
  if (P.heat > 20) dmg += 0.05;
  if (P.sunburn > 40) dmg += (P.sunburn - 40) * 0.006;
  if (P.pests > 0) dmg += 0.015 * P.pests;
  if (P.nutrients > 85) dmg += 0.05;
  const heal = dmg > 0.01 ? 0 : 0.14;
  P.health = clamp(P.health + (heal - dmg) * dt, 0, 100);

  // Growth
  const potCap = POT_SIZES[P.pot.size].cap;
  const rootbound = size > potCap;
  const Fl = clamp(P.lightAvg / sp.lightNeed, 0.1, 1.15);
  const m = P.moisture;
  const Fw = m < 3 ? 0.12 : m < 10 ? 0.65 : m <= 72 ? 1 : m <= 90 ? 0.8 : 0.55;
  const Ft = sill < 8 ? 0.1 : sill < 16 ? 0.55 : sill <= 32 ? 1 : sill <= 38 ? 0.6 : 0.2;
  const Fh = 0.25 + 0.75 * (P.health / 100);
  const Fs = SEASON_GROWTH[hemiMonth(t, S.home.lat) - 1];
  const Fn = Fs >= 0.75 ? 1 + 0.35 * (P.nutrients / 100) : 1;
  const young = 1.55 - 0.75 * size;
  const g = (6 / 24) * sp.rate * young * Fl * Fw * Ft * Fh * Fs * Fn * (rootbound ? 0.3 : 1) * dt;
  P.growth += g;
  D.growth += g;

  const st = stageIndex(P.growth);
  if (st > P.stage) {
    P.stage = st;
    D.notes.push(`Reached the ${STAGES[st].name} stage.`);
    emit('stage', st);
    if (STAGES[st].id === 'mature') unlock(S, 'mature', emit);
  }
  if (rootbound && !P.rootboundWarned) {
    P.rootboundWarned = true;
    emit('rootbound');
  }
  if (sp.pups && st >= 4 && P.pups < sp.pups) {
    P.pupProgress += g * 0.06;
    if (P.pupProgress >= 1) {
      P.pupProgress = 0;
      P.pups++;
      D.notes.push('A new baby offset appeared.');
      emit('pup');
    }
  }

  // Bloom lifecycle
  if (P.bloom) {
    const age = (t - P.bloom.since) / DAY;
    if (P.bloom.stage === 'bud' && age > 2.5) { P.bloom = { stage: 'open', since: t }; D.notes.push('Flowers opened!'); emit('bloom'); unlock(S, 'firstBloom', emit); P.bloomCount++; }
    else if (P.bloom.stage === 'open' && age > 5) { P.bloom = { stage: 'fading', since: t }; }
    else if (P.bloom.stage === 'fading' && age > 1.2) { P.bloom = null; P.lastBloomAt = t; }
  }
}

function closeDay(S, t, emit) {
  const D = S.day, P = S.plant, sp = SPECIES[P.species];
  const conds = Object.entries(D.hours).sort((a, b) => b[1] - a[1]);
  const t0 = new Date(`${D.key}T12:00:00`).getTime();
  S.journal.push({
    k: D.key,
    n: calendarDays(P.plantedAt, t0) + 1,
    cond: conds[0]?.[0] || null,
    hi: D.tMax == null ? null : Math.round(D.tMax * 10) / 10,
    lo: D.tMin == null ? null : Math.round(D.tMin * 10) / 10,
    light: Math.round(D.light * 10) / 10,
    moist: Math.round(P.moisture),
    g: Math.round(D.growth * 100) / 100,
    size: Math.round(sizeFromGrowth(P.growth) * 1000) / 1000,
    h: Math.round(P.health),
    acts: D.acts,
    notes: D.notes.slice(0, 6),
  });
  if (S.journal.length > 400) S.journal.splice(0, S.journal.length - 400);

  // Stretching from low light
  if (D.light < sp.lightNeed * 0.5) P.etiol = clamp(P.etiol + 6, 0, 100);
  else P.etiol = Math.max(0, P.etiol - 3);

  // Streaks
  P.healthyStreak = P.health > 85 ? P.healthyStreak + 1 : 0;
  if (P.healthyStreak >= 7) unlock(S, 'greenThumb', emit);

  // Budding
  const st = stageIndex(P.growth);
  const month = hemiMonth(t, S.home.lat);
  const canBloom = st >= (P.species === 'christmas' || P.species === 'oldlady' ? 4 : 5);
  const inSeason = sp.bloomMonths.includes(month);
  const cooled = !P.lastBloomAt || t - P.lastBloomAt > 25 * DAY;
  if (!P.bloom && canBloom && cooled && P.health > 65 && P.rot < 40 && P.dryHours / 24 < sp.dryDays) {
    const chance = inSeason ? 0.35 : P.healthyStreak >= 10 ? 0.05 : 0;
    if (Math.random() < chance) {
      P.bloom = { stage: 'bud', since: t };
      D.notes.push('Flower buds appeared!');
      emit('bud');
    }
  }

  S.day = freshDay(t);
  const n = dayNumber(S, t);
  if (n >= 7) unlock(S, 'week', emit);
  if (n >= 30) unlock(S, 'month', emit);
  if (n >= 100) unlock(S, 'hundred', emit);
  emit('day', n);
}

function unlock(S, id, emit) {
  if (S.ach[id]) return false;
  S.ach[id] = Date.now();
  emit && emit('ach', id);
  return true;
}

/* ---------- player actions (return a message for the UI) ---------- */
const Actions = {
  water(S, amount = 70) {
    const P = S.plant, sp = SPECIES[P.species];
    const before = P.moisture;
    const total = before + amount;
    P.moisture = Math.min(100, total);
    if (total > 100) P.saucer = Math.min(30, P.saucer + (total - 100) * 0.5);
    P.lastWaterAt = Date.now();
    S.stats.waterings++;
    S.day.acts.water = (S.day.acts.water || 0) + 1;
    const damp = P.species === 'christmas' ? 70 : 45;
    if (before > damp) {
      P.rot = clamp(P.rot + 6 * sp.rotSens, 0, 100);
      return { tone: 'warn', text: 'The soil was still damp. Too much water can rot the roots.' };
    }
    if (P.lastRepotAt && Date.now() - P.lastRepotAt < 5 * DAY) {
      P.rot = clamp(P.rot + 4, 0, 100);
      return { tone: 'warn', text: 'Fresh roots are tender. After repotting, wait about a week before watering.' };
    }
    return { tone: 'good', text: before < 10 ? 'A good deep soak. Now let it dry out.' : 'Watered.' };
  },
  feed(S) {
    const P = S.plant;
    const Fs = SEASON_GROWTH[hemiMonth(Date.now(), S.home.lat) - 1];
    const since = P.lastFeedAt ? (Date.now() - P.lastFeedAt) / DAY : 99;
    P.nutrients = clamp(P.nutrients + (Fs >= 0.75 ? 30 : 15), 0, 100);
    P.lastFeedAt = Date.now();
    S.stats.feeds = (S.stats.feeds || 0) + 1;
    S.day.acts.feed = (S.day.acts.feed || 0) + 1;
    if (since < 14) return { tone: 'warn', text: 'Fed again so soon? Too much food can burn the roots.' };
    if (Fs < 0.75) return { tone: 'info', text: 'Cacti rest in the cold months. Food helps most in spring and summer.' };
    return { tone: 'good', text: 'A little cactus food. Growth will get a boost.' };
  },
  turn(S) {
    const P = S.plant;
    P.lean *= 0.3;
    P.turns++;
    P.lastTurnAt = Date.now();
    S.day.acts.turn = (S.day.acts.turn || 0) + 1;
    return { tone: 'good', text: 'Quarter turn. It will grow straight and even.' };
  },
  swab(S) {
    const P = S.plant;
    S.day.acts.swab = (S.day.acts.swab || 0) + 1;
    if (P.pests > 0) {
      P.pests = 0;
      return { tone: 'good', text: 'Mealybugs gone. Keep an eye out for fluffy white spots.' };
    }
    return { tone: 'info', text: 'No mealybugs found. Nice and clean.' };
  },
  mist(S) {
    const P = S.plant, sp = SPECIES[P.species];
    S.day.acts.mist = (S.day.acts.mist || 0) + 1;
    if (sp.likesMist) {
      P.moisture = clamp(P.moisture + 2, 0, 100);
      P.health = clamp(P.health + 1, 0, 100);
      return { tone: 'good', text: 'Rainforest cacti love a little humidity.' };
    }
    P.rot = clamp(P.rot + 2, 0, 100);
    return { tone: 'info', text: 'Desert cacti don’t need misting. Water at the roots instead.' };
  },
  clean(S) {
    const was = S.env.glassDirt;
    S.env.glassDirt = 0;
    S.plant.dust = 0;
    S.day.acts.clean = (S.day.acts.clean || 0) + 1;
    return { tone: 'good', text: was > 30 ? 'Sparkling. More light gets through now.' : 'The glass was already pretty clean.' };
  },
  repot(S, size, style) {
    const P = S.plant;
    const bigger = size > P.pot.size;
    P.pot = { size, style };
    S.day.acts.repot = 1;
    if (bigger) {
      P.lastRepotAt = Date.now();
      P.rootboundWarned = false;
      P.moisture = Math.min(P.moisture, 15);
      P.health = clamp(P.health - 3, 0, 100);
      return { tone: 'good', text: 'Repotted in fresh gritty mix. Wait about a week before watering.' };
    }
    return { tone: 'good', text: `Moved to the ${POT_STYLES[style].name} pot.` };
  },
};

function meterReading(moisture) {
  const v = clamp(Math.round(1 + moisture / 11), 1, 10);
  const zone = v <= 3 ? 'DRY' : v <= 7 ? 'MOIST' : 'WET';
  return { v, zone };
}

/* What the cactus would say, most important first. */
function needs(S, now = Date.now(), wx = null) {
  const P = S.plant, E = S.env, sp = SPECIES[P.species];
  const out = [];
  const thirstyAt = P.species === 'christmas' ? 30 : 6;
  const size = sizeFromGrowth(P.growth);
  if (E.windowOpen > 0.1 && wx && (WET.has(wx.cond) || wx.cond === 'storm' || SNOWY.has(wx.cond))) out.push({ id: 'close', tool: 'window', text: 'It’s coming in the window! Close it.' });
  if (E.windowOpen > 0.1 && wx && wx.tempC != null && wx.tempC < sp.coldMin + 6) out.push({ id: 'cold', tool: 'window', text: 'Brr. It’s cold out there. Close the window.' });
  if (P.pests > 0) out.push({ id: 'pests', tool: 'swab', text: 'Mealybugs! Dab them off with the swab.' });
  if (P.rot > 45) out.push({ id: 'rot', tool: null, text: 'My roots are soggy. Let the soil dry out completely.' });
  if (P.moisture < thirstyAt) out.push({ id: 'water', tool: 'water', text: P.dryHours > 24 * sp.dryDays * 0.5 ? 'So thirsty… time for a deep drink.' : 'Soil’s dry. I could use a drink.' });
  if (size > POT_SIZES[P.pot.size].cap) out.push({ id: 'repot', tool: 'repot', text: 'My roots are crowded. Could I get a bigger pot?' });
  if (P.sunburn > 30) out.push({ id: 'burn', tool: 'curtain', text: 'This sun is harsh. Draw the sheer curtain for a bit.' });
  if (Math.abs(P.lean) > 0.35) out.push({ id: 'turn', tool: 'turn', text: 'I’m leaning toward the light. Give me a quarter turn.' });
  if (P.lightAvg < sp.lightNeed * 0.55) out.push({ id: 'light', tool: 'lamp', text: 'It’s been dim lately. The grow light would help.' });
  if (E.glassDirt > 55) out.push({ id: 'glass', tool: 'cloth', text: 'The glass is getting dusty. A wipe lets more sun in.' });
  const Fs = SEASON_GROWTH[hemiMonth(now, S.home.lat) - 1];
  if (Fs >= 0.9 && P.nutrients < 12 && (!P.lastFeedAt || now - P.lastFeedAt > 25 * DAY)) out.push({ id: 'feed', tool: 'food', text: 'Growing season! A little food would be nice.' });
  return out;
}

function moodOf(S, now, phase) {
  const P = S.plant, sp = SPECIES[P.species];
  if (P.health < 30) return 'sick';
  if (P.rot > 50) return 'soggy';
  if (P.pests > 0) return 'itchy';
  if (P.cold > 20) return 'cold';
  if (P.heat > 15 || P.sunburn > 45) return 'hot';
  if (P.moisture < 4 && P.dryHours > 24 * Math.min(4, sp.dryDays * 0.3)) return 'thirsty';
  if (phase === 'night') return 'sleepy';
  if (P.bloom?.stage === 'open') return 'proud';
  if (P.health > 80) return 'happy';
  return 'content';
}
