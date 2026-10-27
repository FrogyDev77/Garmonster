// Audio: efectos y música chiptune generados con Web Audio (sin archivos externos).
// Para usar archivos propios más adelante: Sound.register('comer', 'audio/comer.ogg').
const Sound = {
  ctx: null, sfxBus: null, musicBus: null, files: {}, _seq: null, _step: 0,
  // Solo se activa tras el primer toque del jugador (requisito de los navegadores).
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const master = this.ctx.createGain(); master.gain.value = 0.22; master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.connect(master);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.45; this.musicBus.connect(master);
    if (Store.s.settings.music) this.startMusic();
  },
  register(name, url) { const a = new Audio(url); a.preload = 'auto'; this.files[name] = a; },
  tone(freq, dur, { type = 'square', vol = 0.5, when = 0, slide = 0, bus = null } = {}) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(bus || this.sfxBus); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol = 0.3, when = 0) {
    const c = this.ctx; if (!c) return;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = c.createBufferSource(), g = c.createGain(); src.buffer = buf; g.gain.value = vol;
    src.connect(g); g.connect(this.sfxBus); src.start(c.currentTime + when);
  },
  play(name) {
    if (!this.ctx || !Store.s.settings.sfx) return;
    if (this.files[name]) { const a = this.files[name].cloneNode(); a.play().catch(() => {}); return; }
    const T = (f, d, o) => this.tone(f, d, o);
    const fx = {
      tap: () => T(880, 0.05, { vol: 0.25 }),
      ui: () => T(660, 0.06, { vol: 0.3, type: 'triangle' }),
      crack: () => { this.noise(0.12, 0.4); T(220, 0.1, { slide: -80 }); },
      hatch: () => [523, 659, 784, 1047].forEach((f, i) => T(f, 0.14, { when: i * 0.09 })),
      love: () => { T(784, 0.08, { type: 'triangle' }); T(1047, 0.12, { type: 'triangle', when: 0.08 }); },
      kick: () => T(300, 0.08, { slide: 200, type: 'triangle' }),
      eat: () => [0, 0.35, 0.7, 1.05].forEach(w => this.noise(0.07, 0.25, w)),
      water: () => { for (let i = 0; i < 10; i++) this.noise(0.15, 0.12, i * 0.22); },
      flush: () => { this.noise(0.8, 0.3); T(400, 0.6, { slide: -300, type: 'sine', vol: 0.3 }); },
      squeak: () => T(1200, 0.12, { slide: 500, type: 'square', vol: 0.25 }),
      sleep: () => [392, 330, 262].forEach((f, i) => T(f, 0.25, { when: i * 0.22, type: 'triangle' })),
      wake: () => [262, 330, 392].forEach((f, i) => T(f, 0.15, { when: i * 0.12, type: 'triangle' })),
      coin: () => { T(988, 0.07); T(1319, 0.18, { when: 0.07 }); },
      buy: () => [659, 880, 1175].forEach((f, i) => T(f, 0.1, { when: i * 0.07 })),
      error: () => T(160, 0.22, { type: 'sawtooth', vol: 0.3 }),
      shoot: () => T(1400, 0.07, { slide: -900, vol: 0.18 }),
      boom: () => { this.noise(0.3, 0.45); T(120, 0.3, { slide: -80 }); },
      hurt: () => { this.noise(0.4, 0.5); T(300, 0.4, { slide: -250, type: 'sawtooth' }); },
      line: () => [523, 784, 1047].forEach((f, i) => T(f, 0.08, { when: i * 0.05 })),
      move: () => T(500, 0.03, { vol: 0.12 }),
      rotate: () => T(700, 0.04, { vol: 0.15, type: 'triangle' }),
      land: () => T(180, 0.06, { vol: 0.3 }),
      scrub: () => this.noise(0.05, 0.12),
      win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => T(f, 0.12, { when: i * 0.1 })),
      lose: () => [392, 330, 262, 196].forEach((f, i) => T(f, 0.18, { when: i * 0.15, type: 'triangle' })),
      evolve: () => [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => T(f, 0.12, { when: i * 0.08 })),
    };
    (fx[name] || fx.tap)();
  },
  // ---------- Música ----------
  TRACKS: {
    1: { tempo: 0.16, lead: [72, 0, 76, 0, 79, 0, 76, 74, 72, 0, 74, 76, 74, 0, 67, 0, 69, 0, 72, 0, 76, 0, 74, 72, 71, 0, 72, 74, 72, 0, 0, 0],
         bass: [48, 0, 0, 0, 55, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 0, 45, 0, 0, 0, 52, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 0] },
    2: { tempo: 0.13, lead: [76, 79, 81, 0, 79, 76, 74, 0, 72, 74, 76, 0, 79, 0, 76, 0, 77, 76, 74, 0, 72, 71, 72, 0, 74, 0, 79, 0, 72, 0, 0, 0],
         bass: [45, 0, 57, 0, 45, 0, 57, 0, 41, 0, 53, 0, 41, 0, 53, 0, 43, 0, 55, 0, 43, 0, 55, 0, 48, 0, 60, 0, 48, 0, 60, 0] },
  },
  startMusic() {
    if (!this.ctx) return;
    this.stopMusic();
    const tr = this.TRACKS[Store.s.settings.track] || this.TRACKS[1];
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    this._step = 0;
    this._seq = setInterval(() => {
      const i = this._step++ % tr.lead.length;
      if (tr.lead[i]) this.tone(hz(tr.lead[i]), tr.tempo * 0.9, { vol: 0.16, bus: this.musicBus });
      if (tr.bass[i]) this.tone(hz(tr.bass[i]), tr.tempo * 1.8, { vol: 0.22, type: 'triangle', bus: this.musicBus });
    }, tr.tempo * 1000);
  },
  stopMusic() { clearInterval(this._seq); this._seq = null; },
};
