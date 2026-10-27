// Pantallas de inicio: eclosión del huevo (máximo 3 toques) y nombre de la mascota.
const Intro = {
  active: false, c: null, g: null, t: 0, stage: 'egg', stageT: 0, raf: null, last: 0,
  show() {
    const s = Store.s;
    this.active = true;
    $('intro').hidden = false;
    this.c = $('introCanvas'); this.g = this.c.getContext('2d'); this.g.imageSmoothingEnabled = false;
    this.stage = s.phase === 'naming' ? 'name' : 'egg';
    this.c.onpointerdown = () => this.tapEgg();
    $('eggLabel').onclick = () => this.tapEgg();
    $('btnDice').onclick = () => { Sound.play('tap'); $('nameInput').value = PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)]; $('nameError').textContent = ''; };
    $('btnName').onclick = () => this.confirmName();
    $('nameInput').onkeydown = e => { if (e.key === 'Enter') this.confirmName(); };
    this.applyStage();
    UI.updateChip();
    this.last = performance.now();
    const loop = ts => { const dt = Math.max(0, Math.min(0.05, (ts - this.last) / 1000 || 0)); this.last = ts; this.t += dt; this.stageT += dt; this.update(); this.draw(); if (this.active) this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  },
  hide() { this.active = false; cancelAnimationFrame(this.raf); $('intro').hidden = true; },
  applyStage() {
    const naming = this.stage === 'name';
    $('eggLabel').hidden = this.stage !== 'egg';
    $('namePanel').hidden = !naming;
    if (naming) {
      const inp = $('nameInput');
      if (!inp.value) inp.value = Store.s.pet.name || '';
      setTimeout(() => inp.focus({ preventScroll: true }), 50);
    }
  },
  tapEgg() {
    if (this.stage !== 'egg') return;
    Sound.unlock();
    const s = Store.s;
    s.hatchTaps = Math.min(3, s.hatchTaps + 1);
    Store.save();                                  // el progreso se conserva aunque se cierre la app
    this.c.classList.remove('wobble'); void this.c.offsetWidth; this.c.classList.add('wobble');
    Sound.play('crack');
    if (s.hatchTaps >= 3) { this.stage = 'burst'; this.stageT = 0; $('eggLabel').hidden = true; Sound.play('hatch'); }
  },
  update() {
    if (this.stage === 'burst' && this.stageT > 0.7) { this.stage = 'born'; this.stageT = 0; }
    if (this.stage === 'born' && this.stageT > 1.3) {
      const s = Store.s;
      s.phase = 'naming'; s.pet.stage = 'nino'; Store.save();
      this.stage = 'name'; this.stageT = 0; this.applyStage();
    }
  },
  draw() {
    const g = this.g, W = 96, H = 140, s = Store.s, sp = SPECIES[s.pet.species];
    PX.rect(g, 0, 0, W, 80, C.pinkXL);
    for (let x = 4; x < W; x += 8) PX.rect(g, x, 0, 1, 80, C.pinkL);
    PX.rect(g, 0, 80, W, H - 80, C.woodL);
    for (let y = 86; y < H; y += 6) PX.rect(g, 0, y, W, 1, C.wood);
    PX.rect(g, 0, 79, W, 2, C.ink3);
    if (this.stage === 'egg') {
      const bob = Math.round(Math.sin(this.t * 2) * 1);
      drawEgg(g, 48, 74 + bob, sp, s.hatchTaps, this.t);
    } else if (this.stage === 'burst') {
      const k = 1 + this.stageT * 0.6;
      const pts = [];
      for (let i = 0; i < 20; i++) { const r = (i % 2 ? 11 : 26) * k, a = i / 20 * Math.PI * 2 + 0.2; pts.push([48 + Math.cos(a) * r, 72 + Math.sin(a) * r]); }
      PX.layer(g, l => PX.poly(l, pts, C.white));
      PX.disc(g, 48, 72, 9 * k, C.yellowL);
    } else {
      const y = this.stage === 'born' ? 70 - Math.round(Math.min(1, this.stageT * 3) * 6) : 40;
      if (this.stage === 'born') {
        drawPet(g, 42, y - 4, { species: s.pet.species, stage: 'nino', t: this.t, expr: 'wow', scale: 1.5 });
        PX.layer(g, l => PX.poly(l, [[33, 80], [36, 74], [40, 79], [44, 73], [48, 79], [52, 73], [56, 79], [60, 74], [63, 80], [60, 90], [36, 90]], sp.egg));
        if (this.stageT < 0.6) for (let i = 0; i < 5; i++) g.drawImage(Sprites.canvas('sparkle'), 30 + i * 9, 50 + (i % 2) * 8);
      } else drawPet(g, 40, y, { species: s.pet.species, stage: 'nino', t: this.t, scale: 1.5, expr: Math.floor(this.t * 2) % 5 ? 'happy' : 'blink' });
    }
  },
  confirmName() {
    const name = $('nameInput').value.trim().replace(/\s+/g, ' ');
    if (!name) { $('nameError').textContent = 'Escribe un nombre para tu mascota.'; Sound.play('error'); return; }
    if (name.length > 12) { $('nameError').textContent = 'Usa como máximo 12 caracteres.'; return; }
    const s = Store.s;
    s.pet.name = name; s.phase = 'alive'; s.pet.stage = 'nino'; s.lastTick = Date.now();
    // recién nacida: aunque sea de noche, deja jugar un rato antes de dormirse
    s.pet.asleep = false; s.pet.wokenUntil = Date.now() + 30 * 60 * 1000;
    Store.commit();
    Sound.play('love');
    this.hide();
    UI.showRoom('sala');
    UI.toast(`¡Bienvenido a casa, ${name}!`);
  },
};
