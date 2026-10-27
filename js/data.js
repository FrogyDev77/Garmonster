// Datos del juego: catálogo, especies, evolución y balance.
// Todo lo que se puede ajustar sin tocar la lógica está aquí.

// ---------- Necesidades ----------
// Todas van de 0 a 100 y AUMENTAN con el tiempo (100 = necesidad urgente).
const NEED_KEYS = ['hambre', 'bano', 'entretenimiento', 'sueno'];
const NEED_INFO = {
  hambre: { name: 'Hambre', icon: 'onigiri' },
  bano: { name: 'Baño', icon: 'toilet' },
  entretenimiento: { name: 'Entretenimiento', icon: 'ball' },
  sueno: { name: 'Sueño', icon: 'moon' },
};
// Puntos por hora real.
const RATES = {
  awake:  { hambre: 10, bano: 8, entretenimiento: 12, sueno: 7, suciedad: 5 },
  asleep: { hambre: 3,  bano: 2, entretenimiento: 0,  sueno: -30, suciedad: 1 },
};
// Horario de sueño según la hora local del dispositivo.
const SLEEP_HOURS = { start: 22, end: 8 };
// Tiempo máximo que se simula al volver tras mucho tiempo cerrado.
const MAX_OFFLINE_MS = 7 * 24 * 3600 * 1000;

// Efecto de cada acción sobre el estado (valores negativos reducen la necesidad).
const ACTIONS = {
  acariciar: { entretenimiento: -4, afecto: 6, care: 0.1 },
  pelota:    { entretenimiento: -7, afecto: 2, care: 0.15 },
  patito:    { entretenimiento: -2 },
  banarse:   { suciedad: -100, care: 0.4 },
  inodoro:   { bano: -100, suciedad: 4, care: 0.3 },
  limpiarPopo: { suciedad: -10, care: 0.3 },
  minijuego: { entretenimiento: -15, care: 0.2 },
  frotar:    { care: 0.5, afecto: 4 },
};

// ---------- Comida ----------
const FOODS = [
  { id: 'pan',        name: 'Pan',            price: 4,  hunger: 15, desc: 'Esponjoso y sencillo.' },
  { id: 'onigiri',    name: 'Onigiri',        price: 6,  hunger: 22, desc: 'Bola de arroz con alga.' },
  { id: 'pizza',      name: 'Pizza',          price: 8,  hunger: 28, desc: 'Una porción con pepperoni.' },
  { id: 'panqueques', name: 'Panqueques',     price: 10, hunger: 34, desc: 'Torre de tres con mantequilla.' },
  { id: 'sushi',      name: 'Sushi',          price: 12, hunger: 40, desc: 'Salmón con huevas.' },
  { id: 'te',         name: 'Té de burbujas', price: 14, hunger: 30, fun: 10, desc: 'Sacia y además divierte.' },
];

