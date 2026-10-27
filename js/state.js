// Estado central del juego. TODA lectura y escritura de monedas, inventario,
// necesidades y mascota pasa por aquí, y se guarda en localStorage.
const SAVE_KEY = 'monsterGarden.save.v1';

function clamp100(v) { return Math.max(0, Math.min(100, v)); }

function defaultState() {
  const now = Date.now();
  return {
    version: 1,
    phase: 'egg',               // egg -> naming -> alive
    hatchTaps: 0,
    pet: {
      name: '', species: 'oruga', stage: 'huevo', generation: 1,
      care: 0, neglect: 0, afecto: 50,
      asleep: false, autoSleep: false, wokenUntil: 0, poop: false, neglectWarned: false,
    },
    needs: { hambre: 35, bano: 20, entretenimiento: 40, sueno: 15 },
    suciedad: 25,
    coins: 30,
    inventory: { pan: 2, onigiri: 1 },   // regalo inicial del tutorial
    owned: [],                 // accesorios, juguetes, suelos y desbloqueos (uno de cada)
    equipped: {},              // accesorios y pelota puestos: { cabeza, cara, pelota }
    decor: {},                 // decoración comprada: { id: unidades }
    placed: [],                // decoración colocada: [{ uid, id, room, x, y }]
    floors: {},                // suelo aplicado en cada habitación: { sala: 'sueloRosa' }
    room: 'sala',
    best: { naves: 0, bloques: 0, mugre: 0 },
    claimed: [],
    settings: { sfx: true, music: false, track: 1 },
    lastTick: now,
    created: now,
  };
}

// Valida una partida cargada: cualquier dato raro se sustituye por el valor por defecto.
function sanitize(raw) {
  const d = defaultState();
  if (!raw || typeof raw !== 'object') return d;
  const num = (v, def, min = -Infinity, max = Infinity) => (typeof v === 'number' && isFinite(v)) ? Math.max(min, Math.min(max, v)) : def;
  const s = d;
  s.phase = ['egg', 'naming', 'alive'].includes(raw.phase) ? raw.phase : d.phase;
  s.hatchTaps = num(raw.hatchTaps, 0, 0, 3);
  const p = raw.pet || {};
  s.pet.name = typeof p.name === 'string' ? p.name.slice(0, 12) : '';
  s.pet.species = SPECIES[p.species] ? p.species : 'oruga';
  s.pet.stage = STAGES.includes(p.stage) ? p.stage : (s.phase === 'alive' ? 'nino' : 'huevo');
  s.pet.generation = num(p.generation, 1, 1);
  s.pet.care = num(p.care, 0, 0);
  s.pet.neglect = num(p.neglect, 0, 0);
  s.pet.afecto = num(p.afecto, 50, 0, 100);
  s.pet.asleep = !!p.asleep; s.pet.autoSleep = !!p.autoSleep; s.pet.poop = !!p.poop; s.pet.neglectWarned = !!p.neglectWarned;
  s.pet.wokenUntil = num(p.wokenUntil, 0, 0);
  for (const k of NEED_KEYS) s.needs[k] = num(raw.needs && raw.needs[k], d.needs[k], 0, 100);
  s.suciedad = num(raw.suciedad, d.suciedad, 0, 100);
  s.coins = Math.floor(num(raw.coins, d.coins, 0, 999999));
  if (raw.inventory && typeof raw.inventory === 'object') {
    s.inventory = {};
    for (const f of FOODS) { const q = Math.floor(num(raw.inventory[f.id], 0, 0, 999)); if (q > 0) s.inventory[f.id] = q; }
  }
  // Objetos únicos (accesorios, juguetes, suelos, desbloqueos)
  const rawOwned = Array.isArray(raw.owned) ? raw.owned.filter(id => ITEM_BY_ID[id]) : [];
  s.owned = [...new Set(rawOwned.filter(id => ['equip', 'floor', 'unlock'].includes(ITEM_BY_ID[id].kind)))];
  for (const [slot, id] of Object.entries(raw.equipped || {})) {
    const it = ITEM_BY_ID[id];
    if (it && it.kind === 'equip' && it.slot === slot && s.owned.includes(id)) s.equipped[slot] = id;
  }
  // Decoración: unidades y piezas colocadas
  if (raw.decor && typeof raw.decor === 'object') {
    for (const [id, q] of Object.entries(raw.decor)) if (ITEM_BY_ID[id] && ITEM_BY_ID[id].kind === 'decor') s.decor[id] = Math.floor(num(q, 0, 0, 99));
  }
  // Migración de partidas antiguas: la decoración comprada pasa al inventario
  // y la que estaba puesta queda colocada en la sala.
  for (const id of rawOwned) {
    const it = ITEM_BY_ID[id];
    if (it.kind !== 'decor' || s.decor[id]) continue;
    s.decor[id] = 1;
    if (raw.equipped && Object.values(raw.equipped).includes(id)) s.placed.push({ uid: 'm' + id, id, room: 'sala', ...defaultSpot(it) });
  }
  if (Array.isArray(raw.placed)) {
    for (const d of raw.placed) {
      const it = d && ITEM_BY_ID[d.id];
      if (!it || it.kind !== 'decor' || !ROOM_IDS.includes(d.room)) continue;
      if (s.placed.filter(x => x.id === d.id).length >= (s.decor[d.id] || 0)) continue;
      s.placed.push({ uid: String(d.uid || Math.random().toString(36).slice(2)), id: d.id, room: d.room, ...clampSpot(it, num(d.x, 0), num(d.y, 0)) });
    }
  }
  if (raw.floors && typeof raw.floors === 'object') {
    for (const r of ROOM_IDS) { const f = raw.floors[r]; if (f && s.owned.includes(f)) s.floors[r] = f; }
  }
  s.room = ['sala', 'cocina', 'bano', 'dormitorio'].includes(raw.room) ? raw.room : 'sala';
  for (const k of Object.keys(s.best)) s.best[k] = num(raw.best && raw.best[k], 0, 0);
  s.claimed = Array.isArray(raw.claimed) ? raw.claimed.filter(x => typeof x === 'string').slice(-40) : [];
  const st = raw.settings || {};
  s.settings = { sfx: st.sfx !== false, music: !!st.music, track: st.track === 2 && s.owned.includes('casete') ? 2 : 1 };
  s.lastTick = num(raw.lastTick, Date.now(), 0);
  s.created = num(raw.created, Date.now(), 0);
  return s;
}

