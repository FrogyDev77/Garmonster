// Dibujo de la mascota, el huevo, los bocadillos y las pelotas.
// La mascota se dibuja por segmentos (cabeza + cuerpo) para poder animarla.

const PET_LAYOUT = {
  5: [[-1, 9, 6], [5, 12, 5.5], [11, 10, 4], [15, 6.5, 3], [17.5, 3, 2.5]],
  4: [[-1, 9, 6], [5, 12, 5.5], [11, 9.5, 4], [14.5, 5.5, 2.8]],
  3: [[-1, 9, 6], [5, 11.5, 5], [10, 8, 3.2]],
};
const PET_COLOR_IDX = { 5: [0, 1, 2, 3, 4], 4: [0, 1, 2, 4], 3: [0, 1, 4] };
const DIRT_SPOTS = [[-4, 3], [4, 4], [-3, 10], [2, 8], [5, 14], [11, 11], [-5, -3]];

// Caras: listas de píxeles relativas al centro de la cabeza.
const FACES = {
  happy: { ink: [[-3, -2], [-3, -1], [3, -2], [3, -1], [-2, 1], [-1, 2], [0, 2], [1, 2], [2, 1]], blush: [[-5, 1], [5, 1]] },
  sad:   { ink: [[-3, -2], [-3, -1], [3, -2], [3, -1], [-2, 3], [-1, 2], [0, 2], [1, 2], [2, 3], [-4, -4], [-3, -4], [3, -4], [4, -4]] },
  love:  { ink: [[-4, -1], [-3, -2], [-2, -1], [2, -1], [3, -2], [4, -1], [-2, 1], [2, 1], [-1, 2], [0, 2], [1, 2]], red: [[-1, 1], [0, 1], [1, 1]], blush: [[-5, 1], [5, 1]] },
  eatA:  { ink: [[-4, -1], [-3, -2], [-2, -1], [2, -1], [3, -2], [4, -1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [-2, 2], [2, 2], [-2, 3], [-1, 3], [0, 3], [1, 3], [2, 3]], red: [[-1, 2], [0, 2], [1, 2]] },
  eatB:  { ink: [[-4, -1], [-3, -2], [-2, -1], [2, -1], [3, -2], [4, -1], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2]], blush: [[-5, 1], [5, 1]] },
  sleep: { ink: [[-4, 0], [-3, 0], [-2, 0], [2, 0], [3, 0], [4, 0], [0, 2], [-1, 3], [1, 3], [0, 4]] },
  strain:{ ink: [[-4, -2], [-3, -1], [-4, 0], [4, -2], [3, -1], [4, 0], [-2, 3], [-1, 2], [0, 3], [1, 2], [2, 3]], sweat: [[6, -6], [6, -5], [5, -5], [7, -5], [6, -4]] },
  blink: { ink: [[-4, -1], [-3, -1], [3, -1], [4, -1], [-2, 1], [-1, 2], [0, 2], [1, 2], [2, 1]] },
  wow:   { ink: [[-3, -2], [-3, -1], [3, -2], [3, -1], [0, 1], [-1, 2], [1, 2], [0, 3]] },
};

