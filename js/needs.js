// Simulación del paso del tiempo: necesidades, ciclo diario de sueño,
// accidentes, cuidado acumulado, evolución e involución.
const Needs = {
  isNight(ts) {
    const h = new Date(ts).getHours();
    const { start, end } = SLEEP_HOURS;
    return start > end ? (h >= start || h < end) : (h >= start && h < end);
  },

  // Avanza la simulación desde lastTick hasta "now" en pasos de 5 minutos.
  // Devuelve la lista de eventos ocurridos (para avisar al jugador).
  advance(s, now = Date.now()) {
    const events = [];
    if (s.phase !== 'alive') { s.lastTick = now; return events; }
    let from = s.lastTick;
    // Si el reloj del dispositivo retrocedió, no se calcula nada negativo.
    if (!isFinite(from) || from > now) { s.lastTick = now; return events; }
    if (now - from > MAX_OFFLINE_MS) from = now - MAX_OFFLINE_MS;
    const STEP = 5 * 60 * 1000;
    let t = from;
    while (t < now) {
      const dt = Math.min(STEP, now - t);
      this.step(s, t, dt, events);
      t += dt;
      if (s.phase !== 'alive') break;
    }
    s.lastTick = now;
    if (s.phase === 'alive') this.checkEvolution(s, events);
    return events;
  },

  step(s, t, dt, events) {
    const p = s.pet, h = dt / 3600000, night = this.isNight(t);
    // Ciclo diario
    if (night && !p.asleep && t >= p.wokenUntil) { p.asleep = true; p.autoSleep = true; events.push('durmio'); }
    if (!night && p.asleep && p.autoSleep && s.needs.sueno <= 20) { p.asleep = false; p.autoSleep = false; events.push('desperto'); }
    if (!night && p.asleep && !p.autoSleep && s.needs.sueno <= 0) { p.asleep = false; events.push('desperto'); }
    if (!night && !p.asleep && s.needs.sueno >= 100) { p.asleep = true; p.autoSleep = true; events.push('agotada'); }

    const r = p.asleep ? RATES.asleep : RATES.awake;
    for (const k of NEED_KEYS) s.needs[k] = clamp100(s.needs[k] + r[k] * h);
    s.suciedad = clamp100(s.suciedad + r.suciedad * h);

    // Si nadie la lleva al baño a tiempo, tiene un accidente en la sala.
    if (s.needs.bano >= 100 && !p.poop) {
      p.poop = true; s.suciedad = clamp100(s.suciedad + 25); s.needs.bano = 30; events.push('accidente');
    }
    // Cuidado acumulado (para evolucionar) y descuido grave (involución).
    const vals = NEED_KEYS.map(k => s.needs[k]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg < 55 && s.suciedad < 60 && !p.poop) p.care += h;
    const bad = vals.filter(v => v >= 90).length + (s.suciedad >= 90 ? 1 : 0) + (p.poop ? 1 : 0);
    if (bad >= 3) p.neglect += h; else p.neglect = Math.max(0, p.neglect - h * 2);
    if (p.neglect < NEGLECT.warnHours) p.neglectWarned = false;
  },

  checkEvolution(s, events) {
    const p = s.pet;
    if (p.neglect >= NEGLECT.involutionHours) { this.involve(s); events.push('involucion'); return; }
    if (p.neglect >= NEGLECT.warnHours && !p.neglectWarned) { p.neglectWarned = true; events.push('aviso'); }
    const rule = EVOLUTION[p.stage];
    if (rule && p.care >= rule.care) { p.stage = rule.next; events.push('evoluciono'); }
  },

  // La mascota nunca muere: si se descuida mucho tiempo, vuelve a ser huevo.
  involve(s) {
    const p = s.pet;
    s.phase = 'egg'; s.hatchTaps = 0;
    p.stage = 'huevo'; p.care = 0; p.neglect = 0; p.neglectWarned = false; p.afecto = 30;
    p.asleep = false; p.autoSleep = false; p.poop = false; p.generation += 1;
    const keys = Object.keys(SPECIES);
    p.species = keys[Math.floor(Math.random() * keys.length)];
    s.needs = { hambre: 30, bano: 20, entretenimiento: 30, sueno: 20 };
    s.suciedad = 20;
  },

  nextStageInfo(s) {
    const rule = EVOLUTION[s.pet.stage];
    if (!rule) return null;
    return { next: rule.next, progress: Math.min(1, s.pet.care / rule.care), need: rule.care };
  },
};
