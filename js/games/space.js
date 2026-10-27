// Minijuego "Naves": inspirado en los matamarcianos de recreativa.
// Controles: flechas/A-D para moverse, Espacio para disparar.
// En pantalla táctil: botones o arrastrar el dedo sobre el lienzo (dispara solo).
const SpaceGame = (() => {
  const W = 120, H = 160;
  const SHIP = ['....w....', '...wcw...', '...www...', '.r.wcw.r.', 'rwwwwwwwr', 'ww.www.ww', 'w..o.o..w'];
  const BUG = [
    ['..x...x..', '...xxx...', '..xyxyx..', '.xxxxxxx.', 'x.x...x.x', 'x.......x'],
    ['..x...x..', 'x..xxx..x', 'x.xyxyx.x', '.xxxxxxx.', '..x...x..', '.x.....x.'],
  ];
  const BUG_COLORS = [C.fuchsia, C.yellow, C.cyan];
  let g, c, api, st, raf, last, input;

  function newState() {
    return {
      ship: { x: 56, inv: 0 }, lives: 3, score: 0, wave: 1, t: 0, over: false,
      bullets: [], eb: [], enemies: [], parts: [], form: { x: 0, dir: 1 }, fireCd: 0, diveAt: 2, msg: 'OLEADA 1', msgT: 1.6,
      stars: Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 10 + Math.random() * 30 })),
    };
  }
  function spawnWave() {
    st.enemies = [];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++)
      st.enemies.push({ hx: 15 + k * 17, hy: 18 + r * 13, x: 15 + k * 17, y: -20 - r * 10, type: r, mode: 'enter', t: 0, hp: r === 0 ? 2 : 1 });
  }
  function boom(x, y, col, n = 10) {
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 15 + Math.random() * 40; st.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.5 + Math.random() * 0.4, col }); }
  }
  function hitShip() {
    if (st.ship.inv > 0 || st.over) return;
    st.lives--; st.ship.inv = 2; boom(st.ship.x + 4, 150, C.orange, 18); Sound.play('hurt');
    if (st.lives <= 0) finish(false);
  }
  function finish(victory) {
    if (st.over) return;
    st.over = true;
    setTimeout(() => api.end({ score: st.score, victory, coins: Math.min(40, Math.floor(st.score / 40)), detail: victory ? '¡Superaste las cinco oleadas!' : `Llegaste a la oleada ${st.wave}.` }), 900);
  }

  function update(dt) {
    st.t += dt;
    for (const s of st.stars) { s.y += s.v * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
    if (st.msgT > 0) st.msgT -= dt;
    const sh = st.ship;
    if (!st.over) {
      let dir = (input.left ? -1 : 0) + (input.right ? 1 : 0);
      if (input.touchX !== null) { const d = input.touchX - (sh.x + 4); dir = Math.abs(d) < 2 ? 0 : Math.sign(d); }
      sh.x = Math.max(2, Math.min(W - 11, sh.x + dir * 75 * dt));
      sh.inv = Math.max(0, sh.inv - dt);
      st.fireCd -= dt;
      if ((input.fire || input.touchX !== null) && st.fireCd <= 0 && st.bullets.length < 3) {
        st.bullets.push({ x: sh.x + 4, y: 144 }); st.fireCd = 0.3; Sound.play('shoot');
      }
    }
    for (const b of st.bullets) b.y -= 150 * dt;
    st.bullets = st.bullets.filter(b => b.y > -4);
    for (const b of st.eb) { b.y += b.vy * dt; b.x += b.vx * dt; }
    st.eb = st.eb.filter(b => b.y < H + 4);

    // formación que se balancea
    const speed = 1 + st.wave * 0.18;
    st.form.x += st.form.dir * 9 * speed * dt;
    if (Math.abs(st.form.x) > 10) st.form.dir *= -1;
    st.diveAt -= dt;
    const inForm = st.enemies.filter(e => e.mode === 'form');
    if (st.diveAt <= 0 && inForm.length && !st.over) {
      const e = inForm[Math.floor(Math.random() * inForm.length)];
      Object.assign(e, { mode: 'dive', t: 0, sx: e.x, sy: e.y, tx: sh.x + 4, shot: false });
      st.diveAt = Math.max(0.6, 2.4 - st.wave * 0.3) * (0.6 + Math.random() * 0.8);
    }
    for (const e of st.enemies) {
      const fx = e.hx + st.form.x, fy = e.hy + Math.sin(st.t * 2 + e.hx) * 1;
      e.t += dt;
      if (e.mode === 'enter') { e.x += (fx - e.x) * Math.min(1, dt * 3); e.y += (fy - e.y) * Math.min(1, dt * 3); if (Math.abs(fy - e.y) < 1) e.mode = 'form'; }
      else if (e.mode === 'form') { e.x = fx; e.y = fy; if (!st.over && Math.random() < dt * (0.018 + st.wave * 0.01)) st.eb.push({ x: e.x, y: e.y + 4, vx: 0, vy: 55 + st.wave * 6 }); }
      else if (e.mode === 'dive') {
        e.y = e.sy + e.t * (50 + st.wave * 6);
        e.x = e.sx + (e.tx - e.sx) * Math.min(1, e.t / 1.6) + Math.sin(e.t * 4) * 18;
        if (!e.shot && e.y > 70) { e.shot = true; st.eb.push({ x: e.x, y: e.y + 4, vx: (sh.x + 4 - e.x) * 0.4, vy: 75 }); }
        if (e.y > H + 8) { e.y = -10; e.mode = 'return'; }
      } else if (e.mode === 'return') { e.x += (fx - e.x) * Math.min(1, dt * 2.5); e.y += (fy - e.y) * Math.min(1, dt * 2.5); if (Math.abs(fy - e.y) < 1) e.mode = 'form'; }
    }
    // impactos
    for (const b of st.bullets) for (const e of st.enemies) {
      if (!b.dead && !e.dead && Math.abs(b.x - e.x) < 5 && Math.abs(b.y - e.y) < 4) {
        b.dead = true; e.hp--;
        if (e.hp <= 0) { e.dead = true; st.score += (e.mode === 'dive' ? 30 : 10) * (e.type === 0 ? 2 : 1); boom(e.x, e.y, BUG_COLORS[e.type]); Sound.play('boom'); }
        else Sound.play('land');
      }
    }
    st.bullets = st.bullets.filter(b => !b.dead);
    st.enemies = st.enemies.filter(e => !e.dead);
    if (!st.over) {
      for (const b of st.eb) if (Math.abs(b.x - (sh.x + 4)) < 4 && b.y > 146 && b.y < 156) { b.y = H + 10; hitShip(); }
      for (const e of st.enemies) if (e.mode === 'dive' && Math.abs(e.x - (sh.x + 4)) < 7 && Math.abs(e.y - 150) < 6) { e.dead = true; boom(e.x, e.y, C.white); hitShip(); }
      st.enemies = st.enemies.filter(e => !e.dead);
      if (!st.enemies.length) {
        st.score += 100;
        if (st.wave >= 5) { Sound.play('win'); finish(true); }
        else { st.wave++; st.msg = 'OLEADA ' + st.wave; st.msgT = 1.6; st.eb = []; spawnWave(); }
      }
    }
    for (const p of st.parts) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    st.parts = st.parts.filter(p => p.life < p.max);
    api.hud(`<span>Puntos ${st.score}</span><span>Oleada ${st.wave}/5</span><span>Vidas ${'I'.repeat(Math.max(0, st.lives))}</span>`);
  }

  function draw() {
    PX.rect(g, 0, 0, W, H, C.nightDD);
    for (const s of st.stars) PX.px(g, s.x, s.y, s.v > 30 ? C.white : C.indigo);
    const fr = Math.abs(Math.floor(st.t * 3)) % 2;
    for (const e of st.enemies) PX.map(g, BUG[fr], { x: BUG_COLORS[e.type], y: C.ink }, Math.round(e.x - 4), Math.round(e.y - 3));
    for (const b of st.bullets) PX.rect(g, b.x, b.y, 1, 4, C.yellow);
    for (const b of st.eb) { PX.rect(g, b.x - 1, b.y, 2, 3, C.red); PX.px(g, b.x - 1, b.y, C.redL); }
    if (!st.over && (st.ship.inv <= 0 || Math.floor(st.t * 10) % 2)) {
      PX.map(g, SHIP, { w: C.white, c: C.cyan, r: C.red, o: Math.floor(st.t * 12) % 2 ? C.orange : C.yellow }, Math.round(st.ship.x), 146);
    }
    for (const p of st.parts) PX.px(g, p.x, p.y, p.col);
    if (st.msgT > 0) PX.textC(g, st.msg, W / 2, 70, C.fuchsiaL, 2);
  }
  function loop(ts) {
    const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000 || 0)); last = ts;
    update(dt); draw();
    raf = requestAnimationFrame(loop);
  }
  const keys = e => {
    const down = e.type === 'keydown';
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) input.left = down;
    else if (['ArrowRight', 'd', 'D'].includes(e.key)) input.right = down;
    else if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) input.fire = down;
    else return;
    e.preventDefault();
  };
  function toX(e) { const r = c.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; }
  const pd = e => { input.touchX = toX(e); try { c.setPointerCapture(e.pointerId); } catch (_) {} };
  const pm = e => { if (input.touchX !== null) input.touchX = toX(e); };
  const pu = () => { input.touchX = null; };

  return {
    start(canvas, _api) {
      c = canvas; api = _api; c.width = W; c.height = H; g = c.getContext('2d');
      input = { left: false, right: false, fire: false, touchX: null };
      st = newState(); spawnWave();
      api.controls([
        { icon: 'padL', hold: v => input.left = v },
        { icon: 'padFire', big: true, hold: v => input.fire = v },
        { icon: 'padR', hold: v => input.right = v },
      ]);
      window.addEventListener('keydown', keys); window.addEventListener('keyup', keys);
      c.addEventListener('pointerdown', pd); c.addEventListener('pointermove', pm); c.addEventListener('pointerup', pu); c.addEventListener('pointercancel', pu);
      last = performance.now(); raf = requestAnimationFrame(loop);
    },
    stop() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', keys); window.removeEventListener('keyup', keys);
      if (c) { c.removeEventListener('pointerdown', pd); c.removeEventListener('pointermove', pm); c.removeEventListener('pointerup', pu); c.removeEventListener('pointercancel', pu); }
    },
  };
})();