// ---------- Tienda e inventario ----------
// Todo lo que se compra va al inventario (Inventario.exe). Desde allí se usa:
// la comida va a la nevera, los accesorios y juguetes se ponen o se quitan,
// la decoración se coloca arrastrándola y los suelos se aplican a una habitación.
const CATEGORIES = [
  { id: 'accesorios', name: 'Accesorios', icon: 'hat' },
  { id: 'comida',     name: 'Comida',     icon: 'cake' },
  { id: 'decoracion', name: 'Decoración', icon: 'column' },
  { id: 'suelos',     name: 'Suelos',     icon: 'floorTab' },
  { id: 'juguetes',   name: 'Juguetes',   icon: 'cassette' },
];
// kind: food (se consume), equip (se pone en un hueco), decor (se coloca en una
// habitación; se pueden tener varias unidades), floor (cambia el suelo), unlock.
// mount de la decoración: wall (pared), floor (suelo) o rug (alfombra, bajo la mascota).
const ITEMS = [
  ...FOODS.map(f => ({ ...f, cat: 'comida', kind: 'food', icon: f.id })),
  { id: 'gorro',  name: 'Gorro hélice', price: 20, cat: 'accesorios', kind: 'equip', slot: 'cabeza', icon: 'hat', desc: 'Gira cuando tu mascota se mueve.' },
  { id: 'lazo',   name: 'Lazo rosa',    price: 15, cat: 'accesorios', kind: 'equip', slot: 'cabeza', icon: 'bow', desc: 'Un lazo para la cabeza.' },
  { id: 'gafas',  name: 'Gafas de sol', price: 18, cat: 'accesorios', kind: 'equip', slot: 'cara',   icon: 'glasses', desc: 'Estilo de verano.' },
  { id: 'corona', name: 'Corona',       price: 40, cat: 'accesorios', kind: 'equip', slot: 'cabeza', icon: 'crown', desc: 'Para la realeza del jardín.' },
  { id: 'cuadroEstrella', name: 'Cuadro estelar', price: 16, cat: 'decoracion', kind: 'decor', mount: 'wall',  w: 14, h: 16, icon: 'starframe', desc: 'Va en la pared.' },
  { id: 'poster',         name: 'Póster retro',   price: 12, cat: 'decoracion', kind: 'decor', mount: 'wall',  w: 14, h: 16, icon: 'poster',    desc: 'Va en la pared.' },
  { id: 'reloj',          name: 'Reloj de pared', price: 12, cat: 'decoracion', kind: 'decor', mount: 'wall',  w: 12, h: 12, icon: 'clock',     desc: 'Va en la pared y marca la hora real.' },
  { id: 'guirnalda',      name: 'Guirnalda',      price: 18, cat: 'decoracion', kind: 'decor', mount: 'wall',  w: 36, h: 7,  icon: 'lights',    desc: 'Luces que parpadean. Va en la pared.' },
  { id: 'maceta',         name: 'Maceta',         price: 14, cat: 'decoracion', kind: 'decor', mount: 'floor', w: 12, h: 20, icon: 'plant',     desc: 'Va en el suelo.' },
  { id: 'pecera',         name: 'Pecera',         price: 26, cat: 'decoracion', kind: 'decor', mount: 'floor', w: 16, h: 16, icon: 'fishbowl',  desc: 'Un pez que nada. Va en el suelo.' },
  { id: 'lavaLamp',       name: 'Lámpara de lava', price: 20, cat: 'decoracion', kind: 'decor', mount: 'floor', w: 8, h: 18, icon: 'lava',     desc: 'Burbujas de colores. Va en el suelo.' },
  { id: 'alfombraRosa',   name: 'Alfombra rosa',  price: 22, cat: 'decoracion', kind: 'decor', mount: 'rug',   w: 44, h: 18, icon: 'rugPink',  desc: 'Alfombra para el suelo.' },
  { id: 'alfombraLila',   name: 'Alfombra lila',  price: 22, cat: 'decoracion', kind: 'decor', mount: 'rug',   w: 44, h: 18, icon: 'rugLilac', desc: 'Alfombra para el suelo.' },
  { id: 'sueloRosa',    name: 'Baldosa rosa',   price: 15, cat: 'suelos', kind: 'floor', icon: 'floor_sueloRosa',    desc: 'Cuadros rosas al estilo Kirby.' },
  { id: 'sueloCesped',  name: 'Césped',         price: 18, cat: 'suelos', kind: 'floor', icon: 'floor_sueloCesped',  desc: 'Como tener el jardín dentro de casa.' },
  { id: 'sueloMoqueta', name: 'Moqueta lila',   price: 16, cat: 'suelos', kind: 'floor', icon: 'floor_sueloMoqueta', desc: 'Suave y mullida.' },
  { id: 'sueloAjedrez', name: 'Ajedrez',        price: 20, cat: 'suelos', kind: 'floor', icon: 'floor_sueloAjedrez', desc: 'Blanco y gris, muy retro.' },
  { id: 'sueloMadera',  name: 'Madera oscura',  price: 18, cat: 'suelos', kind: 'floor', icon: 'floor_sueloMadera',  desc: 'Tablones de madera tostada.' },
  { id: 'sueloNubes',   name: 'Nubes',          price: 24, cat: 'suelos', kind: 'floor', icon: 'floor_sueloNubes',   desc: 'Un suelo de cielo y nubes.' },
  { id: 'sueloClaro',   name: 'Madera clara',   price: 15, cat: 'suelos', kind: 'floor', icon: 'floor_sueloClaro',   desc: 'Tablones claros como los de la sala.' },
  { id: 'pelotaPlaya', name: 'Pelota de playa', price: 10, cat: 'juguetes', kind: 'equip', slot: 'pelota', icon: 'beachball', desc: 'Sustituye la pelota de la sala.' },
  { id: 'pelotaTenis', name: 'Pelota de tenis', price: 8,  cat: 'juguetes', kind: 'equip', slot: 'pelota', icon: 'tennisball', desc: 'Sustituye la pelota de la sala.' },
  { id: 'estambre',    name: 'Ovillo de lana',  price: 12, cat: 'juguetes', kind: 'equip', slot: 'pelota', icon: 'yarn', desc: 'Sustituye la pelota de la sala.' },
  { id: 'casete',      name: 'Casete chiptune', price: 20, cat: 'juguetes', kind: 'unlock', unlock: 'pista2', icon: 'cassette', desc: 'Desbloquea una segunda canción.' },
];
const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const SHOP_PAGE_SIZE = 6;
const ROOM_IDS = ['sala', 'cocina', 'bano', 'dormitorio'];

