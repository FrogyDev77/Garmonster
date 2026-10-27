// Minijuego "Bloques": tablero de 10x20 con piezas que caen.
// Teclado: ← → mover, ↑ o X rotar, ↓ bajar rápido, Espacio caída instantánea.
const TetrisGame = (() => {
  const COLS = 10, ROWS = 20, CS = 5, OX = 3, OY = 3, W = 96, H = 106;
  const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  };
  const COLORS = { I: C.cyan, O: C.yellow, T: C.purple, S: C.green, Z: '#FA4B4B', J: C.blueM, L: C.orange };
  const LINE_SCORE = [0, 40, 100, 300, 1200];
  let g, c, api, st, raf, last, bag = [];

  const nextType = () => { if (!bag.length) bag = Object.keys(SHAPES).sort(() => Math.random() - 0.5); return bag.pop(); };
  const rotate = m => m[0].map((_, i) => m.map(r => r[i]).reverse());
  function collide(m, x, y) {
    for (let r = 0; r < m.length; r++) for (let k = 0; k < m[r].length; k++) {
      if (!m[r][k]) continue;
      const bx = x + k, by = y + r;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && st.board[by][bx]) return true;
    }
    return false;
  }
  function spawn() {
    const type = st.next; st.next = nextType();
    const m = SHAPES[type].map(r => r.slice());
    st.p = { type, m, x: Math.floor((COLS - m[0].length) / 2), y: type === 'I' ? -1 : 0 };
    if (collide(st.p.m, st.p.x, st.p.y)) gameOver();
  }
  function lock() {
    const p = st.p;
    p.m.forEach((row, r) => row.forEach((v, k) => { if (v && p.y + r >= 0) st.board[p.y + r][p.x + k] = p.type; }));
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (st.board[r].every(Boolean)) { st.board.splice(r, 1); st.board.unshift(Array(COLS).fill(null)); cleared++; r++; }
    }
    if (cleared) {
      st.lines += cleared; st.score += LINE_SCORE[cleared] * (st.level + 1);
      st.level = Math.floor(st.lines / 8); st.flash = 0.25; Sound.play('line');
    } else Sound.play('land');
    spawn();
  }
  function move(dx) { if (st.over) return; if (!collide(st.p.m, st.p.x + dx, st.p.y)) { st.p.x += dx; Sound.play('move'); } }
  function rot() {
    if (st.over) return;
    const m = rotate(st.p.m);
    for (const kick of [0, -1, 1, -2, 2]) if (!collide(m, st.p.x + kick, st.p.y)) { st.p.m = m; st.p.x += kick; Sound.play('rotate'); return; }
  }
  function soft() { if (st.over) return; if (!collide(st.p.m, st.p.x, st.p.y + 1)) { st.p.y++; st.score += 1; st.acc = 0; } else lock(); }
  function hard() { if (st.over) return; let n = 0; while (!collide(st.p.m, st.p.x, st.p.y + 1)) { st.p.y++; n++; } st.score += n * 2; lock(); }
  function gameOver() {
    if (st.over) return;
    st.over = true; Sound.play('lose');
    setTimeout(() => api.end({ score: st.score, coins: Math.min(40, st.lines * 2 + Math.floor(st.score / 300)), detail: `Líneas: ${st.lines}. Nivel: ${st.level + 1}.` }), 700);
  }

  function update(dt) {
    if (st.over) return;
    const speed = Math.max(0.08, 0.7 - st.level * 0.06);
    st.acc += dt;
    if (st.hold.down) st.acc += dt * 8;
    for (const k of ['left', 'right']) {
      if (st.hold[k]) { st.rep[k] -= dt; if (st.rep[k] <= 0) { move(k === 'left' ? -1 : 1); st.rep[k] = 0.09; } }
    }
    if (st.acc >= speed) { st.acc = 0; if (!collide(st.p.m, st.p.x, st.p.y + 1)) st.p.y++; else lock(); }
    st.flash = Math.max(0, st.flash - dt);
    api.hud(`<span>Puntos ${st.score}</span><span>Líneas ${st.lines}</span><span>Nivel ${st.level + 1}</span>`);
  }
  function cell(x, y, col) {
    PX.rect(g, x, y, CS, CS, col); PX.rect(g, x, y + CS - 1, CS, 1, 'rgba(0,0,0,.25)'); PX.rect(g, x + CS - 1, y, 1, CS, 'rgba(0,0,0,.25)'); PX.px(g, x + 1, y + 1, 'rgba(255,255,255,.7)');
  }
  function draw() {
    PX.rect(g, 0, 0, W, H, C.nightD);
    PX.orect(g, OX, OY, COLS * CS, ROWS * CS, st.flash > 0 ? C.night : C.nightDD, C.fuchsia);
    for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) if (st.board[r][k]) cell(OX + k * CS, OY + r * CS, COLORS[st.board[r][k]]);
    if (!st.over) {
      let gy = st.p.y; while (!collide(st.p.m, st.p.x, gy + 1)) gy++;
      st.p.m.forEach((row, r) => row.forEach((v, k) => { if (v && gy + r >= 0) { PX.rect(g, OX + (st.p.x + k) * CS, OY + (gy + r) * CS, CS, CS, 'rgba(255,255,255,.12)'); } }));
      st.p.m.forEach((row, r) => row.forEach((v, k) => { if (v && st.p.y + r >= 0) cell(OX + (st.p.x + k) * CS, OY + (st.p.y + r) * CS, COLORS[st.p.type]); }));
    }
    const sx = 59;
    PX.text(g, 'SIGUE', sx, 4, C.fuchsiaL);
    PX.orect(g, sx, 11, 32, 22, C.nightDD, C.indigo);
    const nm = SHAPES[st.next];
    nm.forEach((row, r) => row.forEach((v, k) => { if (v) cell(sx + 4 + k * CS, 14 + r * CS + (st.next === 'I' ? -2 : 2), COLORS[st.next]); }));
    PX.text(g, 'PUNTOS', sx, 40, C.fuchsiaL); PX.text(g, String(st.score), sx, 47, C.white);
    PX.text(g, 'LINEAS', sx, 58, C.fuchsiaL); PX.text(g, String(st.lines), sx, 65, C.white);
    PX.text(g, 'NIVEL', sx, 76, C.fuchsiaL); PX.text(g, String(st.level + 1), sx, 83, C.white);
    PX.text(g, 'RECORD', sx, 94, C.cyanL); PX.text(g, String(Math.max(Store.s.best.bloques, st.score)), sx, 100, C.white);
  }
  function loop(ts) { const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000 || 0)); last = ts; update(dt); draw(); raf = requestAnimationFrame(loop); }
  const keys = e => {
    if (e.type !== 'keydown') { if (e.key === 'ArrowDown') st.hold.down = false; return; }
    const map = { ArrowLeft: () => move(-1), ArrowRight: () => move(1), ArrowUp: rot, x: rot, X: rot, ' ': hard, ArrowDown: () => { st.hold.down = true; } };
    if (map[e.key]) { e.preventDefault(); map[e.key](); }
  };
  return {
    start(canvas, _api) {
      c = canvas; api = _api; c.width = W; c.height = H; g = c.getContext('2d'); bag = [];
      st = { board: Array.from({ length: ROWS }, () => Array(COLS).fill(null)), score: 0, lines: 0, level: 0, acc: 0, flash: 0, over: false, next: nextType(), hold: { left: false, right: false, down: false }, rep: { left: 0, right: 0 } };
      spawn();
      const rep = k => v => { st.hold[k] = v; if (v) { move(k === 'left' ? -1 : 1); st.rep[k] = 0.22; } };
      api.controls([
        { icon: 'padL', hold: rep('left') },
        { icon: 'padRot', tap: rot },
        { icon: 'padD', hold: v => { st.hold.down = v; } },
        { icon: 'padDrop', tap: hard, big: true },
        { icon: 'padR', hold: rep('right') },
      ]);
      window.addEventListener('keydown', keys); window.addEventListener('keyup', keys);
      last = performance.now(); raf = requestAnimationFrame(loop);
    },
    stop() { cancelAnimationFrame(raf); window.removeEventListener('keydown', keys); window.removeEventListener('keyup', keys); },
  };
})();
