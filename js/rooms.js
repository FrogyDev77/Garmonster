// Escenas de las habitaciones: dibujo pixel art, zonas interactivas y
// comportamiento de la mascota. El lienzo mide 96x104 y el CSS lo amplía.
const SW = 96, SH = 104, FLOOR = 40, TUB_Y = 74;

const ROOM_TITLES = { sala: 'Sala', cocina: 'Cocina', bano: 'Baño', dormitorio: 'Dormitorio', arcade: 'Arcade' };
const ROOM_HOME = { sala: [40, 66], cocina: [58, 57], bano: [32, 70], dormitorio: [22, 76], arcade: [44, 73] };
const ROOM_HINTS = {
  sala: n => `Acaricia a ${n} o arrastra la pelota`,
  cocina: () => 'Toca la nevera para darle de comer',
  bano: () => 'Toca la ducha para bañarla o el inodoro',
  dormitorio: () => 'Toca la cama para que duerma',
  arcade: () => 'Elige una máquina para jugar',
};
// Zonas tocables de cada habitación (coordenadas del lienzo).
const ROOM_HITS = {
  sala: [],
  cocina: [{ id: 'nevera', x: 3, y: 4, w: 24, h: 46 }, { id: 'mesa', x: 22, y: 56, w: 30, h: 26 }],
  bano: [{ id: 'patito', x: 8, y: 44, w: 14, h: 12 }, { id: 'ducha', x: 5, y: 3, w: 46, h: 50 }, { id: 'inodoro', x: 66, y: 56, w: 26, h: 34 }],
  dormitorio: [{ id: 'lampara', x: 7, y: 15, w: 20, h: 32 }, { id: 'cama', x: 34, y: 10, w: 30, h: 58 }],
  arcade: [0, 1, 2, 3].map(i => ({ id: 'maquina' + i, x: 4 + i * 23, y: 16, w: 19, h: 36 })),
};
const ARCADE_ORDER = ['naves', 'bloques', 'pronto', 'pronto'];

// ---------------- Fondos estáticos ----------------
let BG_FLOOR = null;   // suelo comprado aplicado a la habitación que se está dibujando
function wallFloor(g, wall, floor, deco) {
  PX.rect(g, 0, 0, SW, FLOOR, wall);
  PX.rect(g, 0, FLOOR, SW, SH - FLOOR, floor);
  if (deco) deco();
  if (BG_FLOOR && FLOORS[BG_FLOOR]) FLOORS[BG_FLOOR](g, 0, FLOOR, SW, SH - FLOOR);
  PX.rect(g, 0, FLOOR - 1, SW, 2, C.ink3);
}
function planks(g, col) {
  for (let y = FLOOR + 6, r = 0; y < SH; y += 6, r++) {
    PX.rect(g, 0, y, SW, 1, col);
    for (let x = (r % 2) * 12 + 5; x < SW; x += 24) PX.rect(g, x, y - 5, 1, 5, col);
  }
}

const RUGS = { alfombraRosa: [C.pink, C.pinkD], alfombraLila: [C.purpleL, C.purple] };

