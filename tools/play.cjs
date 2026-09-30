// Scripted play-through: onboarding, tools, panels. Screens go to shots/play-*.png
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path');
const OUT = path.join(__dirname, '..', 'shots');
const URL = process.env.URL || 'http://127.0.0.1:8765/preview.html#debug';

(async () => {
  const mobile = process.argv.includes('--mobile');
  const browser = await chromium.launch();
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/New_York' }
    : { viewport: { width: 1440, height: 900 }, timezoneId: 'America/New_York' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_CERT|fonts/.test(m.text())) errors.push(`console: ${m.text()}`); });
  await page.addInitScript(() => { try { localStorage.clear(); } catch {} });
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, `play-${n}${mobile ? '-m' : ''}.png`) }); console.log('shot', n); };
  const tap = async (sel) => { if (mobile) await page.tap(sel, { force: true }); else await page.click(sel, { force: true }); };

  await page.goto(URL);
  await page.waitForTimeout(1500);
  await tap('.species-card[data-id="bunny"]');
  await page.waitForTimeout(200);
  await tap('.wel-foot .btn.primary');
  await page.waitForTimeout(400);
  await page.fill('#nameInput', 'Pickle');
  await page.fill('#placeInput', 'Mineola, NY');
  await shot('01-naming');
  await tap('.naming .btn.primary');
  await page.waitForTimeout(2200);
  await shot('02-planted');

  const moist0 = await page.evaluate(() => window.__cactus.Game.S.plant.moisture);
  await tap('#tool-water');
  await page.waitForTimeout(700);
  await shot('03-watering');
  await page.waitForTimeout(1600);
  const moist1 = await page.evaluate(() => window.__cactus.Game.S.plant.moisture);
  console.log('moisture', moist0.toFixed(1), '->', moist1.toFixed(1));
  await shot('04-watered');

  // Drag the moisture meter onto the plant
  const tb = await page.locator('#tool-meter').boundingBox();
  const pr = await page.evaluate(() => window.__cactus.Scene.plantRect());
  if (!mobile) {
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
    await page.mouse.down();
    await page.mouse.move(tb.x + 60, tb.y - 60, { steps: 6 });
    await page.mouse.move(pr.x + pr.w / 2, pr.y + pr.h / 2, { steps: 12 });
    await shot('05-dragging');
    await page.mouse.up();
  } else await tap('#tool-meter');
  await page.waitForTimeout(1400);
  await shot('06-meter');

  await page.keyboard.press('o');
  await page.waitForTimeout(900);
  await shot('07-window-open');
  await page.keyboard.press('o');
  await page.keyboard.press('u');
  await page.waitForTimeout(1200);
  await shot('08-curtain');
  await page.keyboard.press('u');
  await tap('#tool-lamp');
  await page.waitForTimeout(800);
  await shot('09-lamp');
  await tap('#tool-lamp');

  await tap('#btnJournal');
  await page.waitForTimeout(600);
  await shot('10-journal');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await tap('#weatherChip');
  await page.waitForTimeout(600);
  await shot('11-weather');
  await page.click('.preview-row .mini-btn >> nth=3');
  await page.waitForTimeout(3500);
  await shot('12-preview-storm');
  await page.evaluate(() => window.__cactus.Game.startPreview('rain', 'night'));
  await page.waitForTimeout(3500);
  await shot('13-preview-rain-night');
  await page.evaluate(() => window.__cactus.Game.startPreview('snow', 'dusk'));
  await page.waitForTimeout(3200);
  await shot('14-preview-snow-dusk');
  await page.evaluate(() => window.__cactus.Game.stopPreview());

  await tap('#btnSettings');
  await page.waitForTimeout(500);
  await shot('15-settings');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await tap('#tool-repot');
  await page.waitForTimeout(500);
  await shot('16-repot');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await tap('#plant .plant-g');
  await page.waitForTimeout(400);
  await shot('17-poke');

  const st = await page.evaluate(() => ({ ach: Object.keys(window.__cactus.Game.S.ach), saved: !!localStorage.getItem('windowsill-cactus-v1'), mode: window.__cactus.Game.S.wx.mode, live: window.__cactus.Live.state }));
  console.log(JSON.stringify(st));
  console.log(errors.length ? errors.join('\n') : 'no errors');
  await browser.close();
})();
