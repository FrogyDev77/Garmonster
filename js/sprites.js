// Iconos pixel art del juego (16x16). Se dibujan por código y se guardan en
// caché como imágenes. Para sustituir uno por un sprite dibujado a mano, basta
// con cambiar su función de dibujo o cargar un PNG con el mismo nombre.
const Sprites = (() => {
  const defs = {}, cache = {};
  const def = (name, fn, w = 16, h = 16) => { defs[name] = { w, h, fn }; };
  function canvas(name) {
    if (cache[name]) return cache[name];
    const d = defs[name] || defs.missing;
    const L = PX.make(d.w, d.h);
    d.fn(L.g);
    cache[name] = L.c;
    return L.c;
  }
  function url(name) { const c = canvas(name); return c._url || (c._url = c.toDataURL()); }
  function ico(name, cls = '') { return `<span class="ico ${cls}" style="background-image:url(${url(name)})"></span>`; }
  // Pinta todos los elementos <span class="ico" data-icon="..."> de un contenedor.
  function paint(root = document) {
    root.querySelectorAll('[data-icon]').forEach(el => { el.style.backgroundImage = `url(${url(el.dataset.icon)})`; });
  }
  return { def, canvas, url, ico, paint, defs };
})();

(() => {
  const { def } = Sprites;
  const L = (g, fn, col) => PX.layer(g, fn, col);

  def('missing', g => { PX.rect(g, 2, 2, 12, 12, C.pink); });

  // ---------- Interfaz ----------
  def('coin', g => {
    L(g, l => PX.disc(l, 8, 8, 6.6, C.coin), C.coinDD);
    PX.disc(g, 8, 8, 4.7, C.coinD); PX.disc(g, 8, 8, 3.7, C.coin);
    PX.map(g, ['..d..', '.ddd.', 'ddddd', '.d.d.'], { d: C.coinD }, 6, 6);
    PX.pts(g, [[4, 6], [5, 5], [6, 4]], C.coinL);
  });
  def('shop', g => {
    L(g, l => {
      PX.rect(l, 3, 7, 10, 7, C.cream);
      for (let i = 0; i < 6; i++) PX.rect(l, 2 + i * 2, 2, 2, 5, i % 2 ? C.white : C.greenM);
    });
    PX.rect(g, 2, 7, 12, 1, C.ink);
    PX.rect(g, 6, 9, 4, 5, C.greenM); PX.rect(g, 7, 10, 1, 4, C.green);
  });
  def('rocket', g => {
    L(g, l => {
      PX.poly(l, [[5, 6], [1, 11], [1, 14], [5, 12]], C.blueM);
      PX.poly(l, [[11, 6], [15, 11], [15, 14], [11, 12]], C.blueM);
      PX.poly(l, [[8, 0.5], [11, 6], [11, 13], [5, 13], [5, 6]], C.white);
    });
    PX.disc(g, 8, 7, 1.6, C.cyan); PX.px(g, 7, 6, C.white);
    PX.rect(g, 7, 2, 2, 1, C.red);
    PX.rect(g, 6, 14, 4, 1, C.orange); PX.rect(g, 7, 15, 2, 1, C.red);
  });
  def('house', g => {
    L(g, l => { PX.rect(l, 3, 7, 10, 7, C.cream); PX.poly(l, [[8, 1], [15.5, 8.5], [0.5, 8.5]], C.orange); }, C.brownDD);
    PX.rect(g, 2, 8, 12, 1, C.brownDD);
    PX.rect(g, 6, 9, 4, 5, C.orangeD); PX.px(g, 9, 11, C.coin);
  });
  def('cup', g => {
    L(g, l => {
      PX.rect(l, 2, 6, 9, 8, C.brown);
      PX.rect(l, 11, 8, 3, 1, C.brown); PX.rect(l, 13, 8, 1, 4, C.brown); PX.rect(l, 11, 11, 3, 1, C.brown);
    });
    PX.rect(g, 2, 6, 9, 2, C.cream); PX.rect(g, 4, 9, 1, 3, C.brownD);
    PX.pts(g, [[5, 1], [6, 2], [5, 3], [8, 2], [9, 3], [8, 4]], C.ink3);
  });
  def('drop', g => {
    L(g, l => { PX.disc(l, 8, 10, 4.8, C.blue); PX.poly(l, [[8, 1], [12.6, 9], [3.4, 9]], C.blue); }, C.blueD);
    PX.pts(g, [[6, 9], [10, 9], [7, 12], [8, 11], [9, 12]], C.ink);
    PX.pts(g, [[5, 7], [5, 8], [6, 5]], C.blueL);
  });
  def('moon', g => {
    L(g, l => {
      PX.disc(l, 8, 7.5, 6.5, C.blue); PX.disc(l, 11, 5, 4.8, null);
      PX.disc(l, 5, 12.5, 2.6, C.white); PX.disc(l, 8.5, 12.8, 2.3, C.white);
    }, C.blueD);
    PX.pts(g, [[4, 7], [5, 9], [6, 9]], C.ink);
  });
  def('close', g => {
    for (let i = 0; i < 9; i++) { PX.rect(g, 3 + i, 3 + i, 2, 2, C.white); PX.rect(g, 11 - i, 3 + i, 2, 2, C.white); }
  });
  const arrow = (flip) => g => {
    const rows = ['......xx', '.....xx.', '....xx..', '...xx...', '...xx...', '....xx..', '.....xx.', '......xx'];
    PX.map(g, rows.map(r => r.replace(/x/g, 'k')), { k: C.ink }, flip ? 4 : 3, 4, flip);
    PX.map(g, rows.map(r => r.replace(/x/g, 'k')), { k: C.ink }, flip ? 3 : 4, 4, flip);
  };
  def('arrowL', arrow(false));
  def('arrowR', arrow(true));
  def('arrowBack', g => {
    PX.rect(g, 3, 7, 11, 2, C.ink);
    PX.pts(g, [[4, 6], [5, 5], [6, 4], [4, 9], [5, 10], [6, 11], [5, 6], [5, 9], [3, 7], [3, 8], [2, 7], [2, 8]], C.ink);
  });
  // Controles de minijuegos
  def('padL', g => { PX.poly(g, [[3, 8], [11, 2], [11, 14]], C.night); });
  def('padR', g => { PX.poly(g, [[13, 8], [5, 2], [5, 14]], C.night); });
  def('padD', g => { PX.poly(g, [[8, 13], [2, 5], [14, 5]], C.night); });
  def('padDrop', g => { PX.poly(g, [[8, 11], [3, 4], [13, 4]], C.night); PX.rect(g, 3, 12, 10, 2, C.night); });
  def('padRot', g => {
    PX.disc(g, 8, 8, 6, C.night); PX.disc(g, 8, 8, 3.5, null);
    PX.rect(g, 8, 1, 7, 7, null); PX.poly(g, [[8, 0], [13, 4], [8, 8]], C.night);
  });
  def('padFire', g => { PX.disc(g, 8, 8, 6, C.red); PX.disc(g, 8, 8, 3.5, C.yellow); PX.disc(g, 7, 7, 1.5, C.white); });
  def('dice', g => {
    L(g, l => PX.rect(l, 2, 2, 12, 12, C.white));
    PX.rect(g, 4, 4, 3, 3, C.ink); PX.rect(g, 9, 9, 3, 3, C.ink);
  });

  // ---------- Categorías de tienda ----------
  def('hat', g => {
    L(g, l => {
      PX.disc(l, 8, 12, 6.2, (x) => x < 6 ? C.red : x < 10 ? C.blueM : C.yellow);
      PX.rect(l, 0, 12, 16, 4, null);
      PX.rect(l, 1, 12, 14, 2, C.coin);
      PX.rect(l, 3, 2, 10, 2, C.purple); PX.rect(l, 7, 4, 2, 2, C.g6);
    });
  });
  def('cake', g => {
    L(g, l => {
      PX.poly(l, [[1, 11], [15, 5], [15, 14], [1, 14]], C.woodXL);
      PX.poly(l, [[1, 11], [15, 5], [15, 8], [1, 13]], C.pink);
      PX.disc(l, 12, 3.5, 1.9, C.red);
    });
    PX.rect(g, 3, 13, 12, 1, C.orangeL); PX.px(g, 11, 2, C.white);
    PX.line(g, 12, 1, 13, 0, C.ink);
  });
  def('column', g => {
    L(g, l => { PX.rect(l, 2, 1, 12, 3, C.g2); PX.rect(l, 4, 4, 8, 9, C.g1); PX.rect(l, 2, 13, 12, 2, C.g2); });
    PX.rect(g, 6, 5, 1, 7, C.g5); PX.rect(g, 9, 5, 1, 7, C.g5);
    PX.rect(g, 2, 4, 12, 1, C.ink); PX.rect(g, 2, 12, 12, 1, C.ink);
  });
  def('cassette', g => {
    L(g, l => PX.rect(l, 1, 3, 14, 10, C.g4));
    PX.rect(g, 3, 4, 10, 4, C.white); PX.rect(g, 3, 5, 10, 1, C.red);
    PX.rect(g, 4, 9, 8, 3, C.ink3); PX.disc(g, 6, 10.5, 1.2, C.white); PX.disc(g, 10, 10.5, 1.2, C.white);
  });

  // ---------- Estados y reacciones ----------
  const heartRows = ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
  def('heart', g => { L(g, l => PX.map(l, heartRows, { r: C.orangeD }, 4, 5)); PX.px(g, 5, 6, C.orangeL); });
  def('heartS', g => { L(g, l => PX.map(l, heartRows, { r: C.red }, 1, 1)); PX.px(g, 2, 2, C.redL); }, 9, 8);
  def('poop', g => {
    L(g, l => { PX.ell(l, 8, 12, 6, 3, C.brown); PX.ell(l, 8, 8.5, 4.5, 2.6, C.brown); PX.ell(l, 8.5, 5.5, 2.8, 2, C.brown); PX.px(l, 10, 3, C.brown); });
    PX.pts(g, [[6, 11], [10, 11]], C.ink); PX.pts(g, [[7, 13], [8, 13], [9, 13]], C.ink);
    PX.pts(g, [[5, 8], [6, 5]], C.woodM);
  });
  def('toilet', g => {
    L(g, l => { PX.rect(l, 10, 2, 4, 9, C.white); PX.ell(l, 7, 9, 5.5, 2.5, C.white); PX.rect(l, 4, 10, 6, 5, C.white); });
    PX.ell(g, 7, 9, 3.5, 1.2, C.g3);
  });
  def('ball', g => {
    L(g, l => PX.disc(l, 8, 8, 6.5, C.white));
    PX.disc(g, 8, 8, 6.5, (x, y) => (x + y > 18 && x + y < 21) ? C.blueM : (x - y > 2 && x - y < 5) ? C.yellow : undefined);
    PX.pts(g, [[5, 7], [9, 7]], C.ink); PX.pts(g, [[6, 9], [7, 10], [8, 9]], C.ink);
  });
  def('sparkle', g => {
    PX.pts(g, [[3, 0], [3, 1], [3, 2], [3, 4], [3, 5], [3, 6], [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3]], C.coin);
    PX.px(g, 3, 3, C.white);
  }, 7, 7);
  def('hand', g => {
    L(g, l => {
      PX.rect(l, 3, 6, 9, 7, C.indigoL);
      for (let i = 0; i < 4; i++) PX.rect(l, 3 + i * 2 + (i > 1 ? 1 : 0), 1 + (i === 0 || i === 3 ? 2 : 0), 2, 6, C.indigoL);
      PX.rect(l, 0, 7, 4, 2, C.indigoL);
    });
  });

  // ---------- Comida ----------
  def('pan', g => {
    L(g, l => { PX.disc(l, 5, 6, 3.6, C.brown); PX.disc(l, 11, 6, 3.6, C.brown); PX.rect(l, 2, 6, 12, 8, C.brown); });
    PX.disc(g, 5, 6.5, 2.5, C.peachL); PX.disc(g, 10.5, 6.5, 2.5, C.peachL); PX.rect(g, 3, 7, 10, 6, C.peachL);
    PX.pts(g, [[6, 9], [10, 9]], C.ink); PX.pts(g, [[7, 11], [8, 11], [9, 11]], C.ink); PX.pts(g, [[5, 10], [11, 10]], C.pink);
  });
  def('onigiri', g => {
    L(g, l => { PX.disc(l, 8, 9.5, 5.6, C.white); PX.poly(l, [[8, 1.5], [14, 11], [2, 11]], C.white); PX.disc(l, 4, 11, 2.5, C.white); PX.disc(l, 12, 11, 2.5, C.white); });
    PX.rect(g, 5, 10, 6, 5, C.ink2);
    PX.pts(g, [[6, 7], [10, 7]], C.ink); PX.pts(g, [[7, 8], [8, 8], [9, 8]], C.ink); PX.pts(g, [[4, 8], [12, 8]], C.pink);
  });
  def('pizza', g => {
    L(g, l => { PX.poly(l, [[1, 4], [15, 2], [9, 15]], C.yellow); PX.poly(l, [[1, 2.5], [15, 0.5], [15.5, 3.5], [1, 5.5]], C.woodM); });
    PX.disc(g, 6, 6.5, 1.6, C.red); PX.disc(g, 11, 6, 1.4, C.red); PX.disc(g, 9, 10, 1.3, C.red);
    PX.pts(g, [[7, 9], [8, 8]], C.ink);
  });
  def('panqueques', g => {
    for (const y of [12, 9, 6]) PX.oell(g, 8, y, 6, 2, C.orangeL);
    PX.ell(g, 8, 5.5, 4.5, 1, C.wood);
    L(g, l => PX.rect(l, 7, 3, 3, 2, C.yellow));
    PX.pts(g, [[6, 9], [10, 9]], C.ink); PX.pts(g, [[7, 10], [8, 10], [9, 10]], C.ink);
  });
  def('sushi', g => {
    L(g, l => { PX.ell(l, 8, 11, 6.2, 3.2, C.white); PX.ell(l, 8, 7.5, 6.8, 3, C.orange); PX.disc(l, 6, 4, 1.4, C.red); PX.disc(l, 9, 3.6, 1.4, C.red); PX.disc(l, 11, 4.5, 1.2, C.red); });
    PX.ell(g, 8, 7.5, 6.8, 3, (x, y) => (x + y) % 3 === 0 ? C.orangeL : undefined);
    PX.pts(g, [[6, 11], [10, 11]], C.ink); PX.pts(g, [[7, 12], [8, 12], [9, 12]], C.ink);
  });
  def('te', g => {
    L(g, l => { PX.poly(l, [[3.5, 4], [12.5, 4], [11, 15], [5, 15]], C.woodM); PX.rect(l, 3, 3, 10, 2, C.white); PX.rect(l, 9, 0, 1, 3, C.ink3); });
    PX.pts(g, [[6, 13], [8, 13], [10, 13], [7, 12], [9, 12]], C.brownDD);
    PX.pts(g, [[6, 8], [10, 8]], C.ink); PX.pts(g, [[7, 9], [8, 9], [9, 9]], C.ink);
  });

  // ---------- Accesorios ----------
  def('bow', g => {
    L(g, l => { PX.poly(l, [[8, 8], [1, 3], [1, 13]], C.pink); PX.poly(l, [[8, 8], [15, 3], [15, 13]], C.pink); PX.rect(l, 6, 6, 4, 4, C.pinkD); });
    PX.pts(g, [[3, 6], [3, 7], [12, 6], [12, 7]], C.pink2);
  });
  def('glasses', g => {
    L(g, l => { PX.rect(l, 1, 5, 6, 5, C.ink2); PX.rect(l, 9, 5, 6, 5, C.ink2); PX.rect(l, 7, 6, 2, 1, C.ink2); });
    PX.pts(g, [[2, 6], [3, 6], [10, 6], [11, 6]], C.cyan);
  });
  def('crown', g => {
    L(g, l => PX.poly(l, [[1, 13], [1, 4], [5, 8], [8, 2], [11, 8], [15, 4], [15, 13]], C.coin), C.coinDD);
    PX.disc(g, 8, 10, 1.5, C.red); PX.disc(g, 4, 11, 1, C.cyan); PX.disc(g, 12, 11, 1, C.cyan);
  });

  // ---------- Decoración ----------
  def('starframe', g => {
    L(g, l => PX.rect(l, 2, 1, 12, 14, C.woodM));
    PX.rect(g, 4, 3, 8, 10, C.night);
    PX.pts(g, [[8, 5], [7, 6], [8, 6], [9, 6], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [7, 8], [8, 8], [9, 8], [7, 9], [9, 9]], C.yellow);
    PX.pts(g, [[5, 4], [10, 11]], C.white);
  });
  def('rugPink', g => { PX.oell(g, 8, 9, 6.5, 4.5, C.pink); PX.ell(g, 8, 9, 4.5, 2.6, C.pinkD); PX.ell(g, 8, 9, 3.6, 1.7, C.pink); });
  def('rugLilac', g => { PX.oell(g, 8, 9, 6.5, 4.5, C.purpleL); PX.ell(g, 8, 9, 4.5, 2.6, C.purple); PX.ell(g, 8, 9, 3.6, 1.7, C.purpleL); });
  def('plant', g => {
    L(g, l => {
      PX.disc(l, 5, 6, 3, C.green); PX.disc(l, 11, 6, 3, C.green); PX.disc(l, 8, 4, 3, C.green);
      PX.poly(l, [[3, 9], [13, 9], [12, 15], [4, 15]], C.coral);
    });
    PX.rect(g, 3, 9, 10, 1, C.ink); PX.pts(g, [[7, 3], [4, 5], [11, 5]], C.greenL);
  });
  def('clock', g => {
    L(g, l => PX.disc(l, 8, 8, 6.5, C.white));
    PX.disc(g, 8, 8, 6.5, (x, y) => { const d = Math.hypot(x + .5 - 8, y + .5 - 8); return d > 5.5 ? C.orange : undefined; });
    PX.rect(g, 8, 4, 1, 4, C.ink); PX.rect(g, 8, 8, 3, 1, C.ink);
  });
  def('lights', g => {
    PX.line(g, 0, 4, 5, 7, C.ink); PX.line(g, 5, 7, 10, 4, C.ink); PX.line(g, 10, 4, 15, 7, C.ink);
    [[2, 7, C.red], [7, 9, C.yellow], [12, 7, C.cyan]].forEach(([x, y, c]) => { PX.odisc(g, x + 0.5, y + 1.5, 1.6, c); });
  });
  def('fishbowl', g => {
    L(g, l => { PX.disc(l, 8, 9, 6.5, C.cyanL); PX.rect(l, 4, 1, 8, 3, null); PX.rect(l, 5, 2, 6, 1, C.cyanL); });
    PX.ell(g, 8, 11, 5.5, 3, C.cyan);
    PX.pts(g, [[6, 9], [7, 9], [8, 9], [7, 8], [7, 10], [9, 8], [9, 10]], C.orange);
    PX.pts(g, [[4, 6], [4, 7]], C.white);
  });
  def('beachball', g => {
    L(g, l => PX.disc(l, 8, 8, 6.5, (x, y) => { const a = Math.atan2(y + .5 - 8, x + .5 - 8); const k = Math.floor((a + Math.PI) / (Math.PI / 3)) % 3; return [C.red, C.white, C.cyan][k]; }));
    PX.disc(g, 8, 8, 1.4, C.yellow);
  });
  def('tennisball', g => {
    L(g, l => PX.disc(l, 8, 8, 6.5, '#C7F7A8'));
    PX.pts(g, [[3, 4], [4, 5], [5, 6], [5, 7], [5, 8], [5, 9], [4, 10], [3, 11], [12, 4], [11, 5], [10, 6], [10, 7], [10, 8], [10, 9], [11, 10], [12, 11]], C.white);
  });
  def('yarn', g => {
    L(g, l => PX.disc(l, 8, 8, 6.5, C.pink));
    PX.line(g, 3, 6, 12, 12, C.pinkD); PX.line(g, 4, 11, 11, 3, C.pinkD); PX.line(g, 6, 3, 13, 9, C.pinkD);
    PX.line(g, 13, 13, 15, 15, C.pinkD);
  });

  // ---------- Arcade ----------
  def('tetro', g => {
    const cell = (x, y, c) => { PX.rect(g, x, y, 5, 5, C.ink); PX.rect(g, x + 1, y + 1, 3, 3, c); PX.px(g, x + 1, y + 1, C.white); };
    cell(1, 5, C.purple); cell(5, 5, C.purple); cell(9, 5, C.purple); cell(5, 9, C.purple);
    cell(10, 10, C.cyan);
  });
  def('sponge', g => {
    L(g, l => PX.rect(l, 2, 6, 12, 8, C.yellow));
    PX.rect(g, 2, 6, 12, 3, C.green);
    PX.pts(g, [[5, 11], [9, 10], [11, 12]], C.coinD);
    PX.odisc(g, 4, 3, 1.8, C.white, C.blue); PX.odisc(g, 10, 2.5, 1.3, C.white, C.blue); PX.odisc(g, 13, 4, 1, C.white, C.blue);
  });
  def('soon', g => {
    L(g, l => PX.rect(l, 1, 4, 14, 8, C.coin));
    for (let i = 0; i < 4; i++) PX.poly(g, [[1 + i * 4, 12], [3 + i * 4, 4], [5 + i * 4, 4], [3 + i * 4, 12]], C.ink2);
  });
})();

