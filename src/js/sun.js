/* Solar position (low-precision almanac formulas, good to ~0.5°). */

function sunPosition(t, lat, lon) {
  const d = t / DAY + 2440587.5 - 2451545.0; // days since J2000
  const g = ((357.529 + 0.98560028 * d) % 360) * DEG;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG;
  const eps = (23.439 - 0.00000036 * d) * DEG;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(eps) * Math.sin(L));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const lst = (gmst * 15 + lon) * DEG;
  const H = lst - ra;
  const phi = lat * DEG;
  const el = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const A = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  const az = ((A / DEG) + 180 + 360) % 360;
  return { el: el / DEG, az };
}

/* Times (ms) when the sun crosses `alt` degrees on the local calendar day of t. */
function sunCrossings(t, lat, lon, alt = -0.833) {
  const t0 = startOfDay(t);
  const step = 10 * MIN;
  let rise = null, set = null;
  let prev = sunPosition(t0, lat, lon).el - alt;
  for (let k = step; k <= DAY; k += step) {
    const cur = sunPosition(t0 + k, lat, lon).el - alt;
    if (prev < 0 && cur >= 0 && rise == null) rise = refine(t0 + k - step, t0 + k);
    if (prev >= 0 && cur < 0 && set == null) set = refine(t0 + k - step, t0 + k);
    prev = cur;
  }
  return { rise, set };
  function refine(a, b) {
    const up = sunPosition(a, lat, lon).el - alt < 0;
    for (let i = 0; i < 12; i++) {
      const m = (a + b) / 2;
      const below = sunPosition(m, lat, lon).el - alt < 0;
      if (below === up) a = m; else b = m;
    }
    return (a + b) / 2;
  }
}

/* Coarse phase of the sky, used for photo choice and room lighting. */
function skyPhase(t, lat, lon) {
  const { el, az } = sunPosition(t, lat, lon);
  const morning = az < 180;
  if (el < -7) return { phase: 'night', el, az };
  if (el < -0.5) return { phase: morning ? 'dawn' : 'dusk', el, az };
  if (el < 8) return { phase: morning ? 'sunrise' : 'sunset', el, az };
  return { phase: 'day', el, az };
}

/* 0 (full night) .. 1 (full daylight) ambient level, smooth through twilight. */
function daylightLevel(el) {
  return smoothstep(-8, 10, el);
}

/* Month 1..12 in the plant's growing hemisphere (southern hemisphere shifted by 6). */
function hemiMonth(t, lat) {
  const m = new Date(t).getMonth() + 1;
  return lat < 0 ? ((m + 5) % 12) + 1 : m;
}

function seasonOf(t, lat) {
  const m = hemiMonth(t, lat);
  if (m === 12 || m <= 2) return 'winter';
  if (m <= 5) return 'spring';
  if (m <= 8) return 'summer';
  return 'autumn';
}
