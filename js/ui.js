// Interfaz: navegación entre vistas, tienda, nevera, arcade, estado y avisos.
const $ = id => document.getElementById(id);
const GAME_IMPL = { naves: SpaceGame, bloques: TetrisGame };
const ORIGINAL_FLOOR = { id: 'original', name: 'Suelo original', kind: 'floor', cat: 'suelos', icon: 'floorTab', price: 0 };
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

const UI = {
  view: 'room', room: 'sala', returnTo: null, arcadeFrom: null,
  shop: { cat: 'comida', page: 0, from: null, mode: 'shop' },
  game: null, modalOpen: false, onModalClose: null, buying: false, lastCoins: null, hintTimer: null, toastTimer: null,

  init() {
    Sprites.paint();
    $('btnShop').onclick = () => { Sound.play('ui'); this.openShop('comida'); };
    $('btnInv').onclick = () => { Sound.play('ui'); this.openInventory(); };
    $('winEdit').onclick = () => { Sound.play('ui'); Scene.edit ? Scene.stopEdit() : Scene.startEdit(); };
    $('btnArcade').onclick = () => { Sound.play('ui'); this.openArcade(); };
    $('winClose').onclick = () => { Sound.play('ui'); this.closeWindow(); };
    $('btnRestore').onclick = () => this.showRoom('sala');
    document.querySelectorAll('#nav .navbtn').forEach(b => b.onclick = () => { Sound.play('ui'); this.showRoom(b.dataset.room); });
    $('btnArcBack').onclick = () => { Sound.play('ui'); this.arcadeBack(); };
    $('btnArcHome').onclick = () => { Sound.play('ui'); this.showRoom('sala'); };
    $('statusBar').onclick = () => { Sound.play('ui'); this.openStatus(); };
    $('pgPrev').onclick = () => { this.shop.page--; this.renderShop(); Sound.play('tap'); };
    $('pgNext').onclick = () => { this.shop.page++; this.renderShop(); Sound.play('tap'); };
    $('overlay').addEventListener('pointerdown', e => { if (e.target.id === 'overlay') this.closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.handleBack(); });
    document.addEventListener('pointerdown', () => Sound.unlock(), { capture: true });
    window.addEventListener('resize', () => this.layout());
    Store.on(() => this.refresh());
    this.renderTabs();
    this.layout();
  },

  // Ajusta el tamaño de la ventana para que nunca se salga de la pantalla.
  layout() {
    const stage = $('stage'), win = $('mainWin');
    if (this.view === 'game') { win.style.width = ''; this.fitGameCanvas(); return; }
    const availH = stage.clientHeight - 42, availW = stage.clientWidth;
    win.style.width = Math.floor(Math.min(availW, availH * 96 / 104 + 6)) + 'px';
  },

  refresh() {
    const s = Store.s;
    const pill = $('coinPill');
    $('coinCount').textContent = String(s.coins).padStart(3, '0');
    if (this.lastCoins !== null && s.coins !== this.lastCoins) { pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
    this.lastCoins = s.coins;
    this.renderStatus();
    this.updateChip();
    if (this.view === 'shop' || this.view === 'inv') this.renderShop();
  },

  needColor(v) { return v < 40 ? C.green : v < 70 ? C.orange : C.red; },
  renderStatus() {
    const s = Store.s;
    $('statusBar').innerHTML = NEED_KEYS.map(k => {
      const v = Math.round(s.needs[k]);
      return `<div class="need" title="${NEED_INFO[k].name}">${Sprites.ico(NEED_INFO[k].icon)}<div class="need-bar"><i style="width:${v}%;background:${this.needColor(v)}"></i></div><b>${v}</b></div>`;
    }).join('');
  },

  // ---------- Vistas ----------
  setView(view) {
    this.view = view;
    const room = view === 'room' || view === 'arcade';
    $('sceneWrap').hidden = !room;
    $('minimized').hidden = view !== 'min';
    const cat = view === 'shop' || view === 'inv';
    $('shopView').hidden = !cat;
    $('gameView').hidden = view !== 'game';
    $('nav').hidden = !(view === 'room' || view === 'min');
    $('shopTabs').hidden = !cat;
    $('winEdit').hidden = view !== 'room';
    $('arcadeNav').hidden = view !== 'arcade';
    $('app').classList.toggle('gaming', view === 'game');
    $('btnShop').classList.toggle('on', view === 'shop');
    $('btnInv').classList.toggle('on', view === 'inv');
    $('btnArcade').classList.toggle('on', view === 'arcade' || view === 'game');
    document.querySelectorAll('#nav .navbtn').forEach(b => b.classList.toggle('active', (view === 'room' || view === 'min') && b.dataset.room === this.room));
    this.updateChip();
    requestAnimationFrame(() => this.layout());
  },
  stopGame() { if (this.game) { this.game.impl.stop(); this.game = null; } },
  showRoom(room) {
    this.stopGame(); this.closeModal(true);
    this.room = room; Store.s.room = room; Store.saveSoon();
    Scene.setRoom(room);
    $('winTitle').textContent = ROOM_TITLES[room] + '.exe';
    this.setView('room');
    this.showHint(ROOM_HINTS[room](Store.s.pet.name));
  },
  snapshot() { return { view: this.view === 'min' ? 'room' : this.view, room: this.room }; },
  restore(snap) {
    if (!snap || snap.view === 'room') this.showRoom(snap ? snap.room : 'sala');
    else if (snap.view === 'arcade') this.openArcade(true);
    else this.showRoom(this.room);
  },
  closeWindow() {
    if (this.view === 'room') { if (this.room !== 'sala') this.showRoom('sala'); else { this.setView('min'); $('winTitle').textContent = 'Sala.exe'; } }
    else if (this.view === 'min') this.showRoom('sala');
    else if (this.view === 'shop' || this.view === 'inv') this.closeShop();
    else if (this.view === 'arcade') this.arcadeBack();
    else if (this.view === 'game') this.quitGame();
  },
  handleBack() {
    if (Intro.active) return false;
    if (this.modalOpen) { this.closeModal(); return true; }
    if (Scene.edit) { Scene.stopEdit(); return true; }
    if (Scene.scrub) { Scene.endScrub(false); return true; }
    if (this.view === 'room' && this.room === 'sala') return false;
    this.closeWindow(); return true;
  },
  showHint(text) {
    const h = $('hint'); h.textContent = text; h.classList.add('show');
    clearTimeout(this.hintTimer); this.hintTimer = setTimeout(() => h.classList.remove('show'), 3500);
  },
  updateChip() {
    const chip = $('sceneChip'), s = Store.s;
    $('winEdit').classList.toggle('on', !!Scene.edit);
    chip.classList.toggle('top', this.view === 'room' && !!Scene.scrub);
    if (Scene.scrub || Scene.edit) $('hint').classList.remove('show');
    if (this.view === 'room' && Scene.scrub) {
      chip.hidden = false;
      chip.innerHTML = Scene.scrub.phase === 'rinse' ? '<span>Enjuagando...</span>' : `<span>Frota la mugre con el dedo</span><button class="btn small" id="chipBtn">Salir</button>`;
      if ($('chipBtn')) $('chipBtn').onclick = () => Scene.endScrub(false);
      return;
    }
    if (this.view === 'room' && Scene.edit) {
      const sel = Scene.edit.sel;
      chip.hidden = false;
      chip.innerHTML = `<span>${sel ? 'Arrastra para mover' : 'Toca un objeto'}</span>${sel ? '<button class="btn small" id="chipStore">Guardar</button>' : ''}<button class="btn small gold" id="chipBtn">Listo</button>`;
      $('chipBtn').onclick = () => Scene.stopEdit();
      if ($('chipStore')) $('chipStore').onclick = () => {
        const it = ITEM_BY_ID[(Store.s.placed.find(d => d.uid === sel) || {}).id];
        Store.storeDecor(sel); Scene.edit.sel = null; this.updateChip();
        if (it) this.toast(`${it.name} vuelve al inventario.`);
      };
      return;
    }
    if (this.view !== 'room' || !s.pet.asleep || Intro.active) { chip.hidden = true; return; }
    chip.hidden = false;
    if (this.room === 'dormitorio') {
      chip.innerHTML = `<span>${esc(s.pet.name)} duerme</span><button class="btn small gold" id="chipBtn">Despertar</button>`;
      $('chipBtn').onclick = () => Scene.wake();
    } else {
      chip.innerHTML = `<span>${esc(s.pet.name)} duerme en el dormitorio</span><button class="btn small" id="chipBtn">Ir</button>`;
      $('chipBtn').onclick = () => this.showRoom('dormitorio');
    }
  },
  toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  },

  // ---------- Ventanas modales ----------
  modal({ title, cls = '', html, onClose }) {
    if (this.modalOpen) this.closeModal(true);
    const m = $('modal');
    m.className = 'win modal ' + cls;
    m.innerHTML = `<div class="win-title"><span>${esc(title)}</span><button class="win-x" id="modalX" aria-label="Cerrar">${Sprites.ico('close')}</button></div><div class="win-body">${html}</div>`;
    $('overlay').hidden = false; this.modalOpen = true; this.onModalClose = onClose || null;
    $('modalX').onclick = () => { Sound.play('ui'); this.closeModal(); };
    return m;
  },
  closeModal(silent) {
    if (!this.modalOpen) return;
    $('overlay').hidden = true; $('modal').innerHTML = ''; this.modalOpen = false;
    const cb = this.onModalClose; this.onModalClose = null;
    if (cb) cb(silent);
  },

  // ---------- Nevera ----------
  openFridge() {
    if (this.view !== 'room' || this.room !== 'cocina') return;
    Scene.ui.fridgeOpen = true; Scene.invalidate(); Sound.play('ui');
    const render = () => {
      const s = Store.s;
      const owned = FOODS.filter(f => s.inventory[f.id] > 0);
      const slots = [];
      for (let i = 0; i < 6; i++) {
        const f = owned[i];
        slots.push(f ? `<button class="slot" data-food="${f.id}" aria-label="Dar ${esc(f.name)}">${Sprites.ico(f.id)}<span class="qty">x${s.inventory[f.id]}</span></button>` : '<div class="slot empty"></div>');
      }
      const m = this.modal({
        title: 'Nevera.exe',
        html: `<p class="modal-text">${owned.length ? `Elige qué le das a ${esc(s.pet.name)}.` : 'La nevera está vacía. Compra comida en la tienda.'}</p>
          <div class="fridge-grid">${slots.join('')}</div>
          <div class="row-end"><button class="pill-btn" id="fridgeShop">${Sprites.ico('shop')}Tienda</button></div>`,
        onClose: () => { Scene.ui.fridgeOpen = false; Scene.invalidate(); },
      });
      m.querySelectorAll('[data-food]').forEach(b => b.onclick = () => { const id = b.dataset.food; this.closeModal(); Scene.eat(id); });
      $('fridgeShop').onclick = () => { this.closeModal(true); this.openShop('comida', 'nevera'); };
    };
    render();
  },

  // ---------- Tienda ----------
  renderTabs() {
    $('shopTabs').innerHTML = CATEGORIES.map(c => `<button class="navbtn" data-cat="${c.id}" aria-label="${c.name}">${Sprites.ico(c.icon)}</button>`).join('');
    $('shopTabs').querySelectorAll('.navbtn').forEach(b => b.onclick = () => { Sound.play('tap'); this.shop.cat = b.dataset.cat; this.shop.page = 0; this.renderShop(); });
  },
  openShop(cat = 'comida', from = null) { this.openCatalog('shop', cat, from); },
  openInventory(cat) {
    const s = Store.s;
    // abre en la primera categoría que tenga algo
    const pick = cat || (CATEGORIES.find(c => this.invItems(c.id).length) || CATEGORIES[1]).id;
    this.openCatalog('inv', pick, null);
  },
  openCatalog(mode, cat, from) {
    if (this.view === mode) { this.shop.cat = cat; this.shop.page = 0; this.renderShop(); return; }
    this.stopGame(); this.closeModal(true);
    if (this.view !== 'shop' && this.view !== 'inv') this.returnTo = this.snapshot();
    this.shop = { cat, page: 0, from, mode };
    this.setView(mode);
    this.renderShop();
  },
  closeShop() {
    const from = this.shop.from, back = this.returnTo;
    this.restore(back);
    if (from === 'nevera' && this.view === 'room' && this.room === 'cocina') this.openFridge();
  },
  // Objetos que el jugador tiene en cada categoría del inventario.
  invItems(cat) {
    const s = Store.s;
    const list = ITEMS.filter(i => i.cat === cat && (
      i.kind === 'food' ? s.inventory[i.id] > 0 : i.kind === 'decor' ? (s.decor[i.id] || 0) > 0 : s.owned.includes(i.id)));
    if (cat === 'suelos') list.unshift(ORIGINAL_FLOOR);
    return list;
  },
  renderShop() {
    const s = Store.s, inv = this.shop.mode === 'inv';
    const cat = CATEGORIES.find(c => c.id === this.shop.cat);
    $('winTitle').textContent = inv ? `Inventario/${cat.name}.exe` : `Tienda/${cat.name}.exe`;
    $('shopTabs').querySelectorAll('.navbtn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat.id));
    const items = inv ? this.invItems(cat.id) : ITEMS.filter(i => i.cat === cat.id);
    const pages = Math.max(1, Math.ceil(items.length / SHOP_PAGE_SIZE));
    this.shop.page = Math.max(0, Math.min(pages - 1, this.shop.page));
    const slice = items.slice(this.shop.page * SHOP_PAGE_SIZE, (this.shop.page + 1) * SHOP_PAGE_SIZE);
    const cards = slice.map(it => {
      let badge = '', foot;
      if (inv) {
        if (it.kind === 'food') badge = `<span class="badge">x${s.inventory[it.id]}</span>`;
        else if (it.kind === 'decor') { const free = Store.decorFree(it.id); badge = `<span class="badge${free ? '' : ' on'}">${free ? 'x' + free : 'Colocado'}</span>`; }
        else if (it.kind === 'equip') badge = Store.isEquipped(it.id) ? '<span class="badge on">Puesto</span>' : '';
        else if (it.kind === 'floor') { const n = ROOM_IDS.filter(r => (s.floors[r] || 'original') === it.id).length; badge = n ? `<span class="badge on">En ${n}</span>` : ''; }
        foot = `<div class="card-name">${esc(it.name)}</div>`;
      } else {
        const unique = ['equip', 'floor', 'unlock'].includes(it.kind);
        const have = it.kind === 'food' ? s.inventory[it.id] : it.kind === 'decor' ? s.decor[it.id] : 0;
        if (unique && s.owned.includes(it.id)) badge = '<span class="badge on">Tuyo</span>';
        else if (have) badge = `<span class="badge">x${have}</span>`;
        foot = `<div class="card-price">${Sprites.ico('coin')}${it.price}</div>`;
      }
      const cant = !inv && s.coins < it.price && !(['equip', 'floor', 'unlock'].includes(it.kind) && s.owned.includes(it.id)) ? ' cant' : '';
      return `<button class="card${cant}" data-item="${it.id}" aria-label="${esc(it.name)}"><div class="card-img">${Sprites.ico(it.icon)}</div>${foot}${badge}</button>`;
    });
    $('invEmpty').hidden = !(inv && !items.length);
    if (inv && !items.length) $('invEmpty').innerHTML = `Aún no tienes nada de ${cat.name.toLowerCase()}. <button class="btn small" id="emptyShop">Ir a la tienda</button>`;
    if ($('emptyShop')) $('emptyShop').onclick = () => this.openCatalog('shop', this.shop.cat, null);
    while (cards.length < SHOP_PAGE_SIZE) cards.push('<div class="card empty"></div>');
    $('shopGrid').innerHTML = cards.join('');
    $('shopGrid').querySelectorAll('[data-item]').forEach(b => b.onclick = () => { Sound.play('ui'); inv ? this.openItem(b.dataset.item) : this.openBuy(b.dataset.item); });
    $('pgDots').innerHTML = Array.from({ length: pages }, (_, i) => `<i class="${i === this.shop.page ? 'on' : ''}"></i>`).join('');
    $('pgPrev').disabled = this.shop.page === 0;
    $('pgNext').disabled = this.shop.page >= pages - 1;
  },
  // Tienda: solo compra. Lo comprado se guarda en el inventario.
  openBuy(id) {
    const it = ITEM_BY_ID[id], s = Store.s;
    const owned = ['equip', 'floor', 'unlock'].includes(it.kind) && s.owned.includes(it.id);
    let info = '', actions = '';
    if (it.kind === 'food') info = `Tienes ${s.inventory[it.id] || 0} en la nevera. Calma ${it.hunger} de hambre.`;
    if (it.kind === 'decor') info = `Tienes ${s.decor[it.id] || 0}. Puedes comprar varias unidades.`;
    if (owned) {
      info = 'Ya lo tienes. Úsalo desde el inventario.';
      actions = '<button class="btn gold" id="toInvBtn">Abrir inventario</button><button class="btn" id="cancelBtn">Cerrar</button>';
    } else {
      const short = it.price - s.coins;
      if (short > 0) info += `${info ? '<br>' : ''}<strong>Te faltan ${short} monedas.</strong> Gánalas en el arcade.`;
      actions = `<button class="btn go" id="buyBtn" ${short > 0 ? 'disabled' : ''}>Comprar</button><button class="btn" id="cancelBtn">Cancelar</button>`;
    }
    this.modal({
      title: 'Comprar.exe',
      html: `<div class="buy-head">${Sprites.ico(it.icon)}<div><h3>${esc(it.name)}</h3><span class="price-tag">${Sprites.ico('coin')}${it.price}</span></div></div>
        <p class="modal-text">${esc(it.desc || '')}</p>${info ? `<p class="modal-text">${info}</p>` : ''}
        <div class="modal-actions">${actions}</div>`,
    });
    $('cancelBtn').onclick = () => this.closeModal();
    if ($('toInvBtn')) $('toInvBtn').onclick = () => { this.closeModal(true); this.openCatalog('inv', it.cat, null); };
    if ($('buyBtn')) $('buyBtn').onclick = e => {
      if (this.buying) return;             // evita compras dobles por toques repetidos
      this.buying = true; e.currentTarget.disabled = true;
      const r = Store.buy(it.id);
      Sound.play(r.ok ? 'buy' : 'error'); this.toast(r.msg);
      this.closeModal();
      setTimeout(() => { this.buying = false; }, 350);
    };
  },
  // Inventario: aquí se usan los objetos.
  openItem(id) {
    const it = id === 'original' ? ORIGINAL_FLOOR : ITEM_BY_ID[id], s = Store.s;
    const roomBtns = (attr, disabled, mark) => `<div class="room-pick">${ROOM_IDS.map(r =>
      `<button class="btn small${mark && mark(r) ? ' gold' : ''}" ${attr}="${r}" ${disabled ? 'disabled' : ''}>${ROOM_TITLES[r]}</button>`).join('')}</div>`;
    let info = '', body = '';
    if (it.kind === 'food') {
      info = `Tienes ${s.inventory[it.id]}. Está en la nevera de la cocina.`;
      body = '<div class="modal-actions"><button class="btn gold" id="goFridge">Ir a la nevera</button></div>';
    } else if (it.kind === 'equip') {
      const on = Store.isEquipped(it.id);
      info = it.slot === 'pelota' ? 'Es la pelota con la que juega en la sala.' : `Se pone en la ${it.slot === 'cara' ? 'cara' : 'cabeza'}. Solo puede llevar uno a la vez en ese sitio.`;
      body = `<div class="modal-actions"><button class="btn ${on ? '' : 'go'}" id="equipBtn">${on ? 'Quitar' : (it.slot === 'pelota' ? 'Usar' : 'Poner')}</button></div>`;
    } else if (it.kind === 'decor') {
      const free = Store.decorFree(it.id);
      const where = ROOM_IDS.map(r => [r, s.placed.filter(d => d.id === it.id && d.room === r).length]).filter(x => x[1]);
      info = `Va ${it.mount === 'wall' ? 'en la pared' : 'en el suelo'}. Tienes ${s.decor[it.id]}${where.length ? `; colocados: ${where.map(([r, n]) => `${ROOM_TITLES[r]} ${n}`).join(', ')}` : ''}.`;
      body = free > 0 ? `<p class="modal-text"><strong>Colocar en:</strong></p>${roomBtns('data-place', false)}`
        : '<p class="small-note">Todos están colocados. Para moverlos o recogerlos, usa el lápiz de la barra de la ventana.</p>';
    } else if (it.kind === 'floor') {
      info = 'Elige en qué habitación quieres este suelo.';
      body = roomBtns('data-floor', false, r => (s.floors[r] || 'original') === it.id);
    } else if (it.kind === 'unlock') {
      info = `Canción activa: ${s.settings.track}. ${s.settings.music ? '' : 'La música está apagada.'}`;
      body = `<div class="modal-actions"><button class="btn go" id="trackBtn">Escuchar canción ${s.settings.track === 1 ? 2 : 1}</button></div>`;
    }
    this.modal({
      title: 'Inventario.exe',
      html: `<div class="buy-head">${Sprites.ico(it.icon)}<div><h3>${esc(it.name)}</h3></div></div>
        <p class="modal-text">${esc(info)}</p>${body}
        <div class="modal-actions"><button class="btn" id="cancelBtn">Cerrar</button></div>`,
    });
    $('cancelBtn').onclick = () => this.closeModal();
    if ($('goFridge')) $('goFridge').onclick = () => { this.closeModal(true); this.showRoom('cocina'); this.openFridge(); };
    if ($('equipBtn')) $('equipBtn').onclick = () => { Store.toggleEquip(it.id); Sound.play('ui'); this.closeModal(); };
    if ($('trackBtn')) $('trackBtn').onclick = () => {
      Sound.unlock(); s.settings.track = s.settings.track === 1 ? 2 : 1; s.settings.music = true; Store.commit(); Sound.startMusic(); this.closeModal();
    };
    $('modal').querySelectorAll('[data-place]').forEach(b => b.onclick = () => {
      const room = b.dataset.place, uid = Store.placeDecor(it.id, room);
      if (!uid) return;
      this.closeModal(true); this.showRoom(room); Scene.startEdit(uid); Sound.play('ui');
    });
    $('modal').querySelectorAll('[data-floor]').forEach(b => b.onclick = () => {
      const room = b.dataset.floor;
      Store.setFloor(room, it.id === 'original' ? null : it.id);
      this.closeModal(true); this.showRoom(room); Sound.play('buy');
      this.toast(`Suelo cambiado en ${ROOM_TITLES[room]}.`);
    });
  },

  // ---------- Arcade ----------
  openArcade(silent) {
    if (this.view === 'arcade') return;
    this.stopGame(); this.closeModal(true);
    if (!silent) this.arcadeFrom = this.snapshot();
    Scene.setRoom('arcade');
    $('winTitle').textContent = 'Arcade.exe';
    this.setView('arcade');
    this.showHint(ROOM_HINTS.arcade());
  },
  arcadeBack() {
    const back = this.arcadeFrom; this.arcadeFrom = null;
    if (back && (back.view === 'shop' || back.view === 'inv')) { this.returnTo = { view: 'room', room: this.room }; this.openCatalog(back.view, this.shop.cat); }
    else this.showRoom(back ? back.room : 'sala');
  },
  openGameCard(id) {
    const gm = GAMES[id], s = Store.s;
    const sleeping = false;
    const best = s.best[id] || 0;
    this.modal({
      title: gm.title,
      html: `<div class="arcade-card">${Sprites.ico(gm.icon)}<h3>${esc(gm.name)}</h3><p class="modal-text">${esc(gm.desc)}</p>
        ${gm.reward ? `<p class="modal-text"><strong>Premio:</strong> ${esc(gm.reward)}</p><p class="small-note">Récord: ${best}</p>` : ''}
        ${sleeping ? `<p class="warn-box">${esc(s.pet.name)} está durmiendo. Despiértala para jugar a este.</p>` : ''}</div>
        <div class="modal-actions">${id !== 'pronto' ? `<button class="btn go" id="playBtn" ${sleeping ? 'disabled' : ''}>Jugar</button>` : ''}<button class="btn" id="cancelBtn">${id === 'pronto' ? 'Entendido' : 'Cancelar'}</button></div>`,
    });
    $('cancelBtn').onclick = () => this.closeModal();
    if ($('playBtn')) $('playBtn').onclick = () => { this.closeModal(true); this.startGame(id); };
  },
  startGame(id) {
    this.stopGame();
    const impl = GAME_IMPL[id];
    const session = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.game = { id, impl, session, ended: false };
    $('winTitle').textContent = GAMES[id].title;
    $('gameResult').hidden = true;
    this.setView('game');
    const api = {
      hud: html => { $('gameHud').innerHTML = html; },
      controls: list => this.buildControls(list),
      end: result => this.endGame(result),
    };
    impl.start($('gameCanvas'), api);
    requestAnimationFrame(() => this.fitGameCanvas());
  },
  buildControls(list) {
    const box = $('gameControls');
    box.hidden = !list.length;
    box.innerHTML = list.map((c, i) => `<button class="gbtn${c.big ? ' big' : ''}" data-i="${i}">${Sprites.ico(c.icon)}</button>`).join('');
    box.querySelectorAll('.gbtn').forEach(b => {
      const c = list[+b.dataset.i];
      const on = e => { e.preventDefault(); Sound.unlock(); b.classList.add('held'); try { b.setPointerCapture(e.pointerId); } catch (_) {} if (c.hold) c.hold(true); if (c.tap) c.tap(); };
      const off = () => { if (!b.classList.contains('held')) return; b.classList.remove('held'); if (c.hold) c.hold(false); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
      b.addEventListener('contextmenu', e => e.preventDefault());
    });
    requestAnimationFrame(() => this.fitGameCanvas());
  },
  fitGameCanvas() {
    const c = $('gameCanvas'), wrap = c.parentElement;
    if (!c.width || $('gameView').hidden) return;
    const w = wrap.clientWidth - 12, h = wrap.clientHeight - 12;
    const k = Math.max(1, Math.min(w / c.width, h / c.height));
    c.style.width = Math.floor(c.width * k) + 'px'; c.style.height = Math.floor(c.height * k) + 'px';
  },
  endGame(result) {
    const gm = this.game;
    if (!gm || gm.ended) return;
    gm.ended = true; gm.impl.stop();
    const record = Store.setBest(gm.id, result.score);
    let granted = false;
    if (result.coins > 0) granted = Store.claim(gm.session, result.coins);
    else Store.claim(gm.session, 0);
    if (granted) Store.apply(ACTIONS.minijuego, true);
    if (granted) Sound.play('coin');
    const box = $('gameResult');
    box.innerHTML = `<h3>${result.victory ? '¡Victoria!' : 'Fin de la partida'}</h3>
      <p>${esc(result.detail || '')}</p><p>Puntuación: <strong>${result.score}</strong>${record ? ' · ¡Nuevo récord!' : ''}</p>
      ${result.coins > 0 ? `<div class="reward">${Sprites.ico('coin')}+${result.coins}</div>` : '<p>Esta vez no ganaste monedas.</p>'}
      <div class="modal-actions"><button class="btn go" id="againBtn">Jugar otra vez</button><button class="btn" id="toArcadeBtn">Volver al arcade</button></div>`;
    box.hidden = false;
    $('againBtn').onclick = () => this.startGame(gm.id);
    $('toArcadeBtn').onclick = () => this.leaveGame();
  },
  quitGame() {
    if (this.game && !this.game.ended) this.toast('Partida abandonada: sin recompensa.');
    this.leaveGame();
  },
  leaveGame() { this.stopGame(); $('gameResult').hidden = true; this.openArcade(true); },

  // ---------- Estado de la mascota ----------
  openStatus() {
    const s = Store.s, p = s.pet, sp = SPECIES[p.species];
    const nx = Needs.nextStageInfo(s);
    const bar = (icon, name, v, color) => `<div class="stat">${Sprites.ico(icon)}<span>${name}</span><div class="need-bar"><i style="width:${Math.round(v)}%;background:${color}"></i></div><b>${Math.round(v)}</b></div>`;
    const now = new Date(), night = Needs.isNight(now.getTime());
    const hh = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const m = this.modal({
      title: 'Estado.exe',
      html: `<div class="pet-card"><canvas id="statusPet" width="48" height="48"></canvas><div><h3>${esc(p.name)}</h3>
          <p>${sp.family}, etapa ${STAGE_NAMES[p.stage]}${p.generation > 1 ? ` (generación ${p.generation})` : ''}</p>
          <p>${nx ? `Crecimiento hacia ${STAGE_NAMES[nx.next]}: ${Math.floor(nx.progress * 100)}%` : 'Ya es adulto.'}</p></div></div>
        ${p.neglect >= NEGLECT.warnHours ? `<p class="warn-box">Lleva mucho tiempo descuidado. Si sigue así volverá a ser un huevo.</p>` : ''}
        <div class="stat-list">
          ${NEED_KEYS.map(k => bar(NEED_INFO[k].icon, NEED_INFO[k].name, s.needs[k], this.needColor(s.needs[k]))).join('')}
          ${bar('drop', 'Suciedad', s.suciedad, this.needColor(s.suciedad))}
          ${bar('heart', 'Afecto', p.afecto, C.pink)}
        </div>
        <p class="small-note">Las necesidades suben con el tiempo; 100 es lo más urgente. Son las ${hh}: ${night ? 'es hora de dormir' : 'es de día'} (sueño de ${String(SLEEP_HOURS.start).padStart(2, '0')}:00 a ${String(SLEEP_HOURS.end).padStart(2, '0')}:00).</p>
        <div class="settings">
          <button class="toggle ${s.settings.sfx ? 'on' : ''}" id="tSfx">Efectos ${s.settings.sfx ? 'sí' : 'no'}</button>
          <button class="toggle ${s.settings.music ? 'on' : ''}" id="tMusic">Música ${s.settings.music ? 'sí' : 'no'}</button>
          ${s.owned.includes('casete') ? `<button class="toggle" id="tTrack">Canción ${s.settings.track}</button>` : ''}
        </div>
        <details class="test"><summary>Herramientas de prueba</summary><div class="settings">
          <button class="toggle" id="tHour">Avanzar 1 hora</button>
          <button class="toggle" id="tCoins">+50 monedas</button>
          <button class="toggle" id="tReset">Borrar partida</button>
        </div></details>`,
    });
    const pc = $('statusPet').getContext('2d');
    drawPet(pc, 18, 18, { species: p.species, stage: p.stage, expr: 'happy', still: true, equipped: s.equipped, dirt: s.suciedad });
    $('tSfx').onclick = () => { s.settings.sfx = !s.settings.sfx; Store.commit(); this.openStatus(); };
    $('tMusic').onclick = () => { Sound.unlock(); s.settings.music = !s.settings.music; Store.commit(); s.settings.music ? Sound.startMusic() : Sound.stopMusic(); this.openStatus(); };
    if ($('tTrack')) $('tTrack').onclick = () => { s.settings.track = s.settings.track === 1 ? 2 : 1; Store.commit(); if (s.settings.music) Sound.startMusic(); this.openStatus(); };
    $('tHour').onclick = () => { s.lastTick -= 3600 * 1000; Game.tick(); this.openStatus(); };
    $('tCoins').onclick = () => { s.coins += 50; Store.commit(); Sound.play('coin'); this.openStatus(); };
    $('tReset').onclick = e => {
      if (e.currentTarget.dataset.sure) { this.closeModal(true); Store.reset(); location.reload(); return; }
      e.currentTarget.dataset.sure = '1'; e.currentTarget.textContent = 'Toca otra vez para borrar todo';
    };
    return m;
  },
  showEvolution() {
    const s = Store.s;
    Sound.play('evolve');
    this.modal({
      title: 'Evolución.exe',
      html: `<div class="pet-card"><canvas id="evoPet" width="48" height="48"></canvas><div><h3>¡${esc(s.pet.name)} ha crecido!</h3><p>Ahora es ${STAGE_NAMES[s.pet.stage]}.</p></div></div>
        <div class="modal-actions"><button class="btn go" id="okBtn">¡Genial!</button></div>`,
    });
    drawPet($('evoPet').getContext('2d'), 18, 18, { species: s.pet.species, stage: s.pet.stage, expr: 'love', still: true, equipped: s.equipped });
    $('okBtn').onclick = () => this.closeModal();
  },
};