// ---------- Suelos ----------
// Cada suelo es una función que pinta un rectángulo del lienzo. Se usa tanto en
// las habitaciones como para dibujar su icono en la tienda y el inventario.
const FLOORS = {
  sueloRosa(g, x, y, w, h) {
    PX.rect(g, x, y, w, h, C.pinkL);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if ((Math.floor(xx / 8) + Math.floor(yy / 8)) % 2) PX.px(g, xx, yy, C.pink2);
  },
  sueloCesped(g, x, y, w, h) {
    PX.rect(g, x, y, w, h, '#ACEE85');
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      const k = (xx * 7 + yy * 13) % 23;
      if (k === 0) { PX.px(g, xx, yy, C.green); PX.px(g, xx + 1, yy - 1, C.green); }
      else if (k === 11) PX.px(g, xx, yy, '#C7F7A8');
    }
  },
  sueloMoqueta(g, x, y, w, h) {
    PX.rect(g, x, y, w, h, C.purpleXL);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (xx % 4 === 0 && (yy + (Math.floor(xx / 4) % 2) * 2) % 4 === 0) PX.px(g, xx, yy, C.purpleL);
  },
  sueloAjedrez(g, x, y, w, h) {
    PX.rect(g, x, y, w, h, C.g1);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if ((Math.floor(xx / 8) + Math.floor(yy / 8)) % 2) PX.px(g, xx, yy, C.g5);
  },
  sueloMadera(g, x, y, w, h) {
    PX.rect(g, x, y, w, h, C.brown);
    for (let yy = y; yy < y + h; yy++) {
      if (yy % 6 === 0) PX.rect(g, x, yy, w, 1, C.brownD);
      else for (let xx = x; xx < x + w; xx++) if ((xx + (Math.floor(yy / 6) % 2) * 12 + 5) % 24 === 0) PX.px(g, xx, yy, C.brownD);
    }
  },
  sueloNubes(g, x, y, w, h) {
    PX.rect(g, x, y, w, h, C.skyL);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      const cx = ((xx % 24) + 24) % 24 - 12, cy = ((yy + Math.floor(xx / 24) * 8) % 16) - 8;
      if ((cx * cx) / 36 + (cy * cy) / 6 <= 1) PX.px(g, xx, yy, C.white);
    }
  },
  sueloClaro(g, x, y, w, h) {
    PX.rect(g, x, y, w, h, C.woodL);
    for (let yy = y; yy < y + h; yy++) {
      if (yy % 6 === 0) PX.rect(g, x, yy, w, 1, C.wood);
      else for (let xx = x; xx < x + w; xx++) if ((xx + (Math.floor(yy / 6) % 2) * 12 + 5) % 24 === 0) PX.px(g, xx, yy, C.wood);
    }
  },
};