function drawPet(g, x, y, o = {}) {
  const sp = SPECIES[o.species] || SPECIES.oruga;
  const body = STAGE_BODY[o.stage] || STAGE_BODY.nino;
  const mult = o.scale || 1;
  const k = body.scale * mult;
  const f = Math.max(1, Math.round(mult));        // tamaño de cada "píxel" de la cara
  const dir = o.dir === -1 ? -1 : 1;
  const t = o.t || 0;
  const amp = (o.moving ? 1.2 : 0.6) * mult;
  const n = body.segs;
  const lay = PET_LAYOUT[n], idx = PET_COLOR_IDX[n];
  const hx = x + 0.5, hy = y + 0.5;
  const P = (dx, dy, col) => PX.rect(g, x + dx * f * dir, y + dy * f, f, f, col);
  const line = mult >= 2 ? f : 1;
  const odisc = (cx, cy, r, fill) => { PX.disc(g, cx, cy, r + line, C.ink); PX.disc(g, cx, cy, r, fill); };

  // cuerpo: de la cola hacia la cabeza
  for (let i = n - 1; i >= 0; i--) {
    const [ox, oy, r] = lay[i];
    const wig = o.still ? 0 : Math.round(Math.sin(t * 6 - i * 0.9) * amp);
    odisc(hx + ox * k * dir, hy + oy * k + wig, r * k, sp.segs[idx[i]]);
    PX.disc(g, hx + (ox - r * 0.35) * k * dir, hy + (oy - r * 0.4) * k + wig, Math.max(0.6, r * k * 0.22), 'rgba(255,255,255,.55)');
  }
  // antenas
  const bob = o.still ? 0 : Math.round(Math.sin(t * 6 + 1) * 0.5 * mult);
  const ant = [[3, 7], [4, 8], [5, 9], [6, 9], [7, 9]];
  for (const s of [-1, 1]) {
    for (const [ax, ay] of ant) PX.rect(g, hx + s * ax * k - line / 2, hy - ay * k + bob, line, line, C.ink);
    PX.disc(g, hx + s * 8.2 * k, hy - 9 * k + bob, 1.4 * k, C.ink);
  }
  // cabeza
  const hr = 8 * k;
  odisc(hx, hy + bob, hr, sp.head);
  PX.disc(g, hx - hr * 0.42 * dir, hy - hr * 0.42 + bob, Math.max(1, hr * 0.22), sp.headL);
  // suciedad visible
  const spots = Math.min(DIRT_SPOTS.length, Math.ceil((o.dirt || 0) / 15) - 2);
  for (let i = 0; i < spots; i++) {
    const [dx, dy] = DIRT_SPOTS[i];
    PX.disc(g, hx + dx * k * dir, hy + dy * k, 1.8 * k, C.brown);
    PX.disc(g, hx + (dx - 0.6) * k * dir, hy + (dy - 0.6) * k, 0.8 * k, C.woodM);
  }
  // cara
  const yy = y + bob;
  const face = FACES[o.expr] || FACES.happy;
  const Pf = (dx, dy, col) => PX.rect(g, x + dx * f * dir + (dir === -1 ? 0 : 0), yy + dy * f, f, f, col);
  (face.blush || []).forEach(([a, b]) => Pf(a, b, C.pink));
  (face.ink || []).forEach(([a, b]) => Pf(a, b, C.ink));
  (face.red || []).forEach(([a, b]) => Pf(a, b, C.red));
  (face.sweat || []).forEach(([a, b]) => Pf(a, b, C.cyan));

  // accesorios equipados
  const eq = o.equipped || {};
  if (eq.cara === 'gafas' && o.expr !== 'sleep') {
    for (const s of [-1, 1]) { for (let a = 2; a <= 5; a++) for (let b = -3; b <= -1; b++) Pf(s * a, b, C.ink2); Pf(s * 3, -3, C.cyan); }
    Pf(-1, -2, C.ink2); Pf(0, -2, C.ink2); Pf(1, -2, C.ink2);
  }
  const top = hy + bob - hr;
  if (eq.cabeza === 'gorro') {
    PX.disc(g, hx, top + 2 * k, 4.5 * k + line, C.ink);
    PX.disc(g, hx, top + 2 * k, 4.5 * k, (px) => { const d = (px + 0.5 - hx) / k; return d < -1.5 ? C.red : d < 1.5 ? C.blueM : C.yellow; });
    PX.rect(g, hx - 6 * k, top + 2 * k, 12 * k, 2 * k, C.coin);
    PX.rect(g, hx - 0.5 * k, top - 4 * k, 1 * k + 1, 2.5 * k, C.g7);
    const w = (Math.floor(t * 8) % 2 ? 7 : 3) * k;
    PX.rect(g, hx - w / 2, top - 5 * k, w, 1.5 * k, C.purple);
  } else if (eq.cabeza === 'lazo') {
    const bx = hx + 5 * k * dir, by = top + 3 * k;
    PX.poly(g, [[bx, by], [bx - 4 * k, by - 3 * k], [bx - 4 * k, by + 3 * k]], C.pinkD);
    PX.poly(g, [[bx, by], [bx + 4 * k, by - 3 * k], [bx + 4 * k, by + 3 * k]], C.pinkD);
    PX.disc(g, bx, by, 1.4 * k, C.pink);
  } else if (eq.cabeza === 'corona') {
    PX.poly(g, [[hx - 5 * k, top + 3 * k], [hx - 5 * k, top - 3 * k], [hx - 2.5 * k, top], [hx, top - 4 * k], [hx + 2.5 * k, top], [hx + 5 * k, top - 3 * k], [hx + 5 * k, top + 3 * k]], C.coin);
    PX.disc(g, hx, top + 1 * k, 1.1 * k, C.red);
  }
  if (o.sweat) PX.disc(g, hx + 9 * k * dir, hy - 5 * k, 1.5 * k, C.cyan);
}