// Zonas válidas para la decoración (lienzo de 96x104, la pared llega hasta y=40).
const DECOR_AREA = { w: 96, h: 104, floor: 40 };
function clampSpot(it, x, y) {
  const A = DECOR_AREA;
  x = Math.max(it.mount === 'rug' ? -Math.floor(it.w / 4) : 0, Math.min(A.w - (it.mount === 'rug' ? Math.ceil(it.w * 3 / 4) : it.w), x));
  if (it.mount === 'wall') y = Math.max(0, Math.min(A.floor - 2 - it.h, y));
  else if (it.mount === 'rug') y = Math.max(A.floor + 2, Math.min(A.h - it.h, y));
  else y = Math.max(A.floor + 6 - it.h, Math.min(A.h - it.h, y));
  return { x: Math.round(x), y: Math.round(y) };
}
function defaultSpot(it) {
  if (it.mount === 'wall') return clampSpot(it, 48 - it.w / 2, 8);
  if (it.mount === 'rug') return clampSpot(it, 48 - it.w / 2, 70);
  return clampSpot(it, 48 - it.w / 2, 86 - it.h);
}

const Store = {
  s: null, _timer: null, subs: [],
  load() {
    let raw = null;
    try { const txt = localStorage.getItem(SAVE_KEY); raw = txt ? JSON.parse(txt) : null; }
    catch (e) { console.warn('Partida guardada dañada; se empieza una nueva.', e); }
    this.s = sanitize(raw);
    return this.s;
  },
  save() {
    clearTimeout(this._timer); this._timer = null;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.s)); } catch (e) { console.warn('No se pudo guardar la partida.', e); }
  },
  saveSoon() { if (!this._timer) this._timer = setTimeout(() => this.save(), 600); },
  on(fn) { this.subs.push(fn); },
  emit() { for (const fn of this.subs) fn(this.s); },
  // Guarda (inmediato para transacciones importantes) y avisa a la interfaz.
  commit(now = true) { now ? this.save() : this.saveSoon(); this.emit(); },
  reset() { this.s = defaultState(); this.commit(); },

  // Aplica un cambio de necesidades/afecto/cuidado de forma segura (0..100).
  apply(delta, saveNow = false) {
    const s = this.s;
    for (const [k, v] of Object.entries(delta)) {
      if (NEED_KEYS.includes(k)) s.needs[k] = clamp100(s.needs[k] + v);
      else if (k === 'suciedad') s.suciedad = clamp100(s.suciedad + v);
      else if (k === 'afecto') s.pet.afecto = clamp100(s.pet.afecto + v);
      else if (k === 'care') s.pet.care += v;
    }
    this.commit(saveNow);
  },

  // ---------- Economía ----------
  canAfford(price) { return this.s.coins >= price; },
  buy(itemId) {
    const it = ITEM_BY_ID[itemId], s = this.s;
    if (!it) return { ok: false, msg: 'Ese artículo no existe.' };
    const unique = ['equip', 'floor', 'unlock'].includes(it.kind);
    if (unique && s.owned.includes(it.id)) return { ok: false, msg: 'Ya tienes este artículo en el inventario.' };
    if (s.coins < it.price) return { ok: false, msg: `Te faltan ${it.price - s.coins} monedas para comprar ${it.name}.` };
    // transacción única: se descuenta y se guarda en el inventario a la vez
    s.coins -= it.price;
    if (it.kind === 'food') s.inventory[it.id] = (s.inventory[it.id] || 0) + 1;
    else if (it.kind === 'decor') s.decor[it.id] = (s.decor[it.id] || 0) + 1;
    else s.owned.push(it.id);
    this.commit();
    return { ok: true, msg: it.kind === 'food' ? `Guardado en la nevera: ${it.name}.` : `Guardado en el inventario: ${it.name}.` };
  },
  isEquipped(id) { const it = ITEM_BY_ID[id]; return !!(it && it.slot && this.s.equipped[it.slot] === id); },
  toggleEquip(itemId) {
    const it = ITEM_BY_ID[itemId], s = this.s;
    if (!it || !it.slot || !s.owned.includes(it.id)) return false;
    if (s.equipped[it.slot] === it.id) delete s.equipped[it.slot]; else s.equipped[it.slot] = it.id;
    this.commit();
    return true;
  },
  // ---------- Decoración ----------
  decorFree(id) { return (this.s.decor[id] || 0) - this.s.placed.filter(d => d.id === id).length; },
  placeDecor(id, room) {
    const it = ITEM_BY_ID[id];
    if (!it || it.kind !== 'decor' || !ROOM_IDS.includes(room) || this.decorFree(id) <= 0) return null;
    const d = { uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), id, room, ...defaultSpot(it) };
    this.s.placed.push(d); this.commit();
    return d.uid;
  },
  moveDecor(uid, x, y, save = false) {
    const d = this.s.placed.find(p => p.uid === uid);
    if (!d) return;
    Object.assign(d, clampSpot(ITEM_BY_ID[d.id], x, y));
    if (save) this.commit();
  },
  storeDecor(uid) {
    const i = this.s.placed.findIndex(p => p.uid === uid);
    if (i < 0) return false;
    this.s.placed.splice(i, 1); this.commit();
    return true;
  },
  // ---------- Suelos ----------
  setFloor(room, floorId) {
    if (!ROOM_IDS.includes(room)) return false;
    if (floorId && !this.s.owned.includes(floorId)) return false;
    if (floorId) this.s.floors[room] = floorId; else delete this.s.floors[room];
    this.commit();
    return true;
  },
  // Dar de comer: consume una unidad y reduce el hambre en una sola operación.
  feed(foodId) {
    const s = this.s, food = FOODS.find(f => f.id === foodId);
    if (!food || !(s.inventory[foodId] > 0)) return false;
    s.inventory[foodId] -= 1;
    if (s.inventory[foodId] <= 0) delete s.inventory[foodId];
    s.needs.hambre = clamp100(s.needs.hambre - food.hunger);
    if (food.fun) s.needs.entretenimiento = clamp100(s.needs.entretenimiento - food.fun);
    s.pet.care += 0.3; s.pet.afecto = clamp100(s.pet.afecto + 3);
    this.commit();
    return true;
  },
  // Entrega una recompensa una sola vez por partida (sessionId único).
  claim(sessionId, amount) {
    const s = this.s;
    if (!sessionId || s.claimed.includes(sessionId)) return false;
    s.claimed.push(sessionId);
    if (s.claimed.length > 40) s.claimed = s.claimed.slice(-40);
    s.coins += Math.max(0, Math.floor(amount));
    this.commit();
    return true;
  },
  setBest(game, score) {
    if (score > (this.s.best[game] || 0)) { this.s.best[game] = score; this.commit(); return true; }
    return false;
  },
};