(() => {
  const { def } = Sprites;
  const L = (g, fn, col) => PX.layer(g, fn, col);
  for (const id of Object.keys(FLOORS)) def('floor_' + id, g => { L(g, l => FLOORS[id](l, 1, 1, 14, 14)); });
  def('floorTab', g => {
    // baldosa en perspectiva con cuadros de colores
    L(g, l => PX.poly(l, [[4, 4], [12, 4], [15.5, 13], [0.5, 13]], (x, y) => ((Math.floor((x - 8) / 4 + (y - 4) / 9 * 2) + Math.floor((y - 4) / 3)) % 2) ? C.pink : C.yellowL));
    PX.rect(g, 0, 13, 16, 2, C.brownD);
  });
  def('chest', g => {
    L(g, l => { PX.rect(l, 1, 6, 14, 9, C.brown); PX.ell(l, 8, 6, 7, 4, C.brown); PX.rect(l, 1, 6, 14, 1, C.brown); });
    PX.rect(g, 1, 7, 14, 1, C.ink); PX.rect(g, 1, 3, 14, 1, C.brownD);
    PX.rect(g, 3, 2, 2, 12, C.coin); PX.rect(g, 11, 2, 2, 12, C.coin);
    L(g, l => PX.rect(l, 7, 6, 2, 3, C.coin), C.coinDD);
    PX.pts(g, [[2, 5], [3, 4]], C.woodM);
  });
  def('pencil', g => {
    L(g, l => { PX.poly(l, [[3, 13], [3, 10], [11, 2], [14, 5], [6, 13]], C.yellow); });
    PX.poly(g, [[11, 2], [14, 5], [13, 6], [10, 3]], C.pink);
    PX.pts(g, [[3, 12], [4, 12], [3, 11]], C.ink); PX.line(g, 5, 11, 11, 5, C.coinD);
  });
  def('poster', g => {
    L(g, l => PX.rect(l, 2, 1, 12, 14, C.purpleM));
    PX.rect(g, 3, 2, 10, 5, C.night); PX.pts(g, [[5, 3], [10, 4], [7, 5]], C.white);
    PX.disc(g, 8, 10, 2.5, C.fuchsia); PX.rect(g, 4, 13, 8, 1, C.yellow);
  });
  def('lava', g => {
    L(g, l => { PX.poly(l, [[6, 1], [10, 1], [12, 11], [4, 11]], C.fuchsiaL); PX.rect(l, 4, 11, 8, 4, C.ink3); PX.rect(l, 6, 0, 4, 2, C.ink3); });
    PX.disc(g, 8, 4, 1.4, C.orange); PX.disc(g, 7, 8, 1.8, C.orange);
  });
})();