const BG = {
  sala(g, s) {
    wallFloor(g, C.pinkXL, C.woodL, () => {
      for (let x = 4; x < SW; x += 8) PX.rect(g, x, 0, 1, FLOOR, C.pinkL);
      planks(g, C.wood);
    });
    // cuadro
    PX.layer(g, l => PX.rect(l, 22, 5, 14, 16, C.woodM));
    PX.rect(g, 24, 7, 10, 12, C.white);
    PX.oell(g, 29, 13, 2.6, 3.5, C.white, C.ink);
    PX.pts(g, [[28, 12], [30, 12], [29, 14]], C.ink);
    // puerta
    PX.layer(g, l => PX.rect(l, 64, 9, 20, 31, C.cream));
    PX.orect(g, 67, 12, 14, 9, C.woodXL, C.wood); PX.orect(g, 67, 25, 14, 12, C.woodXL, C.wood);
    PX.odisc(g, 80.5, 23.5, 1.2, C.coin, C.coinDD);
    // sofá
    PX.layer(g, l => {
      PX.rect(l, 14, 24, 36, 16, C.pink); PX.rect(l, 10, 30, 6, 19, C.pink); PX.rect(l, 48, 30, 6, 19, C.pink); PX.rect(l, 14, 39, 36, 10, C.pink);
    });
    PX.rect(g, 16, 39, 32, 1, C.pinkD); PX.rect(g, 16, 30, 1, 19, C.pinkD); PX.rect(g, 47, 30, 1, 19, C.pinkD);
    PX.orect(g, 19, 28, 12, 9, C.pinkD); PX.orect(g, 34, 28, 12, 9, C.pinkD);
    PX.rect(g, 20, 29, 3, 1, C.pink); PX.rect(g, 35, 29, 3, 1, C.pink);
    PX.rect(g, 12, 50, 2, 3, C.ink); PX.rect(g, 50, 50, 2, 3, C.ink);
    // alfombra ovalada
    const [r1, r2] = [C.rug, C.rugD];
    PX.layer(g, l => PX.ell(l, 48, 75, 39, 17, r1));
    PX.ell(g, 48, 75, 33, 12.5, r2); PX.ell(g, 48, 75, 32, 11.5, r1);
  },

  cocina(g, s, ui) {
    wallFloor(g, C.meadowXL, C.blueXL, () => {
      for (let x = 0; x < SW; x += 6) PX.rect(g, x, 0, 1, FLOOR, C.meadowL);
      for (let y = 0; y < FLOOR; y += 6) PX.rect(g, 0, y, SW, 1, C.meadowL);
      for (let y = FLOOR; y < SH; y += 8) for (let x = ((y - FLOOR) / 8 % 2) * 8; x < SW; x += 16) PX.rect(g, x, y, 8, 8, C.skyL);
    });
    // nevera
    PX.layer(g, l => PX.rect(l, 5, 6, 20, 42, C.g1));
    PX.rect(g, 5, 19, 20, 1, C.ink); PX.rect(g, 21, 11, 1, 5, C.ink);
    PX.rect(g, 7, 8, 1, 8, C.white);
    if (ui.fridgeOpen) {
      PX.rect(g, 6, 20, 18, 28, C.blueL);
      PX.rect(g, 6, 29, 18, 1, C.white); PX.rect(g, 6, 38, 18, 1, C.white);
      PX.layer(g, l => PX.poly(l, [[0, 23], [5, 20], [5, 48], [0, 51]], C.g1));
    } else {
      PX.rect(g, 21, 23, 1, 8, C.ink); PX.rect(g, 7, 22, 1, 10, C.white);
    }
    // grifo y encimera
    PX.layer(g, l => { PX.rect(l, 47, 8, 3, 13, C.g5); PX.rect(l, 47, 8, 7, 2, C.g5); });
    PX.layer(g, l => { PX.rect(l, 28, 22, 64, 22, C.white); PX.rect(l, 27, 20, 66, 3, C.g3); });
    PX.rect(g, 27, 22, 66, 1, C.ink);
    PX.orect(g, 33, 26, 13, 6, C.orange); PX.rect(g, 34, 27, 4, 1, C.orangeL);
    PX.orect(g, 62, 25, 24, 13, C.ink2);
    for (const [x, y] of [[68, 28.5], [79, 28.5], [68, 34.5], [79, 34.5]]) PX.disc(g, x, y, 2.3, C.white);
    PX.rect(g, 52, 32, 1, 12, C.g4);
    // mesa con plato y silla
    PX.layer(g, l => { PX.rect(l, 22, 56, 30, 26, C.white); PX.rect(l, 25, 82, 4, 8, C.white); PX.rect(l, 45, 82, 4, 8, C.white); });
    PX.disc(g, 37, 68, 7.5, C.g3); PX.disc(g, 37, 68, 6, C.g2); PX.disc(g, 37, 67.5, 5, C.white);
    PX.layer(g, l => { PX.rect(l, 65, 50, 5, 40, C.white); PX.rect(l, 54, 66, 14, 4, C.white); PX.rect(l, 55, 70, 3, 20, C.white); });
  },

  bano(g, s, ui) {
    wallFloor(g, C.cyanXL, C.blueXL, () => {
      for (let x = 0; x < SW; x += 6) PX.rect(g, x, 0, 1, FLOOR, C.cyanL);
      for (let y = 0; y < FLOOR; y += 6) PX.rect(g, 0, y, SW, 1, C.cyanL);
      for (let x = 0; x < SW; x += 8) PX.rect(g, x, FLOOR, 1, SH - FLOOR, C.skyL);
      for (let y = FLOOR; y < SH; y += 8) PX.rect(g, 0, y, SW, 1, C.skyL);
    });
    // ducha / bañera
    if (ui.curtain) {
      PX.rect(g, 8, 6, 40, 44, C.blueL);
      for (const [x, y, h] of [[12, 12, 28], [19, 9, 22], [26, 14, 30], [33, 9, 24], [41, 11, 30]]) { PX.rect(g, x, y, 2, h, C.blue); PX.px(g, x, y - 1, C.blue); }
      PX.rect(g, 8, 6, 40, 2, C.blue); PX.rect(g, 8, 48, 40, 2, C.blue);
    } else {
      PX.rect(g, 8, 6, 40, 20, C.cyanXL);
      for (let x = 8; x < 48; x += 5) PX.rect(g, x, 6, 1, 20, C.cyanL);
      PX.layer(g, l => { PX.rect(l, 38, 8, 8, 2, C.g6); PX.rect(l, 44, 6, 2, 3, C.g6); });
      PX.layer(g, l => PX.rect(l, 9, 26, 38, 23, C.white));
      PX.orect(g, 13, 30, 30, 10, C.blueXL, C.g4);
      PX.layer(g, l => { PX.rect(l, 10, 27, 5, 2, C.g6); PX.rect(l, 10, 27, 2, 5, C.g6); });
      PX.rect(g, 8, 6, 5, 20, C.blueL); PX.rect(g, 10, 8, 1, 16, C.blue);
    }
    PX.rect(g, 6, 4, 44, 2, C.ink); PX.rect(g, 6, 4, 2, 50, C.ink); PX.rect(g, 48, 4, 2, 50, C.ink);
    // espejo y lavabo
    PX.layer(g, l => PX.ell(l, 73, 13, 7, 9, C.skyL), C.blue);
    PX.line(g, 70, 17, 74, 9, C.white); PX.line(g, 73, 19, 77, 11, C.white);
    PX.layer(g, l => { PX.rect(l, 61, 24, 24, 8, C.white); PX.rect(l, 64, 32, 18, 18, C.white); });
    PX.orect(g, 64, 26, 18, 3, C.g2, C.g5); PX.rect(g, 72, 22, 2, 3, C.g6);
    PX.orect(g, 67, 35, 12, 12, C.white, C.ink);
    // inodoro
    PX.layer(g, l => { PX.rect(l, 84, 57, 7, 24, C.white); PX.ell(l, 77, 72, 9.5, 5, C.white); PX.rect(l, 71, 74, 11, 14, C.white); });
    PX.ell(g, 77, 72, 6.5, 2.8, C.g2); PX.rect(g, 84, 57, 1, 13, C.g3);
  },

  dormitorio(g, s) {
    wallFloor(g, C.lav, C.woodL, () => {
      for (let y = 6; y < FLOOR; y += 10) for (let x = (y % 20 ? 0 : 5); x < SW; x += 10) PX.px(g, x, y, C.indigoL);
      planks(g, C.wood);
    });
    // ventana con el cielo según la hora local
    const h = new Date().getHours();
    const sky = (h >= 20 || h < 6) ? C.night : (h >= 18 || h < 8) ? C.orangeL : C.cyanL;
    PX.layer(g, l => PX.rect(l, 66, 6, 20, 22, sky));
    if (sky === C.night) { PX.pts(g, [[69, 9], [83, 10], [70, 24], [82, 22], [79, 8]], C.white); PX.disc(g, 71, 12, 2.5, C.yellowL); }
    else if (sky === C.cyanL) { PX.ell(g, 79, 23, 4, 1.6, C.white); PX.ell(g, 71, 11, 3, 1.3, C.white); }
    PX.rect(g, 75, 6, 2, 22, C.ink); PX.rect(g, 66, 16, 20, 2, C.ink);
    // alfombra
    PX.layer(g, l => PX.rect(l, 18, 54, 62, 40, C.rug));
    PX.rect(g, 21, 57, 56, 1, C.rugD); PX.rect(g, 21, 90, 56, 1, C.rugD); PX.rect(g, 21, 57, 1, 34, C.rugD); PX.rect(g, 76, 57, 1, 34, C.rugD);
    // mesita y lámpara
    PX.layer(g, l => { PX.rect(l, 8, 32, 18, 14, C.white); PX.rect(l, 10, 46, 14, 8, C.white); });
    PX.rect(g, 8, 39, 18, 1, C.ink); PX.rect(g, 15, 35, 4, 1, C.ink);
    PX.layer(g, l => { PX.poly(l, [[14, 19], [20, 19], [24, 29], [10, 29]], C.coin); PX.disc(l, 17, 18, 2.5, C.coin); PX.rect(l, 15, 29, 4, 3, C.ink3); });
    PX.pts(g, [[14, 21], [13, 24]], C.white);
    // cama (la manta se dibuja encima de la mascota dormida)
    PX.layer(g, l => {
      PX.rect(l, 36, 12, 26, 12, C.brownD); PX.rect(l, 36, 24, 26, 38, C.white);
      PX.rect(l, 36, 62, 4, 5, C.ink2); PX.rect(l, 58, 62, 4, 5, C.ink2);
    });
    PX.rect(g, 38, 14, 22, 2, C.brown);
    PX.orect(g, 40, 19, 18, 6, C.g1);
  },

  arcade(g) {
    wallFloor(g, C.purpleD, C.purpleM, () => {
      for (let x = 2; x < SW; x += 8) PX.rect(g, x, 0, 1, FLOOR, '#57258C');
      for (let y = FLOOR + 4; y < SH; y += 8) for (let x = ((y / 8) % 2) * 8; x < SW; x += 16) PX.rect(g, x, y, 8, 4, '#9B56D9');
    });
    PX.orect(g, 13, 2, 70, 11, C.nightDD, C.fuchsia);
    PX.textC(g, 'MONSTER ARCADE', 48, 5, C.fuchsiaL);
    const marquee = [C.cyan, C.yellow, C.g5, C.g5];
    for (let i = 0; i < 4; i++) {
      const mx = 4 + i * 23, my = 16;
      PX.layer(g, l => { PX.rect(l, mx, my, 19, 36, C.white); });
      PX.rect(g, mx + 2, my + 2, 15, 4, marquee[i]);
      PX.orect(g, mx + 3, my + 9, 13, 10, C.nightD);
      PX.rect(g, mx + 1, my + 22, 17, 4, C.g2); PX.rect(g, mx + 1, my + 21, 17, 1, C.ink);
      PX.pts(g, [[mx + 4, my + 23], [mx + 7, my + 24], [mx + 10, my + 23], [mx + 13, my + 24]], C.ink);
      PX.rect(g, mx + 7, my + 30, 5, 1, C.ink);
    }
    PX.layer(g, l => PX.rect(l, 16, 62, 64, 34, C.fuchsia));
    PX.rect(g, 18, 64, 60, 30, '#F572D1');
  },
};