// ---------- Especies y evolución ----------
const FAMILIES = ['Mamíferos', 'Aves', 'Acuáticos', 'Criaturas de fantasía', 'Dragones', 'Alienígenas', 'Robots', 'Insectos'];
const STAGES = ['huevo', 'nino', 'adolescente', 'adulto'];
const STAGE_NAMES = { huevo: 'Huevo', nino: 'Niño', adolescente: 'Adolescente', adulto: 'Adulto' };
// Para añadir una especie basta con añadir una entrada con sus colores.
const SPECIES = {
  oruga:   { name: 'Orugui',  family: 'Insectos',    head: '#F36A1C', headL: '#FF9B45', egg: '#FFB3D5', eggSpot: '#FF7AB9',
             segs: ['#FFB697', '#AB6BE8', '#8FB9FF', '#ACEE85', '#FFE936'] },
  estelar: { name: 'Estelí',  family: 'Alienígenas', head: '#AB6BE8', headL: '#C99AFF', egg: '#C9C9FF', eggSpot: '#9696FA',
             segs: ['#ADF3FF', '#4DD3FA', '#EE59C4', '#ACEE85', '#FFE936'] },
  coral:   { name: 'Coralín', family: 'Acuáticos',   head: '#28B9A0', headL: '#55D8BE', egg: '#B2F7E4', eggSpot: '#55D8BE',
             segs: ['#FFD5A3', '#74A7FF', '#FF8DC3', '#FFE936', '#FFFCC2'] },
};
// Cuerpo según la etapa: escala y número de segmentos.
const STAGE_BODY = {
  huevo:       { scale: 1,    segs: 3 },
  nino:        { scale: 1,    segs: 3 },
  adolescente: { scale: 1.15, segs: 4 },
  adulto:      { scale: 1.3,  segs: 5 },
};
// Condiciones centralizadas: "care" son horas de buen cuidado acumuladas
// (más pequeños extras por interactuar). neglect = horas de descuido grave.
const EVOLUTION = {
  nino:        { next: 'adolescente', care: 12 },
  adolescente: { next: 'adulto',      care: 40 },
};
const NEGLECT = { warnHours: 24, involutionHours: 72 };

const PET_NAMES = ['Pomelo', 'Mochi', 'Gomita', 'Kiwi', 'Bolita', 'Nube', 'Tofu', 'Chispa', 'Lulú', 'Panqué', 'Pixel', 'Coco', 'Miel', 'Taco', 'Bombón'];

// ---------- Arcade ----------
// La limpieza ya no es un minijuego: ahora se hace en el baño.
const GAMES = {
  naves:  { name: 'Naves', title: 'Naves.exe', icon: 'rocket', desc: 'Muévete, dispara y aguanta cinco oleadas de bichos espaciales.', reward: 'Hasta 40 monedas según tu puntuación.' },
  bloques:{ name: 'Bloques', title: 'Bloques.exe', icon: 'tetro', desc: 'Encaja las piezas que caen y completa líneas.', reward: '2 monedas por línea más un extra por puntos (máx. 40).' },
  pronto: { name: 'Próximamente', title: 'Pronto.exe', icon: 'soon', desc: 'Esta máquina está en construcción. Aquí llegará un minijuego nuevo en una próxima versión.', reward: '' },
};
