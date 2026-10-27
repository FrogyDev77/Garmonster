// Arranque del juego: carga la partida, calcula el tiempo transcurrido,
// ejecuta el bucle de dibujo y actualiza las necesidades cada segundo.
const Game = {
  last: 0,
  boot() {
    Store.load();
    const events = Needs.advance(Store.s, Date.now());   // tiempo que pasó con la app cerrada
    Store.save();
    Scene.init($('scene'));
    UI.init();
    if (Store.s.phase === 'alive') { UI.showRoom(Store.s.room); this.handle(events, true); }
    else { UI.showRoom('sala'); Intro.show(); }
    UI.refresh();
    requestAnimationFrame(ts => { this.last = ts; this.frame(ts); });
    setInterval(() => this.tick(), 1000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) Store.save(); else this.tick(); });
    window.addEventListener('pagehide', () => Store.save());
    this.setupAndroid();
    this.setupPWA();
  },
  frame(ts) {
    const dt = Math.max(0, Math.min(0.05, (ts - this.last) / 1000 || 0)); this.last = ts;
    if ((UI.view === 'room' || UI.view === 'arcade') && !Intro.active) Scene.frame(dt);
    requestAnimationFrame(t => this.frame(t));
  },
  tick() {
    const s = Store.s;
    if (s.phase !== 'alive' || Intro.active) { s.lastTick = Date.now(); return; }
    const wasAsleep = s.pet.asleep;
    const events = Needs.advance(s, Date.now());
    this.handle(events, false);
    if (wasAsleep !== s.pet.asleep) Scene.invalidate();
    Store.commit(false);
  },
  // Muestra al jugador lo que pasó (sin repetir el mismo aviso varias veces).
  handle(events, offline) {
    const s = Store.s, n = s.pet.name;
    const ev = new Set(events);
    if (ev.has('involucion')) {
      Store.save(); Sound.play('lose');
      UI.modal({ title: 'Aviso.exe', html: `<p class="modal-text">${esc(n)} pasó demasiado tiempo sin cuidados y volvió a ser un huevo. Cuídalo mejor esta vez: nunca muere, pero pierde lo que había crecido.</p><div class="modal-actions"><button class="btn go" id="okBtn">Volver a empezar</button></div>` });
      $('okBtn').onclick = () => { UI.closeModal(); UI.showRoom('sala'); Intro.show(); };
      return;
    }
    if (ev.has('evoluciono')) { Scene.invalidate(); UI.showEvolution(); }
    if (ev.has('aviso')) UI.toast(`${n} está muy descuidado. Atiende sus necesidades.`);
    else if (ev.has('accidente')) UI.toast(`¡Oh no! ${n} no llegó al baño. Limpia la sala.`);
    else if (!offline && ev.has('agotada')) UI.toast(`${n} estaba agotado y se quedó dormido.`);
    else if (!offline && ev.has('durmio')) UI.toast(`Son más de las ${SLEEP_HOURS.start}:00. ${n} se fue a dormir.`);
    else if (!offline && ev.has('desperto')) UI.toast(`${n} se despertó.`);
    if (ev.has('durmio') || ev.has('desperto') || ev.has('agotada')) UI.updateChip();
  },
  // Botón Atrás de Android cuando el juego se empaqueta con Capacitor.
  setupAndroid() {
    const cap = window.Capacitor;
    const App = cap && cap.Plugins && cap.Plugins.App;
    if (!App) return;
    App.addListener('backButton', () => { if (!UI.handleBack()) App.minimizeApp ? App.minimizeApp() : App.exitApp(); });
    App.addListener('pause', () => Store.save());
    App.addListener('resume', () => this.tick());
  },
  // Service worker para jugar sin conexión (solo en web, no dentro de la APK).
  setupPWA() {
    if (window.Capacitor || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('Service worker no registrado:', e));
  },
};
window.addEventListener('DOMContentLoaded', () => Game.boot());