// ---------------- Escena ----------------
const Scene = {
  c: null, g: null, room: 'sala', t: 0, bg: null, bgKey: '',
  pet: { x: 40, y: 66, tx: 40, ty: 66, dir: 1, expr: null, exprUntil: 0, hidden: false, seat: null, onArrive: null, moving: false, wanderAt: 0, blinkAt: 2 },
  ball: { x: 66, y: 76, z: 0, vx: 0, vy: 0, vz: 0, drag: false, spin: 0, chaseUntil: 0, hist: [] },
  fx: [], timers: [], locked: false, eating: null, bathing: false, duckHop: 0, hand: 0, tempBubble: null,
  ui: { fridgeOpen: false, curtain: false, light: true },
  cool: {}, edit: null, scrub: null,

  init(canvas) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.g.imageSmoothingEnabled = false;
    canvas.addEventListener('pointerdown', e => this.onDown(e));
    canvas.addEventListener('pointermove', e => this.onMove(e));
    canvas.addEventListener('pointerup', e => this.onUp(e));
    canvas.addEventListener('pointercancel', () => { this.down = null; this.ball.drag = false; });
  },
  setRoom(id) {
    if (this.scrub) this.endScrub(false, true);
    this.edit = null;
    this.room = id;
    this.timers = []; this.fx = []; this.locked = false; this.eating = null; this.bathing = false;
    this.ui.curtain = false; this.ui.fridgeOpen = false;
    const [hx, hy] = ROOM_HOME[id];
    Object.assign(this.pet, { x: hx, y: hy, tx: hx, ty: hy, dir: 1, seat: null, hidden: false, onArrive: null, wanderAt: this.t + 3 });
    if (id === 'sala') Object.assign(this.ball, { x: 66, y: 76, z: 0, vx: 0, vy: 0, vz: 0, drag: false });
    this.bgKey = '';
  },
  invalidate() { this.bgKey = ''; },
  canAct(quiet) {
    const s = Store.s;
    if (s.pet.asleep) { if (!quiet) UI.toast(`${s.pet.name} está durmiendo. Despiértala en el dormitorio.`); return false; }
    return !this.locked;
  },
  after(ms, fn) { this.timers.push({ at: this.t + ms / 1000, fn }); },
  walkTo(x, y, cb) { Object.assign(this.pet, { tx: x, ty: y, onArrive: cb || null }); },
  say(expr, ms) { this.pet.expr = expr; this.pet.exprUntil = this.t + ms / 1000; },
  bubble(icon, ms, thought = false) { this.tempBubble = { icon, until: this.t + ms / 1000, thought }; },
  burst(kind, x, y, n = 5) {
    for (let i = 0; i < n; i++) this.fx.push({ kind, x: x + (Math.random() * 14 - 7), y: y + (Math.random() * 8 - 4), vx: Math.random() * 10 - 5, vy: -8 - Math.random() * 10, life: 0, max: 0.9 + Math.random() * 0.6 });
  },
  cooldown(key, sec) { if ((this.cool[key] || 0) > this.t) return false; this.cool[key] = this.t + sec; return true; },

  // ---------- Acciones ----------
  petPet() {
    const s = Store.s;
    if (s.pet.asleep) { UI.toast(`Shh... ${s.pet.name} duerme.`); return; }
    if (this.locked || !this.cooldown('pet', 0.7)) return;
    Store.apply(ACTIONS.acariciar);
    this.hand = this.t + 0.8; this.say('love', 1200); this.bubble('heart', 1600);
    this.burst('heart', this.pet.x, this.pet.y - 6, 2);
    Sound.play('love');
  },
  eat(foodId) {
    if (!this.canAct()) return false;
    if (!Store.feed(foodId)) { UI.toast('No te queda ese alimento. Cómpralo en la tienda.'); Sound.play('error'); return false; }
    this.locked = true; this.eating = { food: foodId, t0: this.t };
    const [hx, hy] = ROOM_HOME.cocina; Object.assign(this.pet, { x: hx, y: hy, tx: hx, ty: hy, dir: 1 });
    Sound.play('eat');
    this.after(2400, () => { this.eating = null; this.locked = false; this.say('love', 1500); this.bubble('heart', 1500); this.burst('spark', 37, 64, 4); });
    return true;
  },
  // Baño: si está sucia hay que frotarle la mugre con el dedo; después se enjuaga.
  bath() {
    if (!this.canAct()) return;
    const s = Store.s;
    this.locked = true;
    if (s.suciedad < 8) {               // ya está limpia: solo una ducha rápida
      Store.apply({ suciedad: -100 }, true);
      this.walkTo(28, 60, () => {
        this.pet.hidden = true; this.ui.curtain = true; this.bathing = true; this.invalidate(); Sound.play('water');
        this.after(1800, () => {
          this.bathing = false; this.ui.curtain = false; this.pet.hidden = false; this.invalidate();
          Object.assign(this.pet, { x: 30, y: 70, tx: 30, ty: 70, dir: 1 });
          this.burst('spark', 34, 66, 5); this.say('love', 1500); this.locked = false;
        });
      });
      return;
    }
    this.walkTo(28, 60, () => this.startScrub());
  },
  startScrub() {
    const s = Store.s;
    // capa de la mascota grande (para saber dónde puede haber mugre)
    const P = PX.make(SW, SH);
    drawPet(P.g, 34, 32, { species: s.pet.species, stage: s.pet.stage, scale: 2, still: true, expr: 'sad', equipped: {} });
    const D = PX.make(SW, SH);
    const blobs = [C.brown, '#986D43', C.brownD];
    const n = Math.round(6 + s.suciedad * 0.22);
    for (let i = 0; i < n; i++) {
      const x = 14 + Math.random() * 66, y = 14 + Math.random() * 52;
      PX.disc(D.g, x, y, 3 + Math.random() * 4.5, blobs[i % 3]);
      PX.disc(D.g, x - 1, y - 1, 1.2, C.woodM);
    }
    D.g.globalCompositeOperation = 'destination-in'; D.g.drawImage(P.c, 0, 0); D.g.globalCompositeOperation = 'source-over';
    D.g.clearRect(0, TUB_Y, SW, SH);    // lo que tapa la bañera no se puede frotar
    this.scrub = { dirt: D, total: 1, progress: 0, check: 0, foam: [], phase: 'scrub', t: 0, last: 0, down: false };
    this.scrub.total = Math.max(1, this.dirtCount());
    Sound.play('water');
    UI.updateChip();
  },
  dirtCount() {
    const a = this.scrub.dirt.g.getImageData(0, 0, SW, SH).data; let n = 0;
    for (let i = 3; i < a.length; i += 4) if (a[i] > 0) n++;
    return n;
  },
  scrubAt(x, y) {
    const sc = this.scrub;
    if (!sc || sc.phase !== 'scrub') return;
    PX.disc(sc.dirt.g, x, y, 5.5, null);
    if (Math.random() < 0.5) sc.foam.push({ x: x + Math.random() * 8 - 4, y: y + Math.random() * 8 - 4, r: 1 + Math.random() * 2, life: 0 });
    if (performance.now() - sc.last > 90) { Sound.play('scrub'); sc.last = performance.now(); }
  },
  updateScrub(dt) {
    const sc = this.scrub;
    sc.t += dt;
    for (const f of sc.foam) f.life += dt;
    sc.foam = sc.foam.filter(f => f.life < 1.2);
    if (sc.phase === 'scrub') {
      sc.check -= dt;
      if (sc.check <= 0) {
        sc.check = 0.15;
        sc.progress = Math.min(1, (1 - this.dirtCount() / sc.total) / 0.92);
        if (sc.progress >= 1) { sc.phase = 'rinse'; sc.rinseT = sc.t; sc.dirt.g.clearRect(0, 0, SW, SH); Sound.play('water'); UI.updateChip(); }
      }
    } else if (sc.t - sc.rinseT > 1.8) this.endScrub(true);
  },
  // Termina el baño. Si se dejó a medias, solo se quita la parte frotada.
  endScrub(full, silent) {
    const sc = this.scrub;
    if (!sc) return;
    const s = Store.s;
    const removed = full ? 100 : Math.round(s.suciedad * sc.progress);
    this.scrub = null;
    Store.apply({ suciedad: -removed, ...(full ? ACTIONS.frotar : {}) }, true);
    this.locked = false;
    if (silent) return;
    Object.assign(this.pet, { x: 30, y: 70, tx: 30, ty: 70, dir: 1, hidden: false });
    if (full) { this.burst('spark', 34, 66, 8); this.say('love', 2000); Sound.play('win'); UI.toast(`¡${s.pet.name} está reluciente!`); }
    UI.updateChip();
  },
  drawScrub(g) {
    const sc = this.scrub, s = Store.s;
    PX.rect(g, 0, 0, SW, SH, C.cyanXL);
    for (let x = 0; x < SW; x += 8) PX.rect(g, x, 0, 1, SH, C.cyanL);
    for (let y = 0; y < SH; y += 8) PX.rect(g, 0, y, SW, 1, C.cyanL);
    PX.layer(g, l => { PX.rect(l, 70, 2, 4, 10, C.g6); PX.rect(l, 62, 10, 12, 3, C.g6); });
    const expr = sc.phase === 'rinse' ? 'love' : sc.progress > 0.6 ? 'happy' : 'sad';
    drawPet(g, 34, 32, { species: s.pet.species, stage: s.pet.stage, scale: 2, still: true, expr, equipped: {} });
    g.drawImage(sc.dirt.c, 0, 0);
    for (const f of sc.foam) { g.globalAlpha = 1 - f.life / 1.2; PX.odisc(g, f.x, f.y - f.life * 6, f.r, C.white, C.blue); g.globalAlpha = 1; }
    if (sc.phase === 'rinse') for (let i = 0; i < 30; i++) PX.rect(g, 8 + ((i * 29) % 80), ((sc.t * 90 + i * 37) % (TUB_Y - 10)) + 12, 1, 3, C.blueM);
    // bañera delante
    PX.layer(g, l => PX.rect(l, 4, TUB_Y, 88, SH - TUB_Y, C.white));
    PX.rect(g, 4, TUB_Y + 3, 88, 1, C.g3);
    for (let i = 0; i < 9; i++) PX.odisc(g, 8 + i * 10 + (i % 2) * 3, TUB_Y - 1 + (i % 3), 2.5 + (i % 2), C.white, C.blue);
    PX.layer(g, l => { PX.ell(l, 12, SH - 2, 5, 3, C.yellow); PX.disc(l, 9, SH - 7, 3, C.yellow); PX.rect(l, 4, SH - 7, 3, 2, C.orange); });
    // progreso (en el frente de la bañera)
    PX.orect(g, 24, 90, 48, 5, C.g1);
    PX.rect(g, 24, 90, Math.round(48 * sc.progress), 5, C.rug);
    PX.textC(g, 'LIMPIEZA ' + Math.round(sc.progress * 100) + '%', 48, 82, C.ink);
  },
  toilet() {
    if (!this.canAct()) return;
    this.locked = true;
    Store.apply(ACTIONS.inodoro, true);
    this.walkTo(78, 61, () => {
      this.pet.seat = 'inodoro'; this.pet.dir = 1; this.say('strain', 1800);
      this.after(1900, () => {
        Sound.play('flush'); this.pet.seat = null; this.burst('spark', 78, 60, 4);
        this.walkTo(52, 74, () => { this.locked = false; }); this.say('happy', 1200);
      });
    });
  },
  duck() {
    if (!this.cooldown('duck', 0.6)) return;
    this.duckHop = this.t + 0.5; Sound.play('squeak');
    if (!Store.s.pet.asleep && this.cooldown('duckFun', 3)) Store.apply(ACTIONS.patito);
  },
  sleep() {
    const p = Store.s.pet;
    if (p.asleep) { UI.toast(`${p.name} ya está durmiendo.`); return; }
    if (this.locked) return;
    this.locked = true;
    this.walkTo(48, 52, () => {
      p.asleep = true; p.autoSleep = false; p.wokenUntil = 0;
      this.ui.light = false; this.locked = false; Sound.play('sleep');
      Store.commit(); UI.updateChip();
    });
  },
  wake() {
    const p = Store.s.pet;
    if (!p.asleep) return;
    p.asleep = false; p.autoSleep = false;
    if (Needs.isNight(Date.now())) { p.wokenUntil = Date.now() + 20 * 60 * 1000; UI.toast('Es de noche: volverá a dormirse en 20 minutos.'); }
    this.ui.light = true;
    if (this.room === 'dormitorio') Object.assign(this.pet, { x: 30, y: 74, tx: 30, ty: 74, dir: 1 });
    this.say('blink', 600); Sound.play('wake');
    Store.commit(); UI.updateChip();
  },
  startEdit(sel = null) {
    if (this.room === 'arcade' || this.scrub) return;
    this.edit = { sel, drag: null };
    UI.updateChip();
  },
  stopEdit() { this.edit = null; Store.commit(); UI.updateChip(); },
  cleanPoop() {
    Store.s.pet.poop = false; Store.apply(ACTIONS.limpiarPopo, true);
    this.burst('spark', 18, 80, 6); Sound.play('flush');
  },

  // ---------- Entrada táctil / ratón ----------
  toScene(e) {
    const r = this.c.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * SW, y: (e.clientY - r.top) / r.height * SH };
  },
  onDown(e) {
    Sound.unlock();
    const p = this.toScene(e);
    this.down = { x: p.x, y: p.y, moved: 0 };
    try { this.c.setPointerCapture(e.pointerId); } catch (_) {}
    if (this.scrub) { this.scrubAt(p.x, p.y); return; }
    if (this.edit) {
      const d = this.decorAt(p.x, p.y);
      this.edit.sel = d ? d.uid : null;
      this.edit.drag = d ? { dx: p.x - d.x, dy: p.y - d.y } : null;
      if (d) Sound.play('tap');
      UI.updateChip();
      return;
    }
    const b = this.ball;
    if (this.room === 'sala' && !Store.s.pet.asleep && Math.hypot(p.x - b.x, p.y - (b.y - b.z)) < 9) {
      b.drag = true; b.vx = b.vy = b.vz = 0; b.z = 0; b.hist = [{ x: p.x, y: p.y, t: performance.now() }];
    }
  },
  onMove(e) {
    if (!this.down) return;
    const p = this.toScene(e);
    this.down.moved = Math.max(this.down.moved, Math.hypot(p.x - this.down.x, p.y - this.down.y));
    if (this.scrub) { this.scrubAt(p.x, p.y); return; }
    if (this.edit) { if (this.edit.drag) Store.moveDecor(this.edit.sel, p.x - this.edit.drag.dx, p.y - this.edit.drag.dy); return; }
    const b = this.ball;
    if (b.drag) {
      b.x = Math.max(12, Math.min(86, p.x)); b.y = Math.max(54, Math.min(98, p.y));
      b.hist.push({ x: b.x, y: b.y, t: performance.now() }); if (b.hist.length > 6) b.hist.shift();
    }
  },
  onUp(e) {
    if (!this.down) return;
    const p = this.toScene(e), b = this.ball, moved = this.down.moved;
    this.down = null;
    if (this.scrub) return;
    if (this.edit) { if (this.edit.drag) { this.edit.drag = null; Store.commit(); } return; }
    if (b.drag) {
      b.drag = false;
      if (moved < 3) { b.vz = 70; b.vx = (Math.random() - 0.5) * 30; b.vy = (Math.random() - 0.5) * 16; }
      else {
        const h = b.hist, a = h[0], z = h[h.length - 1], dt = Math.max(16, z.t - a.t) / 1000;
        b.vx = Math.max(-120, Math.min(120, (z.x - a.x) / dt)); b.vy = Math.max(-90, Math.min(90, (z.y - a.y) / dt)); b.vz = 25;
      }
      b.chaseUntil = this.t + 4; Sound.play('kick');
      return;
    }
    if (moved < 6) this.tap(p.x, p.y);
  },
  petHit(x, y) {
    const p = this.pet;
    if (p.hidden || Store.s.pet.asleep) return false;
    return x > p.x - 9 && x < p.x + 18 && y > p.y - 10 && y < p.y + 16;
  },
  tap(x, y) {
    const s = Store.s;
    if (this.room === 'arcade') {
      const hit = ROOM_HITS.arcade.find(h => x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h);
      if (hit) { Sound.play('ui'); UI.openGameCard(ARCADE_ORDER[+hit.id.slice(-1)]); return; }
      if (this.petHit(x, y)) this.petPet();
      return;
    }
    if (this.petHit(x, y)) { this.petPet(); return; }
    if (this.room === 'sala' && s.pet.poop && x > 8 && x < 28 && y > 72 && y < 90) { this.cleanPoop(); return; }
    const hit = (ROOM_HITS[this.room] || []).find(h => x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h);
    if (hit) {
      Sound.play('tap');
      switch (hit.id) {
        case 'nevera': case 'mesa': UI.openFridge(); break;
        case 'ducha': this.bath(); break;
        case 'inodoro': this.toilet(); break;
        case 'patito': this.duck(); break;
        case 'cama': s.pet.asleep ? UI.toast(`Usa el botón Despertar para levantar a ${s.pet.name}.`) : this.sleep(); break;
        case 'lampara': this.ui.light = !this.ui.light; break;
      }
      return;
    }
    // tocar el suelo de la sala: la mascota camina hasta allí
    if (this.room === 'sala' && y > 56 && this.canAct(true)) this.walkTo(Math.max(18, Math.min(74, x - 4)), Math.max(58, Math.min(78, y - 8)));
  },

  // ---------- Bucle ----------
  frame(dt) {
    this.t += dt;
    const s = Store.s, p = this.pet;
    if (this.scrub) { this.updateScrub(dt); this.draw(); return; }
    for (const tm of this.timers.slice()) if (this.t >= tm.at) { this.timers.splice(this.timers.indexOf(tm), 1); tm.fn(); }
    // movimiento de la mascota
    const dx = p.tx - p.x, dy = p.ty - p.y, dist = Math.hypot(dx, dy);
    p.moving = dist > 0.6 && !s.pet.asleep;
    if (p.moving) {
      const sp = 24 * dt;
      p.x += dx / dist * Math.min(sp, dist); p.y += dy / dist * Math.min(sp, dist);
      if (Math.abs(dx) > 0.5) p.dir = dx > 0 ? -1 : 1;
    } else if (p.onArrive) { p.x = p.tx; p.y = p.ty; const cb = p.onArrive; p.onArrive = null; cb(); }
    // paseos y pelota en la sala
    if (this.room === 'sala' && !s.pet.asleep && !this.locked && !this.edit) this.updateSala(dt);
    if (this.room === 'arcade' && !p.moving && this.t > p.wanderAt) { p.tx = 30 + Math.random() * 30; p.wanderAt = this.t + 3 + Math.random() * 3; }
    if (this.t > p.blinkAt + 0.15) p.blinkAt = this.t + 2 + Math.random() * 3;
    // efectos
    for (const f of this.fx) { f.life += dt; f.x += f.vx * dt; f.y += f.vy * dt; }
    this.fx = this.fx.filter(f => f.life < f.max);
    if (this.bathing && Math.random() < 0.6) this.fx.push({ kind: 'drop', x: 12 + Math.random() * 34, y: 10, vx: 0, vy: 60, life: 0, max: 0.6 });
    this.draw();
  },
  updateSala(dt) {
    const b = this.ball, p = this.pet;
    if (!b.drag) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.vz -= 200 * dt; b.z += b.vz * dt;
      if (b.z <= 0) { b.z = 0; b.vz = Math.abs(b.vz) > 25 ? -b.vz * 0.45 : 0; }
      const fr = Math.pow(0.3, dt); b.vx *= fr; b.vy *= fr;
      if (b.x < 12 || b.x > 86) { b.vx = -b.vx; b.x = Math.max(12, Math.min(86, b.x)); }
      if (b.y < 54 || b.y > 98) { b.vy = -b.vy; b.y = Math.max(54, Math.min(98, b.y)); }
      b.spin += (b.vx + b.vy) * dt * 0.15;
    }
    const chasing = this.t < b.chaseUntil;
    if (chasing && !b.drag) {
      const side = p.x < b.x ? -1 : 1;
      p.tx = Math.max(18, Math.min(74, b.x + side * 9)); p.ty = Math.max(58, Math.min(78, b.y - 9)); p.onArrive = null;
      if (Math.abs(p.x - b.x) < 12 && Math.abs(p.y + 9 - b.y) < 8 && b.z < 4 && this.cooldown('kick', 0.9)) {
        b.vz = 75; b.vx = -side * (25 + Math.random() * 35); b.vy = (Math.random() - 0.5) * 40;
        b.chaseUntil = this.t + 2.5; this.say('love', 700); Sound.play('kick');
        if (this.cooldown('ballFun', 1.5)) Store.apply(ACTIONS.pelota);
      }
    } else if (!p.moving && this.t > p.wanderAt) {
      p.tx = 20 + Math.random() * 50; p.ty = 60 + Math.random() * 18; p.wanderAt = this.t + 3 + Math.random() * 4;
    }
  },

  expr() {
    const s = Store.s, p = this.pet;
    if (this.eating) return Math.floor(this.t * 4) % 2 ? 'eatA' : 'eatB';
    if (p.expr && this.t < p.exprUntil) return p.expr;
    if (this.t > p.blinkAt) return 'blink';
    const sad = NEED_KEYS.some(k => s.needs[k] >= 70) || s.suciedad >= 70 || s.pet.poop;
    return sad ? 'sad' : 'happy';
  },
  needBubble() {
    const s = Store.s;
    if (Math.floor(this.t / 3) % 2) return null;          // aparece y desaparece
    if (s.pet.poop) return ['poop', false];
    const c = [[s.needs.hambre, 'onigiri', false], [s.needs.bano, 'toilet', false], [s.suciedad, 'drop', false],
               [s.needs.entretenimiento, 'rocket', false], [s.needs.sueno, 'moon', true]].filter(v => v[0] >= 65).sort((a, b) => b[0] - a[0]);
    return c.length ? [c[0][1], c[0][2]] : null;
  },
  petOpts(extra = {}) {
    const s = Store.s;
    return { species: s.pet.species, stage: s.pet.stage, t: this.t, dir: this.pet.dir, moving: this.pet.moving, expr: this.expr(), dirt: s.suciedad, equipped: s.equipped, ...extra };
  },

  // ---------- Decoración colocada ----------
  roomDecor(room) {
    const list = Store.s.placed.filter(d => d.room === room).map(d => ({ ...d, it: ITEM_BY_ID[d.id] }));
    const rank = m => m === 'rug' ? 0 : m === 'wall' ? 1 : 2;
    return list.sort((a, b) => rank(a.it.mount) - rank(b.it.mount) || (a.y + a.it.h) - (b.y + b.it.h));
  },
  decorAt(x, y) {
    const list = this.roomDecor(this.room).reverse();
    return list.find(d => x >= d.x && x < d.x + d.it.w && y >= d.y && y < d.y + d.it.h) || null;
  },
  drawDecor(g, d) {
    const { x, y, id } = d, t = this.t;
    switch (id) {
      case 'cuadroEstrella': case 'poster': g.drawImage(Sprites.canvas(d.it.icon), x - 1, y); break;
      case 'reloj': {
        const cx = x + 6, cy = y + 6, now = new Date();
        PX.odisc(g, cx, cy, 5, C.orange); PX.disc(g, cx, cy, 4, C.white);
        const a1 = (now.getHours() % 12 + now.getMinutes() / 60) / 12 * Math.PI * 2, a2 = now.getMinutes() / 60 * Math.PI * 2;
        PX.line(g, cx - .5, cy - .5, cx - .5 + Math.sin(a1) * 2, cy - .5 - Math.cos(a1) * 2, C.ink);
        PX.line(g, cx - .5, cy - .5, cx - .5 + Math.sin(a2) * 3.2, cy - .5 - Math.cos(a2) * 3.2, C.red);
        break;
      }
      case 'guirnalda': {
        const cols = [C.red, C.yellow, C.cyan, C.green, C.pink];
        for (let i = 0; i < 4; i++) {
          const x0 = x + i * 9, y0 = y + 1 + (i % 2) * 2;
          PX.line(g, x0, y0, x0 + 9, y + 1 + ((i + 1) % 2) * 2, C.ink);
          const on = (Math.floor(t * 2) + i) % 3 !== 0;
          PX.odisc(g, x0 + 4.5, y0 + 3.5, 1.4, on ? cols[i] : C.g5);
        }
        break;
      }
      case 'maceta':
        PX.layer(g, l => {
          PX.disc(l, x + 4, y + 6, 3.5, C.green); PX.disc(l, x + 8.5, y + 5, 3.5, C.green); PX.disc(l, x + 6, y + 3, 3, C.green);
          PX.poly(l, [[x + 1, y + 10], [x + 11, y + 10], [x + 10, y + 20], [x + 2, y + 20]], C.coral);
        });
        PX.rect(g, x + 1, y + 10, 10, 1, C.ink); PX.pts(g, [[x + 5, y + 2], [x + 3, y + 5], [x + 8, y + 4]], C.greenL);
        break;
      case 'pecera': {
        PX.layer(g, l => { PX.disc(l, x + 8, y + 9, 7, C.cyanL); PX.rect(l, x + 4, y + 1, 8, 2, C.cyanL); });
        PX.ell(g, x + 8, y + 11, 6, 3.5, C.cyan);
        const fx = x + 8 + Math.round(Math.sin(t) * 3), fd = Math.cos(t) > 0 ? 1 : -1;
        PX.pts(g, [[0, 0], [1, 0], [-1, 0], [0, -1], [0, 1], [-2 * fd, -1], [-2 * fd, 1]], C.orange, fx, y + 10);
        PX.pts(g, [[x + 3, y + 5], [x + 3, y + 6]], C.white);
        break;
      }
      case 'lavaLamp': {
        PX.layer(g, l => { PX.poly(l, [[x + 2, y + 2], [x + 6, y + 2], [x + 8, y + 13], [x, y + 13]], C.fuchsiaL); PX.rect(l, x, y + 13, 8, 5, C.ink3); PX.rect(l, x + 2, y, 4, 2, C.ink3); });
        PX.disc(g, x + 4, y + 5 + Math.sin(t) * 2, 1.4, C.orange); PX.disc(g, x + 4, y + 10 - Math.sin(t * 0.7) * 2, 1.8, C.orange);
        break;
      }
      case 'alfombraRosa': case 'alfombraLila': {
        const [c1, c2] = RUGS[id], cx = x + 22, cy = y + 9;
        PX.layer(g, l => PX.ell(l, cx, cy, 21, 8, c1));
        PX.ell(g, cx, cy, 17, 5.5, c2); PX.ell(g, cx, cy, 16, 4.5, c1);
        break;
      }
      default: g.drawImage(Sprites.canvas(d.it.icon), x, y);
    }
  },
  drawSelection(g, d) {
    const on = Math.floor(this.t * 4) % 2;
    const x0 = d.x - 2, y0 = d.y - 2, w = d.it.w + 4, h = d.it.h + 4;
    for (let i = 0; i < w; i++) if ((i + on) % 2) { PX.px(g, x0 + i, y0, C.blueM); PX.px(g, x0 + i, y0 + h - 1, C.blueM); }
    for (let i = 0; i < h; i++) if ((i + on) % 2) { PX.px(g, x0, y0 + i, C.blueM); PX.px(g, x0 + w - 1, y0 + i, C.blueM); }
  },

  draw() {
    const g = this.g, s = Store.s, room = this.room, p = this.pet;
    if (this.scrub) { this.drawScrub(g); return; }
    const key = room + (s.floors[room] || '') + this.ui.fridgeOpen + this.ui.curtain + (room === 'dormitorio' ? new Date().getHours() : '');
    if (key !== this.bgKey) { const L = PX.make(SW, SH); BG_FLOOR = s.floors[room] || null; BG[room](L.g, s, this.ui); BG_FLOOR = null; this.bg = L.c; this.bgKey = key; }
    g.clearRect(0, 0, SW, SH);
    g.drawImage(this.bg, 0, 0);
    const asleep = s.pet.asleep;
    const px = Math.round(p.x), py = Math.round(p.y);
    // decoración: alfombras, pared y objetos de suelo que quedan detrás de la mascota
    const decor = room === 'arcade' ? [] : this.roomDecor(room);
    const petBase = py + 14;
    const front = [];
    for (const d of decor) {
      if (d.it.mount === 'floor' && d.y + d.it.h > petBase) front.push(d); else this.drawDecor(g, d);
    }

    if (room === 'sala') {
      if (s.pet.poop) g.drawImage(Sprites.canvas('poop'), 10, 72);
      const b = this.ball;
      PX.ell(g, b.x, b.y + 4, 4, 1.4, 'rgba(39,39,39,.18)');
      if (b.y < p.y + 10) drawBall(g, Math.round(b.x), Math.round(b.y - b.z), s.equipped.pelota, b.spin);
      if (!asleep) drawPet(g, px, py, this.petOpts());
      if (b.y >= p.y + 10) drawBall(g, Math.round(b.x), Math.round(b.y - b.z), s.equipped.pelota, b.spin);
    } else if (room === 'cocina') {
      if (this.eating) {
        const k = Math.min(1, (this.t - this.eating.t0) / 2.2), w = Math.max(0, Math.round(16 * (1 - Math.floor(k * 4) / 4)));
        if (w > 0) g.drawImage(Sprites.canvas(this.eating.food), 0, 0, w, 16, 29, 59, w, 16);
      }
      if (!asleep) drawPet(g, px, py, this.petOpts());
    } else if (room === 'bano') {
      const hop = this.t < this.duckHop ? -Math.round(Math.sin((this.duckHop - this.t) / 0.5 * Math.PI) * 4) : 0;
      PX.layer(g, l => { PX.ell(l, 15, 52 + hop, 5, 3, C.yellow); PX.disc(l, 12, 47 + hop, 3, C.yellow); PX.rect(l, 7, 47 + hop, 3, 2, C.orange); });
      PX.px(g, 12, 46 + hop, C.ink); PX.pts(g, [[16, 51], [17, 51]], C.coinD, 0, hop);
      if (!asleep && !p.hidden) drawPet(g, px, py, this.petOpts());
      if (this.bathing) { PX.ell(g, 28, 46, 14, 3, 'rgba(255,255,255,.7)'); }
    } else if (room === 'dormitorio') {
      if (asleep) {
        drawPet(g, 48, 24, this.petOpts({ expr: 'sleep', still: true, moving: false, dir: 1 }));
      }
      // manta
      PX.orect(g, 37, 33, 24, 24, C.red); PX.rect(g, 37, 33, 24, 3, C.white); PX.rect(g, 37, 36, 24, 1, C.ink);
      PX.rect(g, 39, 38, 3, 1, C.redL);
      if (!asleep && !p.hidden) drawPet(g, px, py, this.petOpts());
      if (!this.ui.light) { g.fillStyle = 'rgba(18,18,49,.45)'; g.fillRect(0, 0, SW, SH); PX.disc(g, 17, 24, 3, 'rgba(255,233,54,.5)'); }
      if (asleep) {
        const z = (this.t * 0.8) % 1, zc = this.ui.light ? C.ink : C.white;
        PX.text(g, 'Z', 56, 12 - z * 8, zc, 2); PX.text(g, 'Z', 64, 6 - ((z + 0.5) % 1) * 5, zc);
      }
    } else if (room === 'arcade') {
      for (let i = 0; i < 4; i++) {
        const mx = 4 + i * 23 + 3, my = 16 + 9, blink = Math.floor(this.t * 2 + i) % 2;
        if (i === 0) { PX.map(g, ['..w..', '.wbw.', 'wwwww', 'r.w.r'], { w: C.white, b: C.cyan, r: C.red }, mx + 4, my + 4); if (blink) PX.pts(g, [[2, 1], [10, 2], [6, 0]], C.fuchsiaL, mx, my); }
        if (i === 1) { PX.rect(g, mx + 3, my + 2, 2, 2, C.purple); PX.rect(g, mx + 5, my + 2, 2, 2, C.purple); PX.rect(g, mx + 7, my + 2, 2, 2, C.purple); PX.rect(g, mx + 5, my + 4 + (blink ? 1 : 0), 2, 2, C.purple); PX.rect(g, mx + 2, my + 7, 9, 2, C.cyan); }
        if (i >= 2) { PX.text(g, '?', mx + 5, my + 2, blink ? C.yellow : C.g5); }
      }
      if (!asleep) drawPet(g, px, py, this.petOpts());
      else PX.textC(g, 'ZZZ...', 48, 76, C.white);
      PX.textC(g, 'ELIGE UN JUEGO', 48, 88, C.white);
    }

    for (const d of front) this.drawDecor(g, d);
    if (this.edit && this.edit.sel) { const d = decor.find(x => x.uid === this.edit.sel); if (d) this.drawSelection(g, d); }

    // bocadillos
    if (!asleep && !p.hidden && room !== 'arcade' && !this.edit) {
      const tb = this.tempBubble && this.t < this.tempBubble.until ? this.tempBubble : null;
      const nb = tb ? [tb.icon, tb.thought] : (!this.locked ? this.needBubble() : null);
      if (nb) drawBubble(g, Math.min(SW - 22, px + 4), Math.max(0, py - 32), nb[0], nb[1]);
      if (this.t < this.hand) g.drawImage(Sprites.canvas('hand'), px - 12 + Math.round(Math.sin(this.t * 20) * 2), py - 2);
    }
    for (const f of this.fx) {
      const fade = 1 - f.life / f.max;
      g.globalAlpha = Math.max(0, fade);
      if (f.kind === 'heart') g.drawImage(Sprites.canvas('heartS'), Math.round(f.x), Math.round(f.y));
      else if (f.kind === 'spark') g.drawImage(Sprites.canvas('sparkle'), Math.round(f.x), Math.round(f.y));
      else if (f.kind === 'drop') PX.rect(g, f.x, f.y, 1, 2, C.blueM);
      g.globalAlpha = 1;
    }
  },
};
