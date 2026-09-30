/* The realistic room: wall, trim, jambs, wood sill, and the double-hung window.
   Static layers are painted to canvases on resize; lighting is applied with CSS. */

const Room = {
  L: null, // layout
  dpr: 1,
  wallBase: '#D3C3AE',
  woodTex: null,
  noise: makeNoise(7),
  noise2: makeNoise(19),

  layout(W, H) {
    const portrait = H > W * 1.05;
    let ow, oh, oy;
    if (portrait) {
      ow = W * 0.86;
      oy = Math.max(56, H * 0.1);
      oh = H * 0.5;
    } else {
      ow = Math.min(W * 0.64, H * 1.2);
      oy = H * 0.07;
      oh = H * 0.6;
    }
    const ox = (W - ow) / 2;
    const cw = clamp(ow * 0.058, 13, 44);
    const vp = { x: W / 2, y: oy + oh * 0.3 };
    const Yb = oy + oh;
    const stoolBand = clamp(H * 0.11, 58, 120);
    const fj = 1 - (stoolBand * 0.42) / (Yb - vp.y);
    const fn = 1 + (stoolBand * 0.58) / (Yb - vp.y);
    const P = (x, y, f) => ({ x: vp.x + (x - vp.x) * f, y: vp.y + (y - vp.y) * f });
    const i0 = P(ox, oy, fj), i1 = P(ox + ow, Yb, fj);
    const inner = { x: i0.x, y: i0.y, w: i1.x - i0.x, h: i1.y - i0.y };
    const horn = cw * 0.55;
    const outerL = ox - cw, outerR = ox + ow + cw;
    const fl = P(outerL - horn, Yb, fn), fr = P(outerR + horn, Yb, fn);
    const noseH = clamp(H * 0.02, 9, 20);
    const stool = {
      backY: inner.y + inner.h, frontY: fl.y, wallY: Yb,
      backL: inner.x, backR: inner.x + inner.w,
      wallL: outerL - horn, wallR: outerR + horn,
      frontL: fl.x, frontR: fr.x, noseH,
      fj, fn,
    };
    const apron = { x: outerL, y: stool.frontY + noseH, w: outerR - outerL, h: cw * 1.25 };
    const potY = lerp(stool.backY, stool.frontY, 0.56);
    const unit = clamp(ow / 780, 0.55, 1.3) * (portrait ? 1.15 : 1);
    return { W, H, portrait, ox, oy, ow, oh, cw, vp, Yb, inner, stool, apron, potX: W / 2, potY, unit, P, fj, fn };
  },

  woodTexture() {
    if (this.woodTex) return this.woodTex;
    const w = 2048, h = 220;
    const c = makeCanvas(w, h), g = c.getContext('2d');
    const img = g.createImageData(w, h);
    const n = this.noise, n2 = this.noise2;
    const dark = [112, 68, 34], light = [214, 162, 104];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const warp = fbm(n, x * 0.0016, y * 0.02, 4) * 70 + Math.sin(x * 0.0012 + y * 0.013) * 8;
        const ring = Math.pow(0.5 + 0.5 * Math.sin((y + warp) * 0.55), 4);
        const fiber = n2(x * 0.03, y * 2.2) * 0.5 + 0.5;
        const figure = fbm(n2, x * 0.0007, y * 0.006, 3) * 0.5 + 0.5;
        const t = clamp(0.22 + ring * 0.5 + (fiber - 0.5) * 0.34, 0, 1);
        let k = 0.9 + figure * 0.2;
        if (n(x * 0.8, y * 4.1) > 0.55) k *= 0.82; // open pores
        const i = (y * w + x) * 4;
        img.data[i] = lerp(light[0], dark[0], t) * k;
        img.data[i + 1] = lerp(light[1], dark[1], t) * k;
        img.data[i + 2] = lerp(light[2], dark[2], t) * k;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    this.woodTex = c;
    return c;
  },

  /* Paint colour for trim at profile position t (0 = wall side, 1 = opening side). */
  trimShade(t, bias = 0) {
    let v;
    if (t < 0.05) v = 0.7;
    else if (t < 0.3) { const u = (t - 0.05) / 0.25; v = 0.86 + Math.sin(u * Math.PI) * 0.12 - u * 0.03; }
    else if (t < 0.34) v = 0.8;
    else if (t < 0.9) v = 0.95 - (t - 0.34) * 0.05;
    else if (t < 0.94) v = 1.0;
    else v = 0.78;
    v = clamp(v + bias, 0, 1.05);
    const W = [246, 243, 236];
    return `rgb(${Math.round(W[0] * v)},${Math.round(W[1] * v)},${Math.round(W[2] * v)})`;
  },

  paint(canvas, L, wallColor) {
    const dpr = this.dpr;
    const g = canvas.getContext('2d');
    canvas.width = Math.round(L.W * dpr);
    canvas.height = Math.round(L.H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.paintWall(g, L, wallColor);
    this.paintCasing(g, L);
    this.paintJambs(g, L);
    this.paintStool(g, L);
    // The sash plane is drawn on the window canvas underneath.
    g.clearRect(L.inner.x, L.inner.y, L.inner.w, L.inner.h);
  },

  paintWall(g, L, base) {
    const { W, H } = L;
    g.fillStyle = base;
    g.fillRect(0, 0, W, H);
    // Plaster texture: soft blotches plus fine grain, baked at low resolution then scaled.
    const tw = Math.ceil(W / 3), th = Math.ceil(H / 3);
    const t = makeCanvas(tw, th), tg = t.getContext('2d');
    const img = tg.createImageData(tw, th);
    const n = this.noise, n2 = this.noise2;
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const big = fbm(n, x * 0.012, y * 0.012, 3);
        const fine = n2(x * 0.9, y * 0.9);
        const v = big * 0.55 + fine * 0.35;
        const i = (y * tw + x) * 4;
        const c = v > 0 ? 255 : 0;
        img.data[i] = c; img.data[i + 1] = c; img.data[i + 2] = c;
        img.data[i + 3] = Math.min(255, Math.abs(v) * 70);
      }
    }
    tg.putImageData(img, 0, 0);
    g.save();
    g.globalAlpha = 0.5;
    g.imageSmoothingEnabled = true;
    g.drawImage(t, 0, 0, W, H);
    g.restore();
    // Light falloff away from the window, and a darker floor-ward gradient.
    const cx = L.W / 2, cy = L.oy + L.oh * 0.45;
    const rg = g.createRadialGradient(cx, cy, L.ow * 0.35, cx, cy, Math.max(W, H) * 0.85);
    rg.addColorStop(0, 'rgba(255,248,235,0.18)');
    rg.addColorStop(0.55, 'rgba(0,0,0,0)');
    rg.addColorStop(1, 'rgba(20,15,10,0.35)');
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
    const lg = g.createLinearGradient(0, L.stool.frontY, 0, H);
    lg.addColorStop(0, 'rgba(0,0,0,0)');
    lg.addColorStop(1, 'rgba(20,12,6,0.28)');
    g.fillStyle = lg;
    g.fillRect(0, L.stool.frontY, W, H - L.stool.frontY);
  },

  paintCasing(g, L) {
    const { ox, oy, ow, Yb, cw, dpr } = { ...L, dpr: this.dpr };
    const x0 = ox - cw, y0 = oy - cw, x1 = ox + ow + cw;
    // Soft shadow of the trim on the wall.
    g.save();
    g.shadowColor = 'rgba(40,28,15,0.32)';
    g.shadowBlur = cw * 0.55;
    g.shadowOffsetY = cw * 0.12;
    g.fillStyle = '#e9e4d9';
    g.beginPath();
    g.rect(x0, y0, x1 - x0, Yb - y0);
    g.rect(ox, oy, ow, Yb - oy);
    g.fill('evenodd');
    g.restore();
    // Nested strokes give the moulded profile with mitred corners for free.
    const steps = Math.max(8, Math.round(cw * this.dpr));
    const lw = cw / steps;
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const inset = lw * (i + 0.5);
      g.strokeStyle = this.trimShade(t);
      g.lineWidth = lw + 0.6 / this.dpr;
      g.beginPath();
      g.moveTo(x0 + inset, Yb);
      g.lineTo(x0 + inset, y0 + inset);
      g.lineTo(x1 - inset, y0 + inset);
      g.lineTo(x1 - inset, Yb);
      g.stroke();
    }
    // Mitre joints
    g.strokeStyle = 'rgba(120,110,95,0.28)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x0, y0); g.lineTo(ox, oy);
    g.moveTo(x1, y0); g.lineTo(ox + ow, oy);
    g.stroke();
    // Faint top light on the head casing, darker legs lower down.
    const lg = g.createLinearGradient(0, y0, 0, Yb);
    lg.addColorStop(0, 'rgba(255,255,255,0.05)');
    lg.addColorStop(1, 'rgba(60,45,30,0.10)');
    g.fillStyle = lg;
    g.beginPath();
    g.rect(x0, y0, x1 - x0, Yb - y0);
    g.rect(ox, oy, ow, Yb - oy);
    g.fill('evenodd');
    void dpr;
  },

  paintJambs(g, L) {
    const { ox, oy, ow, Yb, inner } = L;
    const ix0 = inner.x, iy0 = inner.y, ix1 = inner.x + inner.w, iy1 = inner.y + inner.h;
    const quad = (pts, fill) => {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
      g.closePath();
      g.fillStyle = fill;
      g.fill();
    };
    // Head jamb (underside, in shade)
    let gr = g.createLinearGradient(0, oy, 0, iy0);
    gr.addColorStop(0, '#c9c2b4'); gr.addColorStop(1, '#ded8cb');
    quad([[ox, oy], [ox + ow, oy], [ix1, iy0], [ix0, iy0]], gr);
    // Side jambs: lit by the window, brighter near the glass
    gr = g.createLinearGradient(ox, 0, ix0, 0);
    gr.addColorStop(0, '#e3ddd0'); gr.addColorStop(1, '#f7f4ec');
    quad([[ox, oy], [ix0, iy0], [ix0, iy1], [ox, Yb]], gr);
    gr = g.createLinearGradient(ox + ow, 0, ix1, 0);
    gr.addColorStop(0, '#ddd6c8'); gr.addColorStop(1, '#f2eee5');
    quad([[ox + ow, oy], [ix1, iy0], [ix1, iy1], [ox + ow, Yb]], gr);
    // Ambient occlusion in the jamb corners
    g.save();
    g.globalCompositeOperation = 'multiply';
    const ao = (x, y, r) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(120,105,85,0.45)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    };
    ao(ix0, iy0, L.cw * 1.4); ao(ix1, iy0, L.cw * 1.4);
    g.restore();
    // Stop beads where the sashes run
    g.strokeStyle = 'rgba(255,255,255,0.8)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(ix0 - 1.5, iy0); g.lineTo(ix0 - 1.5, iy1);
    g.moveTo(ix1 + 1.5, iy0); g.lineTo(ix1 + 1.5, iy1);
    g.stroke();
    g.strokeStyle = 'rgba(90,80,65,0.35)';
    g.beginPath();
    g.moveTo(ix0 - 0.5, iy0); g.lineTo(ix0 - 0.5, iy1);
    g.moveTo(ix1 + 0.5, iy0); g.lineTo(ix1 + 0.5, iy1);
    g.moveTo(ix0, iy0 + 0.5); g.lineTo(ix1, iy0 + 0.5);
    g.stroke();
  },

  paintStool(g, L) {
    const S = L.stool, vp = L.vp;
    const tex = this.woodTexture();
    const Dy = L.Yb - vp.y;
    const rows = Math.ceil((S.frontY - S.backY) * this.dpr);
    const texScale = tex.width / (L.W * 1.25);
    // Outline of the stool top: jamb-width part behind the wall plane, full width in front.
    const leftAt = (y) => (y < S.wallY ? lerp(S.backL, L.ox, invLerp(S.backY, S.wallY, y)) : lerp(S.wallL, S.frontL, invLerp(S.wallY, S.frontY, y)));
    const rightAt = (y) => (y < S.wallY ? lerp(S.backR, L.ox + L.ow, invLerp(S.backY, S.wallY, y)) : lerp(S.wallR, S.frontR, invLerp(S.wallY, S.frontY, y)));
    g.save();
    g.imageSmoothingEnabled = true;
    for (let r = 0; r < rows; r++) {
      const y = S.backY + r / this.dpr;
      const f = (y - vp.y) / Dy; // perspective factor at this row
      const depth = (1 / f - 1) * 6; // world depth, arbitrary units
      const xl = leftAt(y), xr = rightAt(y);
      const wl = vp.x + (xl - vp.x) / f, wr = vp.x + (xr - vp.x) / f;
      const sx = clamp((wl - (L.W / 2 - L.W * 0.62)) * texScale, 0, tex.width - 2);
      const sw = clamp((wr - wl) * texScale, 1, tex.width - sx);
      const sy = clamp(110 + depth * 70, 0, tex.height - 1);
      g.drawImage(tex, sx, sy, sw, 1, xl, y, xr - xl, 1 / this.dpr + 0.35);
    }
    g.restore();
    // Glossy reflection of the bright window near the back, and shading towards the front.
    const clip = new Path2D();
    clip.moveTo(S.backL, S.backY); clip.lineTo(S.backR, S.backY); clip.lineTo(L.ox + L.ow, S.wallY);
    clip.lineTo(S.wallR, S.wallY); clip.lineTo(S.frontR, S.frontY); clip.lineTo(S.frontL, S.frontY);
    clip.lineTo(S.wallL, S.wallY); clip.lineTo(L.ox, S.wallY); clip.closePath();
    g.save();
    g.clip(clip);
    let gr = g.createLinearGradient(0, S.backY, 0, S.frontY);
    gr.addColorStop(0, 'rgba(255,250,240,0.42)');
    gr.addColorStop(0.35, 'rgba(255,248,235,0.12)');
    gr.addColorStop(1, 'rgba(30,15,5,0.18)');
    g.fillStyle = gr;
    g.fillRect(S.wallL - 10, S.backY, S.frontR - S.wallL + 20, S.frontY - S.backY);
    // Contact shadow along the back where the sash sits.
    gr = g.createLinearGradient(0, S.backY, 0, S.backY + 10);
    gr.addColorStop(0, 'rgba(40,25,10,0.45)');
    gr.addColorStop(1, 'rgba(40,25,10,0)');
    g.fillStyle = gr;
    g.fillRect(S.backL, S.backY, S.backR - S.backL, 10);
    // Casing legs cast a little shade on the horns.
    for (const x of [L.ox - L.cw, L.ox + L.ow]) {
      gr = g.createLinearGradient(0, S.wallY, 0, S.wallY + 8);
      gr.addColorStop(0, 'rgba(40,25,10,0.35)');
      gr.addColorStop(1, 'rgba(40,25,10,0)');
      g.fillStyle = gr;
      g.fillRect(x, S.wallY, L.cw, 8);
    }
    g.restore();
    // Front edge (bullnose) and front face
    const nose = S.noseH;
    gr = g.createLinearGradient(0, S.frontY, 0, S.frontY + nose);
    gr.addColorStop(0, 'rgb(214,170,120)');
    gr.addColorStop(0.18, 'rgb(170,112,62)');
    gr.addColorStop(0.7, 'rgb(128,80,40)');
    gr.addColorStop(1, 'rgb(96,58,28)');
    g.fillStyle = gr;
    g.beginPath();
    g.roundRect(S.frontL, S.frontY - 1, S.frontR - S.frontL, nose + 1, [0, 0, nose * 0.35, nose * 0.35]);
    g.fill();
    g.save();
    g.globalAlpha = 0.35;
    g.globalCompositeOperation = 'multiply';
    g.drawImage(tex, 0, 60, tex.width, 30, S.frontL, S.frontY, S.frontR - S.frontL, nose);
    g.restore();
    g.fillStyle = 'rgba(255,235,205,0.55)';
    g.fillRect(S.frontL + 2, S.frontY - 0.5, S.frontR - S.frontL - 4, 1.2);
    // Apron below, then the shadow the nosing throws onto it.
    const A = L.apron;
    const steps = Math.max(8, Math.round(A.h * this.dpr * 0.6));
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      g.fillStyle = this.trimShade(1 - t, -0.04);
      g.fillRect(A.x, A.y + (A.h * i) / steps, A.w, A.h / steps + 0.7);
    }
    gr = g.createLinearGradient(0, A.y, 0, A.y + A.h * 1.6);
    gr.addColorStop(0, 'rgba(35,22,10,0.55)');
    gr.addColorStop(0.35, 'rgba(35,22,10,0.18)');
    gr.addColorStop(1, 'rgba(35,22,10,0)');
    g.fillStyle = gr;
    g.fillRect(S.frontL - 12, A.y, S.frontR - S.frontL + 24, A.h * 1.6);
  },

  /* The window itself: upper sash fixed, lower sash raised by `open` (0..1). */
  paintWindow(canvas, L, env) {
    const dpr = this.dpr;
    canvas.width = Math.round(L.W * dpr);
    canvas.height = Math.round(L.H * dpr);
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const I = L.inner;
    const stile = clamp(I.w * 0.055, 8, 34);
    const top = clamp(I.h * 0.05, 8, 30);
    const meet = clamp(I.h * 0.035, 6, 22);
    const bottom = clamp(I.h * 0.07, 10, 40);
    const half = I.h / 2;
    const lift = (env.windowOpen || 0) * (half - bottom * 0.6);
    const geo = { stile, top, meet, bottom, half, lift };
    this.geo = geo;
    // Upper (outer) sash: sits slightly further out, so a touch smaller and shadowed.
    const U = { x: I.x, y: I.y, w: I.w, h: half + meet * 0.5 };
    this.paintSash(g, U, { top, bottom: meet, stile, muntins: 2, outer: true, dirt: env.glassDirt });
    // Screen in the lower half, visible only when the lower sash is raised.
    if (lift > 1) {
      const sy = I.y + half + meet * 0.5 - 2, sh = I.y + I.h - sy;
      g.save();
      g.beginPath();
      g.rect(I.x + 2, I.y + I.h - lift, I.w - 4, lift);
      g.clip();
      g.fillStyle = 'rgba(60,64,66,0.18)';
      g.fillRect(I.x, sy, I.w, sh);
      g.strokeStyle = 'rgba(40,44,46,0.18)';
      g.lineWidth = 0.6;
      g.beginPath();
      for (let x = I.x; x < I.x + I.w; x += 2.2) { g.moveTo(x, sy); g.lineTo(x, sy + sh); }
      for (let y = sy; y < sy + sh; y += 2.2) { g.moveTo(I.x, y); g.lineTo(I.x + I.w, y); }
      g.stroke();
      g.fillStyle = '#8d918f';
      g.fillRect(I.x + 2, I.y + I.h - 5, I.w - 4, 4);
      g.restore();
    }
    // Lower (inner) sash
    const B = { x: I.x, y: I.y + half - meet * 0.5 - lift, w: I.w, h: half + meet * 0.5 };
    // Shadow the lower sash casts on the upper one when raised
    if (lift > 1) {
      g.save();
      g.shadowColor = 'rgba(0,0,0,0.25)';
      g.shadowBlur = 10;
      g.shadowOffsetY = -2;
      g.fillStyle = 'rgba(0,0,0,0.01)';
      g.fillRect(B.x, B.y, B.w, 6);
      g.restore();
    }
    this.paintSash(g, B, { top: meet, bottom, stile, muntins: 0, outer: false, dirt: env.glassDirt, lock: true, lifts: true });
    return geo;
  },

  paintSash(g, R, o) {
    const { x, y, w, h } = R;
    // Glass: faint tint, dirt, and a soft diagonal reflection
    const gx = x + o.stile, gy = y + o.top, gw = w - o.stile * 2, gh = h - o.top - o.bottom;
    g.save();
    g.beginPath();
    g.rect(gx, gy, gw, gh);
    g.clip();
    g.fillStyle = o.outer ? 'rgba(170,200,205,0.10)' : 'rgba(170,200,205,0.07)';
    g.fillRect(gx, gy, gw, gh);
    const refl = g.createLinearGradient(gx, gy, gx + gw, gy + gh);
    refl.addColorStop(0, 'rgba(255,255,255,0)');
    refl.addColorStop(0.38, 'rgba(255,255,255,0)');
    refl.addColorStop(0.45, 'rgba(255,255,255,0.10)');
    refl.addColorStop(0.5, 'rgba(255,255,255,0.03)');
    refl.addColorStop(0.58, 'rgba(255,255,255,0.08)');
    refl.addColorStop(0.64, 'rgba(255,255,255,0)');
    g.fillStyle = refl;
    g.fillRect(gx, gy, gw, gh);
    const dirt = clamp(o.dirt || 0, 0, 100) / 100;
    if (dirt > 0.02) {
      const r = mulberry32(o.outer ? 11 : 23);
      for (let i = 0; i < 70; i++) {
        const px = gx + r() * gw, py = gy + r() * gh, rad = 6 + r() * 40;
        const rg = g.createRadialGradient(px, py, 0, px, py, rad);
        rg.addColorStop(0, `rgba(235,230,215,${0.09 * dirt})`);
        rg.addColorStop(1, 'rgba(235,230,215,0)');
        g.fillStyle = rg;
        g.fillRect(px - rad, py - rad, rad * 2, rad * 2);
      }
      g.fillStyle = `rgba(200,195,180,${0.06 * dirt})`;
      for (let i = 0; i < 400; i++) g.fillRect(gx + r() * gw, gy + r() * gh, 1, 1);
    }
    g.restore();
    // Frame members
    const paint = (px, py, pw, ph, vertical) => {
      const gr = vertical ? g.createLinearGradient(px, 0, px + pw, 0) : g.createLinearGradient(0, py, 0, py + ph);
      gr.addColorStop(0, o.outer ? '#e4dfd4' : '#f3f0e8');
      gr.addColorStop(0.5, o.outer ? '#ece8de' : '#fbf9f4');
      gr.addColorStop(1, o.outer ? '#d8d2c5' : '#e7e2d7');
      g.fillStyle = gr;
      g.fillRect(px, py, pw, ph);
    };
    paint(x, y, o.stile, h, true);
    paint(x + w - o.stile, y, o.stile, h, true);
    paint(x, y, w, o.top, false);
    paint(x, y + h - o.bottom, w, o.bottom, false);
    // Sticking: highlight and shadow lines around the glass
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 1;
    g.strokeRect(gx - 1.5, gy - 1.5, gw + 3, gh + 3);
    g.strokeStyle = 'rgba(110,100,85,0.45)';
    g.strokeRect(gx - 0.5, gy - 0.5, gw + 1, gh + 1);
    g.strokeStyle = 'rgba(150,145,135,0.35)';
    g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    // Muntins (upper sash only)
    if (o.muntins) {
      const mw = clamp(w * 0.013, 3, 9);
      for (let k = 1; k <= o.muntins; k++) {
        const mx = gx + (gw * k) / (o.muntins + 1) - mw / 2;
        const gr = g.createLinearGradient(mx, 0, mx + mw, 0);
        gr.addColorStop(0, '#d9d3c6'); gr.addColorStop(0.45, '#f2eee6'); gr.addColorStop(1, '#cfc8ba');
        g.fillStyle = gr;
        g.fillRect(mx, gy, mw, gh);
      }
    }
    // Hardware
    if (o.lock) {
      const cx = x + w / 2, cy = y + o.top * 0.5;
      const bw = clamp(w * 0.07, 16, 44), bh = clamp(o.top * 0.62, 5, 14);
      const gr = g.createLinearGradient(0, cy - bh / 2, 0, cy + bh / 2);
      gr.addColorStop(0, '#f3d98f'); gr.addColorStop(0.5, '#c9a24a'); gr.addColorStop(1, '#8c6a24');
      g.fillStyle = gr;
      g.beginPath();
      g.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, bh * 0.4);
      g.fill();
      g.fillStyle = 'rgba(255,245,210,0.8)';
      g.fillRect(cx - bw / 2 + 2, cy - bh / 2 + 1, bw - 4, 1);
    }
    if (o.lifts) {
      for (const fx of [0.22, 0.78]) {
        const cx = x + w * fx, cy = y + h - o.bottom * 0.45;
        const lw = clamp(w * 0.05, 10, 30), lh = clamp(o.bottom * 0.32, 4, 11);
        const gr = g.createLinearGradient(0, cy - lh, 0, cy + lh);
        gr.addColorStop(0, '#f6de9a'); gr.addColorStop(1, '#8a6624');
        g.fillStyle = gr;
        g.beginPath();
        g.roundRect(cx - lw / 2, cy - lh / 2, lw, lh, [1, 1, lh / 2, lh / 2]);
        g.fill();
        g.fillStyle = 'rgba(40,30,10,0.25)';
        g.fillRect(cx - lw / 2 + 1, cy + lh / 2, lw - 2, 2);
      }
    }
  },

  /* Glass pane rectangles (for droplets and wiping). */
  panes(L) {
    const I = L.inner, G = this.geo;
    if (!G) return [];
    const { stile, top, meet, bottom, half, lift } = G;
    const up = { x: I.x + stile, y: I.y + top, w: I.w - stile * 2, h: half + meet * 0.5 - top - meet };
    const lowY = I.y + half - meet * 0.5 - lift;
    const low = { x: I.x + stile, y: lowY + meet, w: I.w - stile * 2, h: half + meet * 0.5 - meet - bottom };
    return [up, low];
  },
};