// Bocadillo con icono (thought = nube de pensamiento).
function drawBubble(g, x, y, icon, thought = false) {
  x = Math.round(x); y = Math.round(y);
  if (thought) {
    PX.layer(g, l => { PX.ell(l, x + 10, y + 8, 10, 8, C.white); PX.disc(l, x + 1, y + 20, 1.5, C.white); PX.disc(l, x + 4, y + 17, 2, C.white); });
  } else {
    PX.layer(g, l => { PX.rect(l, x, y, 20, 17, C.white); PX.poly(l, [[x + 3, y + 16], [x + 9, y + 16], [x + 3, y + 21]], C.white); });
  }
  g.drawImage(Sprites.canvas(icon), x + 2, y + (thought ? 0 : 1));
}

function drawEgg(g, cx, cy, sp, cracks, t = 0) {
  sp = sp || SPECIES.oruga;
  PX.layer(g, l => PX.ell(l, cx, cy, 15, 19, sp.egg));
  PX.ell(g, cx, cy, 15, 19, (x, y) => {
    const s = [[-6, -8, 3], [6, -2, 4], [-4, 8, 3.5], [7, 11, 2.5], [-9, 1, 2]];
    for (const [dx, dy, r] of s) if (Math.hypot(x + .5 - cx - dx, y + .5 - cy - dy) < r) return sp.eggSpot;
    return undefined;
  });
  PX.ell(g, cx - 6, cy - 9, 3, 5, 'rgba(255,255,255,.6)');
  if (cracks >= 1) PX.map(g, ['k......', 'kk.....', '.k..k..', '.kkkkk.', '.....kk'], { k: C.ink }, Math.round(cx - 6), Math.round(cy - 6));
  if (cracks >= 2) {
    PX.map(g, ['.......k', '......kk', 'k....k..', 'kk..kk..', '.kkk....'], { k: C.ink }, Math.round(cx), Math.round(cy - 1));
    PX.line(g, cx - 12, cy + 2, cx - 7, cy + 5, C.ink);
  }
}

// Pelotas (la equipada cambia el aspecto).
function drawBall(g, x, y, skin, t = 0) {
  const cx = x + 0.5, cy = y + 0.5, r = 4.6;
  PX.disc(g, cx, cy, r + 1, C.ink);
  const ang = t;
  const col = (px, py) => {
    const dx = px + .5 - cx, dy = py + .5 - cy;
    const rx = dx * Math.cos(ang) - dy * Math.sin(ang), ry = dx * Math.sin(ang) + dy * Math.cos(ang);
    if (skin === 'pelotaPlaya') return [C.red, C.white, C.cyan][Math.floor((Math.atan2(ry, rx) + Math.PI) / (Math.PI / 3)) % 3];
    if (skin === 'pelotaTenis') return Math.abs(Math.abs(rx) - 2.6) < 0.7 ? C.white : '#C7F7A8';
    if (skin === 'estambre') return Math.abs((rx + ry) % 3) < 0.9 ? C.pinkD : C.pink;
    if (rx + ry > 1 && rx + ry < 3) return C.blueM;
    if (rx - ry > 1.5 && rx - ry < 3.5) return C.yellow;
    return C.white;
  };
  PX.disc(g, cx, cy, r, col);
  if (!skin) PX.pts(g, [[-2, -1], [1, -1], [-1, 1], [0, 1]], C.ink, x, y);
  PX.px(g, x - 2, y - 3, 'rgba(255,255,255,.8)');
}
