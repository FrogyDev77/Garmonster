// Pequeña biblioteca de dibujo pixel art. Todo se dibuja en lienzos de baja
// resolución (por ejemplo 96x104) que el CSS amplía sin suavizado.
// Un color null borra píxeles. Un color función (x, y) => color pinta píxel a píxel.

// Fuente de 3x5 píxeles para textos dentro de los lienzos.
const FONT = {
  A:'010101111101101', B:'110101110101110', C:'011100100100011', D:'110101101101110', E:'111100110100111',
  F:'111100110100100', G:'011100101101011', H:'101101111101101', I:'111010010010111', J:'001001001101010',
  K:'101101110101101', L:'100100100100111', M:'101111111101101', N:'110101101101101', O:'010101101101010',
  P:'110101110100100', Q:'010101101110011', R:'110101110101101', S:'011100010001110', T:'111010010010010',
  U:'101101101101111', V:'101101101101010', W:'101101111111101', X:'101101010101101', Y:'101101010010010',
  Z:'111001010100111', 0:'111101101101111', 1:'010110010010111', 2:'110001010100111', 3:'110001010001110',
  4:'101101111001001', 5:'111100110001110', 6:'011100111101111', 7:'111001010010010', 8:'111101111101111',
  9:'111101111001110', ' ':'000000000000000', '!':'010010010000010', ':':'000010000010000', '-':'000000111000000',
  '+':'000010111010000', '.':'000000000000010', '?':'110001010000010', '/':'001001010100100', 'x':'000101010101000',
  '%':'101001010100101', '¡':'010000010010010', '¿':'010000010100011',
};

const PX = {
  make(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = false;
    return { c, g };
  },
  _fill(g, x, y, w, h, col) {
    if (col === null) { g.clearRect(x, y, w, h); return; }
    g.fillStyle = col; g.fillRect(x, y, w, h);
  },
  rect(g, x, y, w, h, col) { this._fill(g, Math.round(x), Math.round(y), Math.round(w), Math.round(h), col); },
  px(g, x, y, col) { this._fill(g, Math.round(x), Math.round(y), 1, 1, col); },
  pts(g, list, col, ox = 0, oy = 0) { for (const [x, y] of list) this.px(g, x + ox, y + oy, col); },
  disc(g, cx, cy, r, col) { this.ell(g, cx, cy, r, r, col); },
  // Elipse rellena: pinta los píxeles cuyo centro cae dentro de la elipse.
  ell(g, cx, cy, rx, ry, col) {
    if (rx <= 0 || ry <= 0) return;
    const y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      const dy = (y + 0.5 - cy) / ry;
      if (Math.abs(dy) > 1) continue;
      const half = rx * Math.sqrt(1 - dy * dy);
      const xa = Math.ceil(cx - half - 0.5), xb = Math.floor(cx + half - 0.5);
      if (xb < xa) continue;
      if (typeof col === 'function') {
        for (let x = xa; x <= xb; x++) { const c = col(x, y); if (c !== undefined) this._fill(g, x, y, 1, 1, c); }
      } else this._fill(g, xa, y, xb - xa + 1, 1, col);
    }
  },
  // Disco con contorno propio (contorno de 1 píxel alrededor).
  odisc(g, cx, cy, r, fill, line = C.ink) { this.disc(g, cx, cy, r + 1, line); this.disc(g, cx, cy, r, fill); },
  oell(g, cx, cy, rx, ry, fill, line = C.ink) { this.ell(g, cx, cy, rx + 1, ry + 1, line); this.ell(g, cx, cy, rx, ry, fill); },
  orect(g, x, y, w, h, fill, line = C.ink) { this.rect(g, x - 1, y - 1, w + 2, h + 2, line); this.rect(g, x, y, w, h, fill); },
  // Polígono relleno (prueba del centro de cada píxel).
  poly(g, pts, col) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        const px = x + 0.5, py = y + 0.5;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this._fill(g, x, y, 1, 1, typeof col === 'function' ? col(x, y) : col);
      }
    }
  },
  line(g, x0, y0, x1, y1, col) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this._fill(g, x0, y0, 1, 1, col);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  },
  // Añade un contorno de 1 píxel alrededor de todo lo opaco del lienzo.
  outline(c, col = C.ink) {
    const g = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height;
    const a = g.getImageData(0, 0, w, h).data;
    const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 40;
    g.fillStyle = col;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (op(x, y)) continue;
      if (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1)) g.fillRect(x, y, 1, 1);
    }
  },
  // Dibuja un objeto en una capa temporal, le añade contorno y lo pega.
  layer(g, fn, col = C.ink) {
    const L = this.make(g.canvas.width, g.canvas.height);
    fn(L.g);
    this.outline(L.c, col);
    g.drawImage(L.c, 0, 0);
  },
  // Dibuja a partir de un mapa de caracteres y una leyenda de colores.
  map(g, rows, legend, ox = 0, oy = 0, flip = false) {
    const w = rows[0].length;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = legend[row[x]];
        if (col) this._fill(g, ox + (flip ? w - 1 - x : x), oy + y, 1, 1, col);
      }
    });
  },
  _norm(s) { return String(s).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); },
  text(g, str, x, y, col, s = 1) {
    let cx = Math.round(x);
    for (const ch of this._norm(str)) {
      const gl = FONT[ch] || FONT['?'];
      for (let i = 0; i < 15; i++) if (gl[i] === '1') this._fill(g, cx + (i % 3) * s, Math.round(y) + Math.floor(i / 3) * s, s, s, col);
      cx += 4 * s;
    }
  },
  textW(str, s = 1) { return this._norm(str).length * 4 * s - s; },
  textC(g, str, cx, y, col, s = 1) { this.text(g, str, Math.round(cx - this.textW(str, s) / 2), y, col, s); },
};
