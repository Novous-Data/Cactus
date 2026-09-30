/* Tiny WebAudio synth. Off by default; only starts after the player turns it on. */

const Audio2 = {
  ctx: null,
  on: false,
  noise: null,
  rain: null,

  enable(on) {
    this.on = !!on;
    if (this.on) this.ensure();
    else this.setRain(0);
  },

  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  },

  noiseBuf() {
    if (this.noise) return this.noise;
    const c = this.ctx, len = c.sampleRate * 2;
    const b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = b;
    return b;
  },

  tone(freq, t0, dur, type = 'sine', vol = 0.12, slideTo = null) {
    const c = this.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  },

  hiss(t0, dur, { type = 'bandpass', freq = 1200, q = 0.8, vol = 0.2, attack = 0.05, sweep = null } = {}) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf();
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t0);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t0 + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(c.destination);
    s.start(t0, Math.random());
    s.stop(t0 + dur + 0.05);
  },

  play(name) {
    if (!this.on) return;
    const c = this.ensure();
    if (!c) return;
    const t = c.currentTime + 0.01;
    switch (name) {
      case 'pour': this.hiss(t, 1.3, { freq: 900, q: 1.4, vol: 0.18, attack: 0.15 }); this.hiss(t + 0.1, 1.1, { freq: 2600, q: 2, vol: 0.05 }); break;
      case 'pick': this.tone(520, t, 0.08, 'triangle', 0.08, 700); break;
      case 'click': this.tone(880, t, 0.05, 'square', 0.04); break;
      case 'turn': this.hiss(t, 0.35, { type: 'highpass', freq: 1800, vol: 0.08, sweep: 600 }); this.tone(300, t, 0.2, 'triangle', 0.05, 220); break;
      case 'spritz': this.hiss(t, 0.18, { type: 'highpass', freq: 3500, vol: 0.12, attack: 0.01 }); break;
      case 'shine': [880, 1175, 1568].forEach((f, i) => this.tone(f, t + i * 0.08, 0.35, 'sine', 0.06)); break;
      case 'chime': [659, 784, 988, 1319].forEach((f, i) => this.tone(f, t + i * 0.09, 0.5, 'triangle', 0.07)); break;
      case 'pop': this.tone(660, t, 0.14, 'sine', 0.1, 330); break;
      case 'grow': [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.07, 0.45, 'triangle', 0.06)); break;
      case 'thunder': this.hiss(t, 3.2, { type: 'lowpass', freq: 160, q: 0.5, vol: 0.5, attack: 0.25, sweep: 60 }); break;
      default: break;
    }
  },

  /* Soft rain ambience, level 0..1 */
  setRain(level) {
    if (!this.on || !this.ctx) {
      if (this.rain) { try { this.rain.src.stop(); } catch { /* already stopped */ } this.rain = null; }
      return;
    }
    const c = this.ctx;
    if (level > 0 && !this.rain) {
      const src = c.createBufferSource();
      src.buffer = this.noiseBuf();
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.4;
      const g = c.createGain();
      g.gain.value = 0.0001;
      src.connect(f).connect(g).connect(c.destination);
      src.start();
      this.rain = { src, g };
    }
    if (this.rain) {
      this.rain.g.gain.setTargetAtTime(level > 0 ? 0.04 + level * 0.08 : 0.0001, c.currentTime, 0.8);
      if (level <= 0) {
        const r = this.rain;
        this.rain = null;
        setTimeout(() => { try { r.src.stop(); } catch { /* stopped */ } }, 3000);
      }
    }
  },
};
