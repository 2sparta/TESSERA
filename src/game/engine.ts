import {
  BUILDINGS,
  CIVS,
  RESOURCES,
  TERRAIN,
  UNITS,
  WONDERS,
  WONDER_COST,
  civGatedCaps,
  civTechs,
  foodNeeded,
} from './data';
import { hexDist, inRadius, key, neighbors } from './hex';
import { generateMap } from './mapgen';
import type { City, CivKey, GameState, GrowthChoice, Player, TerrainKey, Tile, Unit } from './types';

export const isWater = (t: TerrainKey) => TERRAIN[t].water === true;
export const has = (p: Player, tech: string) => p.techs.includes(tech);

export const tileAt = (s: GameState, q: number, r: number): Tile | undefined => s.tiles[key(q, r)];
export function unitAt(s: GameState, q: number, r: number): Unit | undefined {
  const k = key(q, r);
  return Object.values(s.units).find((u) => key(u.q, u.r) === k);
}
export function cityAt(s: GameState, q: number, r: number): City | undefined {
  const t = tileAt(s, q, r);
  return t && t.city ? s.cities[t.city] : undefined;
}
export const playerCities = (s: GameState, pid: number) => Object.values(s.cities).filter((c) => c.owner === pid);
export const playerUnits = (s: GameState, pid: number) => Object.values(s.units).filter((u) => u.owner === pid);

export function addLog(s: GameState, text: string, kind: 'info' | 'war' | 'good' | 'bad' | 'event' = 'info') {
  s.log.unshift({ turn: s.turn, text, kind });
  if (s.log.length > 120) s.log.pop();
}

export function atWar(s: GameState, a: number, b: number) {
  if (a === b) return false;
  const pa = s.players[a];
  const pb = s.players[b];
  if (!pa || !pb) return false;
  if (pa.barb || pb.barb) return true;
  return !!pa.war[b];
}

export function declareWar(s: GameState, a: number, b: number) {
  if (atWar(s, a, b)) return;
  s.players[a].war[b] = true;
  s.players[b].war[a] = true;
  s.players[a].trade[b] = false;
  s.players[b].trade[a] = false;
  s.players[a].relations[b] = Math.min(s.players[a].relations[b] ?? 0, -50);
  s.players[b].relations[a] = Math.min(s.players[b].relations[a] ?? 0, -50);
  addLog(s, `⚔️ ${s.players[a].name} объявляет войну: ${s.players[b].name}`, 'war');
}

export function makePeace(s: GameState, a: number, b: number) {
  s.players[a].war[b] = false;
  s.players[b].war[a] = false;
  s.players[a].relations[b] = 10;
  s.players[b].relations[a] = 10;
  addLog(s, `🕊️ Мир между ${s.players[a].name} и ${s.players[b].name}`, 'info');
}

/* ------------------------------------------------------------------ */
/* Setup                                                               */
/* ------------------------------------------------------------------ */

export interface NewGameOpts {
  seed?: number;
  size: 'small' | 'medium';
  humanCiv: CivKey;
  opponents: CivKey[];
  maxTurns: number;
}

export function newGame(opts: NewGameOpts): GameState {
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const civs: CivKey[] = [opts.humanCiv, ...opts.opponents];
  const { tiles, starts } = generateMap(seed, opts.size, civs.length);

  const players: Player[] = civs.map((civ, i) => ({
    id: i,
    name: CIVS[civ].name,
    civ,
    isAI: i > 0,
    stars: 5,
    science: 0,
    culture: 0,
    techs: startTechs(civ),
    explored: {},
    relations: {},
    war: {},
    trade: {},
    alive: true,
    extraSlots: 0,
  }));
  players.push({
    id: civs.length,
    name: 'Варвары',
    civ: 'gaul',
    isAI: true,
    barb: true,
    stars: 0,
    science: 0,
    culture: 0,
    techs: [],
    explored: {},
    relations: {},
    war: {},
    trade: {},
    alive: true,
    extraSlots: 0,
  });
  for (const p of players) {
    for (const o of players) if (o.id !== p.id) p.relations[o.id] = 0;
  }

  const s: GameState = {
    seed,
    turn: 1,
    maxTurns: opts.maxTurns,
    mapSize: opts.size,
    tiles,
    units: {},
    cities: {},
    players,
    human: 0,
    current: 0,
    log: [],
    winner: null,
    victory: null,
    pendingGrowth: [],
    nextId: 1,
    wonders: [],
    rev: 0,
  };

  starts.forEach((st, i) => {
    if (i >= civs.length) return;
    foundCity(s, i, st.q, st.r, true);
    const spots = neighbors(st.q, st.r).filter((n) => {
      const t = tileAt(s, n.q, n.r);
      return t && !isWater(t.t) && t.t !== 'mountains';
    });
    spawnUnit(s, i, 'warrior', st.q, st.r);
    if (spots[0]) spawnUnit(s, i, 'warrior', spots[0].q, spots[0].r);
    if (spots[1]) spawnUnit(s, i, 'settler', spots[1].q, spots[1].r);
  });

  s.players.forEach((p) => updateVisibility(s, p.id));
  addLog(s, `Начало партии. Цель — ${opts.maxTurns} ходов.`, 'event');
  startTurn(s, 0);
  return s;
}

function startTechs(civ: CivKey): string[] {
  return civTechs(civ)
    .filter((t) => t.cost === 0)
    .map((t) => t.id);
}

export function spawnUnit(s: GameState, owner: number, type: string, q: number, r: number, veteran = false): Unit | null {
  const t = tileAt(s, q, r);
  if (!t) return null;
  if (unitAt(s, q, r)) return null;
  const def = UNITS[type];
  const u: Unit = {
    id: `u${s.nextId++}`,
    type,
    owner,
    q,
    r,
    hp: def.hp,
    mp: 0,
    acted: true,
    moved: true,
    kills: veteran ? 3 : 0,
    vet: veteran ? 1 : 0,
  };
  s.units[u.id] = u;
  return u;
}

export function foundCity(s: GameState, owner: number, q: number, r: number, capital = false): City {
  const p = s.players[owner];
  const owned = playerCities(s, owner).length;
  const names = CIVS[p.civ].cityNames;
  const city: City = {
    id: `c${s.nextId++}`,
    owner,
    q,
    r,
    name: names[owned % names.length] + (owned >= names.length ? ' II' : ''),
    level: capital ? 1 : has(p, 'rom_colon') ? 2 : 1,
    food: 0,
    hp: 15,
    capital,
    founder: owner,
    buildings: [],
    tiles: [],
  };
  s.cities[city.id] = city;
  const t = tileAt(s, q, r)!;
  t.city = city.id;
  t.special = null;
  claimTile(s, city, key(q, r));
  for (const n of neighbors(q, r)) {
    const nk = key(n.q, n.r);
    const nt = s.tiles[nk];
    if (nt && (nt.owner === null || nt.owner === undefined)) claimTile(s, city, nk);
  }
  city.hp = cityMaxHp(s, city);
  return city;
}

export function claimTile(s: GameState, city: City, k: string) {
  const t = s.tiles[k];
  if (!t) return;
  t.owner = city.owner;
  if (!city.tiles.includes(k)) city.tiles.push(k);
}

/* ------------------------------------------------------------------ */
/* Yields                                                              */
/* ------------------------------------------------------------------ */

export function canImprove(s: GameState, pid: number, t: Tile): boolean {
  if (!t.res || t.imp) return false;
  const p = s.players[pid];
  const res = RESOURCES[t.res];
  const gated = civGatedCaps(p.civ);
  if (!gated.includes(res.cap)) return true;
  return civTechs(p.civ).some((tech) => tech.caps?.includes(res.cap) && has(p, tech.id));
}

export function tileYield(s: GameState, t: Tile, p: Player) {
  const def = TERRAIN[t.t];
  let food = def.food;
  let stars = def.stars;
  let sci = def.sci;
  if (p.civ === 'gaul' && t.t === 'forest') food += 1;
  if (t.t === 'hills' && has(p, 'spa_quarry')) food += 1;
  if (t.t === 'forest' && has(p, 'gal_groves')) stars += 1;
  if (t.t === 'hills' && has(p, 'gal_stones')) sci += 2;
  if (t.t === 'forest' && has(p, 'gal_druids')) sci += 1;
  if ((t.t === 'coast' || t.t === 'reef') && has(p, 'pho_fishing')) food += 1;
  if ((t.t === 'coast' || t.t === 'reef') && has(p, 'pho_post')) stars += 1;
  if (t.t === 'hills' && ownsWonder(s, p.id, 'stonehenge')) sci += 1;
  if (t.res && t.imp) {
    const r = RESOURCES[t.res];
    food += r.food;
    stars += r.stars;
    sci += r.sci;
    if (t.res === 'ore' && has(p, 'spa_quarry')) stars += 1;
    if (t.res === 'ore' && has(p, 'gal_metal')) stars += 1;
  }
  if (t.special === 'village' && t.villageOwner === p.id) stars += 1;
  return { food, stars, sci };
}

export function ownsWonder(s: GameState, pid: number, w: string) {
  return playerCities(s, pid).some((c) => c.wonder === w);
}

export function cityIncome(s: GameState, city: City) {
  const p = s.players[city.owner];
  let food = 0;
  let stars = city.capital ? 3 : 2;
  let sci = city.capital ? 2 : 1;
  let culture = 0;

  for (const k of city.tiles) {
    const t = s.tiles[k];
    if (!t) continue;
    const y = tileYield(s, t, p);
    food += y.food;
    stars += y.stars;
    sci += y.sci;
  }
  stars += Math.floor(city.level / 2);
  if (has(p, 'spa_helots')) stars += Math.floor(city.level / 2);
  if (has(p, 'rom_empire')) stars += 1;
  if (has(p, 'pho_garrison')) stars += 1;
  if (has(p, 'gal_verc')) stars += 1;
  if (has(p, 'gal_oral')) sci += 1;
  if (has(p, 'gal_crown')) culture += 2;
  if (has(p, 'pho_carthage') && city.capital) stars += 5;
  if (city.buildings.includes('tribute')) stars += 1;

  const buildings = city.buildings.filter((b) => BUILDINGS[b]);
  for (const b of buildings) {
    if (b === 'workshop') stars += 2;
    else if (b === 'market') stars += 2 + Math.min(4, buildings.length - 1) + (has(p, 'spa_agora') ? 3 : 0);
    else if (b === 'library') sci += 2;
    else if (b === 'academy') sci += 4;
    else if (b === 'temple') {
      stars += 2;
      culture += 2;
    } else if (b === 'colosseum') {
      stars += 3;
      culture += 1;
    } else if (b === 'port') {
      stars += city.tiles.filter((k) => s.tiles[k] && isWater(s.tiles[k].t)).length;
    }
  }
  if (city.wonder === 'colossus') stars += 5;
  if (city.wonder === 'library_alex') sci += 5;
  if (city.wonder) culture += 2;

  if (p.civ === 'phoenicia' && neighbors(city.q, city.r).some((n) => s.tiles[key(n.q, n.r)] && isWater(s.tiles[key(n.q, n.r)].t)))
    stars += 1;
  if (has(p, 'rom_aqueduct'))
    food += neighbors(city.q, city.r).filter((n) => s.tiles[key(n.q, n.r)] && isWater(s.tiles[key(n.q, n.r)].t)).length;

  return { food, stars, sci, culture, upkeep: city.level * 2 };
}

export function roadConnectedCities(s: GameState, pid: number): number {
  const cap = playerCities(s, pid).find((c) => c.capital);
  if (!cap) return 0;
  const seen = new Set<string>([key(cap.q, cap.r)]);
  const queue = [key(cap.q, cap.r)];
  let count = 0;
  while (queue.length) {
    const cur = queue.shift()!;
    const t = s.tiles[cur];
    if (!t) continue;
    for (const n of neighbors(t.q, t.r)) {
      const nk = key(n.q, n.r);
      const nt = s.tiles[nk];
      if (!nt || seen.has(nk)) continue;
      const city = nt.city ? s.cities[nt.city] : null;
      if (nt.road || (city && city.owner === pid)) {
        seen.add(nk);
        queue.push(nk);
        if (city && city.owner === pid && !city.capital) count++;
      }
    }
  }
  return count;
}

export interface Income {
  stars: number;
  sci: number;
  culture: number;
  lines: { label: string; stars: number; sci: number }[];
}

export function playerIncome(s: GameState, pid: number): Income {
  const p = s.players[pid];
  let stars = 0;
  let sci = 0;
  let culture = 0;
  const lines: { label: string; stars: number; sci: number }[] = [];
  for (const c of playerCities(s, pid)) {
    const inc = cityIncome(s, c);
    stars += inc.stars;
    sci += inc.sci;
    culture += inc.culture;
    lines.push({ label: `${c.name} (ур. ${c.level})`, stars: inc.stars, sci: inc.sci });
  }
  const villages = Object.values(s.tiles).filter((t) => t.special === 'village' && t.villageOwner === pid).length;
  if (villages) {
    stars += villages;
    lines.push({ label: `Деревни ×${villages}`, stars: villages, sci: 0 });
  }
  const cities = playerCities(s, pid).length;
  if (has(p, 'pho_routes') && cities > 1) {
    const v = 2 * (cities - 1);
    stars += v;
    lines.push({ label: 'Торговые пути', stars: v, sci: 0 });
  }
  if (has(p, 'spa_agora') && cities > 1) {
    const v = 2 * (cities - 1);
    stars += v;
    lines.push({ label: 'Агора: связи городов', stars: v, sci: 0 });
  }
  if (p.civ === 'rome') {
    const v = roadConnectedCities(s, pid);
    if (v) {
      stars += v;
      lines.push({ label: 'Дороги в столицу', stars: v, sci: 0 });
    }
  }
  const trades = Object.entries(p.trade).filter(([, v]) => v).length;
  if (trades) {
    stars += trades;
    lines.push({ label: `Торговые соглашения ×${trades}`, stars: trades, sci: 0 });
  }
  if (has(p, 'pho_exchange')) {
    const v = Math.max(cities, Math.round(stars * 0.1));
    stars += v;
    lines.push({ label: 'Биржа (+10%)', stars: v, sci: 0 });
  }
  if (has(p, 'spa_helots')) {
    const v = -Math.round(sci * 0.1);
    sci += v;
    lines.push({ label: 'Илоты (−10% науки)', stars: 0, sci: v });
  }
  if (has(p, 'gal_crown')) {
    const v = Math.round(sci * 0.25);
    sci += v;
    lines.push({ label: 'Арвернская корона (+25%)', stars: 0, sci: v });
  }
  return { stars, sci, culture, lines };
}

/* ------------------------------------------------------------------ */
/* Cities                                                              */
/* ------------------------------------------------------------------ */

export function cityMaxHp(s: GameState, c: City) {
  const p = s.players[c.owner];
  let hp = 10 + 5 * c.level;
  if (c.buildings.includes('walls')) hp *= 2;
  if (has(p, 'rom_masonry')) hp = Math.round(hp * 1.5);
  if (has(p, 'rom_concrete')) hp = Math.round(hp * 1.25);
  if (has(p, 'pho_garrison')) hp = Math.round(hp * 1.5);
  return Math.round(hp);
}

export function cityDefense(s: GameState, c: City) {
  const p = s.players[c.owner];
  let d = 2 + c.level;
  if (c.buildings.includes('walls')) d += 3;
  if (has(p, 'rom_concrete')) d += 2;
  if (ownsWonder(s, c.owner, 'great_wall')) d += 2;
  return d;
}

export function growthOptions(s: GameState, city: City): string[] {
  const out = new Set<string>();
  for (const k of city.tiles) {
    const t = s.tiles[k];
    if (!t) continue;
    for (const n of neighbors(t.q, t.r)) {
      const nk = key(n.q, n.r);
      const nt = s.tiles[nk];
      if (!nt || nt.owner !== null && nt.owner !== undefined) continue;
      if (hexDist(nt.q, nt.r, city.q, city.r) > 3) continue;
      out.add(nk);
    }
  }
  return [...out];
}

export function levelReward(level: number): GrowthChoice['reward'] {
  if (level === 3) return 'building';
  if (level === 4) return 'slot';
  if (level === 5) return 'wonder';
  return 'star';
}

export function growCity(s: GameState, city: City) {
  city.level += 1;
  city.hp = cityMaxHp(s, city);
  const choice: GrowthChoice = {
    cityId: city.id,
    level: city.level,
    options: growthOptions(s, city),
    reward: levelReward(city.level),
  };
  const p = s.players[city.owner];
  if (p.isAI) {
    autoResolveGrowth(s, choice);
  } else {
    s.pendingGrowth.push(choice);
  }
  addLog(s, `🏙️ ${city.name} вырос до уровня ${city.level}`, city.owner === s.human ? 'good' : 'info');
}

export function applyGrowth(s: GameState, choice: GrowthChoice, tileKey: string | null, extra?: string) {
  const city = s.cities[choice.cityId];
  if (!city) return;
  const p = s.players[city.owner];
  if (tileKey && s.tiles[tileKey]) claimTile(s, city, tileKey);
  if (choice.reward === 'star') p.stars += 3;
  else if (choice.reward === 'slot') p.extraSlots += 1;
  else if (choice.reward === 'building' && extra && !city.buildings.includes(extra)) city.buildings.push(extra);
  else if (choice.reward === 'wonder' && extra && !s.wonders.includes(extra)) {
    city.wonder = extra;
    s.wonders.push(extra);
    addLog(s, `🏛️ ${p.name}: построено чудо «${WONDERS[extra].name}» в городе ${city.name}`, 'event');
  }
  city.hp = cityMaxHp(s, city);
}

export function autoResolveGrowth(s: GameState, choice: GrowthChoice) {
  const city = s.cities[choice.cityId];
  if (!city) return;
  const p = s.players[city.owner];
  let best: string | null = null;
  let bestScore = -99;
  for (const k of choice.options) {
    const t = s.tiles[k];
    if (!t) continue;
    const y = tileYield(s, t, p);
    let score = y.food * 1.5 + y.stars * 1.3 + y.sci;
    if (t.res) score += 2;
    if (isWater(t.t) && p.civ !== 'phoenicia') score -= 1.5;
    score -= hexDist(t.q, t.r, city.q, city.r) * 0.3;
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  let extra: string | undefined;
  if (choice.reward === 'building') {
    const opts = ['library', 'barracks', 'workshop'].filter((b) => !city.buildings.includes(b));
    extra = opts[0];
  } else if (choice.reward === 'wonder') {
    extra = Object.keys(WONDERS).find((w) => !s.wonders.includes(w));
  }
  applyGrowth(s, choice, best, extra);
}

export function buildingCost(s: GameState, pid: number, b: string) {
  const p = s.players[pid];
  let cost = BUILDINGS[b].cost;
  if (b === 'barracks' && p.civ === 'sparta') cost = Math.round(cost * 0.5);
  if (has(p, 'rom_law')) cost = Math.round(cost * 0.85);
  return cost;
}

export function availableBuildings(s: GameState, city: City): string[] {
  const p = s.players[city.owner];
  return Object.keys(BUILDINGS).filter((b) => {
    const d = BUILDINGS[b];
    if (city.buildings.includes(b)) return false;
    if (d.civ && d.civ !== p.civ) return false;
    if (d.banCiv && d.banCiv === p.civ) return false;
    if (d.req && !city.buildings.includes(d.req)) return false;
    if (b === 'port' && !city.tiles.some((k) => s.tiles[k] && isWater(s.tiles[k].t))) return false;
    return true;
  });
}

export function buyBuilding(s: GameState, city: City, b: string): string | null {
  const p = s.players[city.owner];
  const cost = buildingCost(s, city.owner, b);
  if (p.stars < cost) return 'Не хватает звёзд';
  if (!availableBuildings(s, city).includes(b)) return 'Недоступно';
  p.stars -= cost;
  city.buildings.push(b);
  city.hp = cityMaxHp(s, city);
  addLog(s, `${BUILDINGS[b].icon} ${city.name}: построено «${BUILDINGS[b].name}»`, 'info');
  return null;
}

export function buyWonder(s: GameState, city: City, w: string): string | null {
  const p = s.players[city.owner];
  if (city.wonder) return 'В городе уже есть чудо';
  if (city.level < 4) return 'Нужен город 4+ уровня';
  if (s.wonders.includes(w)) return 'Это чудо уже построено';
  if (p.stars < WONDER_COST) return 'Не хватает звёзд';
  p.stars -= WONDER_COST;
  city.wonder = w;
  s.wonders.push(w);
  addLog(s, `🏛️ ${p.name}: чудо «${WONDERS[w].name}» построено в ${city.name}`, 'event');
  return null;
}

/* ------------------------------------------------------------------ */
/* Units                                                               */
/* ------------------------------------------------------------------ */

export function unitCost(s: GameState, pid: number, type: string, city?: City) {
  const p = s.players[pid];
  const d = UNITS[type];
  let cost = d.cost;
  if (p.civ === 'sparta' && d.inf) cost -= 2;
  if (p.civ === 'phoenicia' && d.naval) cost -= 2;
  if (d.settler && has(p, 'rom_colon')) cost = Math.round(cost * 0.5);
  if (d.settler && has(p, 'pho_colon')) cost -= 2;
  if (has(p, 'pho_merc') && city && city.buildings.includes('tribute')) cost = Math.round(cost * 0.75);
  return Math.max(1, cost);
}

export function unitSlots(s: GameState, pid: number) {
  const p = s.players[pid];
  const cities = playerCities(s, pid);
  let slots = 4 + cities.length * 2 + p.extraSlots;
  if (has(p, 'rom_empire')) slots += 2;
  if (has(p, 'pho_carthage')) slots += cities.length;
  if (has(p, 'gal_verc')) slots += cities.length;
  return slots;
}

export function availableUnits(s: GameState, city: City): string[] {
  const p = s.players[city.owner];
  const hasPort = city.buildings.includes('port');
  const nearWater = city.tiles.some((k) => s.tiles[k] && isWater(s.tiles[k].t));
  return Object.keys(UNITS).filter((u) => {
    const d = UNITS[u];
    if (d.civ && d.civ !== p.civ) return false;
    if (d.tech && !has(p, d.tech)) return false;
    if (d.hero || d.limit) {
      const existing = playerUnits(s, p.id).filter((x) => x.type === u).length;
      if (existing >= (d.limit ?? 1)) return false;
    }
    if (d.naval) {
      if (!nearWater) return false;
      if (!hasPort && p.civ !== 'phoenicia') return false;
    }
    return true;
  });
}

export function buyUnit(s: GameState, city: City, type: string): string | null {
  const p = s.players[city.owner];
  const cost = unitCost(s, city.owner, type, city);
  if (p.stars < cost) return 'Не хватает звёзд';
  if (!availableUnits(s, city).includes(type)) return 'Юнит недоступен';
  if (playerUnits(s, p.id).length >= unitSlots(s, p.id)) return 'Достигнут лимит юнитов';
  const d = UNITS[type];
  let spot: { q: number; r: number } | null = null;
  const center = { q: city.q, r: city.r };
  if (!d.naval && !unitAt(s, center.q, center.r)) spot = center;
  if (!spot) {
    for (const k of city.tiles) {
      const t = s.tiles[k];
      if (!t || unitAt(s, t.q, t.r)) continue;
      if (d.naval && !isWater(t.t)) continue;
      if (!d.naval && (isWater(t.t) || t.t === 'mountains')) continue;
      spot = { q: t.q, r: t.r };
      break;
    }
  }
  if (!spot) return 'Нет свободной клетки';
  const vet = city.buildings.includes('barracks') || has(p, 'spa_school');
  const u = spawnUnit(s, p.id, type, spot.q, spot.r, vet);
  if (!u) return 'Нет свободной клетки';
  p.stars -= cost;
  updateVisibility(s, p.id);
  addLog(s, `${d.icon} ${city.name}: нанят ${d.name} (−${cost}★)`, 'info');
  return null;
}

export function unitMaxMp(s: GameState, u: Unit) {
  const p = s.players[u.owner];
  const d = UNITS[u.type];
  let mv = d.mv;
  if (d.inf && has(p, 'spa_300')) mv += 1;
  if (d.naval && has(p, 'pho_fleet')) mv += 1;
  return mv;
}

export function moveCost(s: GameState, u: Unit, from: Tile, to: Tile): number | null {
  const p = s.players[u.owner];
  const d = UNITS[u.type];
  if (d.naval) {
    if (!isWater(to.t)) {
      const c = to.city ? s.cities[to.city] : null;
      if (!(c && c.owner === u.owner && c.buildings.includes('port'))) return null;
      return 1;
    }
    return TERRAIN[to.t].move;
  }
  if (isWater(to.t)) return null;
  if (to.t === 'mountains' && !(p.civ === 'gaul' && has(p, 'gal_stones'))) return null;
  let cost = TERRAIN[to.t].move;
  if (to.t === 'forest' && (p.civ === 'gaul' || (d.cav && u.type === 'grider'))) cost = 1;
  if (to.road && (from.road || from.city)) cost = 0.5;
  if (to.city) cost = Math.min(cost, 1);
  return cost;
}

export interface ReachEntry {
  cost: number;
  from: string | null;
}

export function computeReachable(s: GameState, u: Unit): Record<string, ReachEntry> {
  const out: Record<string, ReachEntry> = {};
  const start = key(u.q, u.r);
  out[start] = { cost: 0, from: null };
  if (u.acted || u.mp <= 0) return out;
  const frontier: string[] = [start];
  while (frontier.length) {
    frontier.sort((a, b) => out[a].cost - out[b].cost);
    const cur = frontier.shift()!;
    const curCost = out[cur].cost;
    if (curCost >= u.mp) continue;
    const ct = s.tiles[cur];
    for (const n of neighbors(ct.q, ct.r)) {
      const nk = key(n.q, n.r);
      const nt = s.tiles[nk];
      if (!nt) continue;
      const c = moveCost(s, u, ct, nt);
      if (c === null) continue;
      const other = unitAt(s, nt.q, nt.r);
      if (other) continue;
      const city = nt.city ? s.cities[nt.city] : null;
      if (city && city.owner !== u.owner) {
        if (city.hp > 0 || UNITS[u.type].naval) continue;
      }
      const total = Math.min(u.mp, curCost + c);
      if (out[nk] === undefined || total < out[nk].cost) {
        out[nk] = { cost: total, from: cur };
        frontier.push(nk);
      }
    }
  }
  return out;
}

export function moveUnit(s: GameState, u: Unit, targetKey: string, reach?: Record<string, ReachEntry>) {
  const r = reach ?? computeReachable(s, u);
  const entry = r[targetKey];
  if (!entry) return false;
  const t = s.tiles[targetKey];
  if (!t) return false;
  u.q = t.q;
  u.r = t.r;
  u.mp = Math.max(0, u.mp - entry.cost);
  u.moved = true;
  onEnterTile(s, u, t);
  if (u.mp <= 0) u.acted = true;
  updateVisibility(s, u.owner);
  return true;
}

function onEnterTile(s: GameState, u: Unit, t: Tile) {
  const p = s.players[u.owner];
  if (t.special === 'ruins') {
    t.special = null;
    if (p.barb) return;
    const roll = Math.random();
    if (roll < 0.35) {
      p.stars += 8;
      addLog(s, `🏺 ${p.name}: в древних руинах найдено 8 звёзд`, p.id === s.human ? 'good' : 'info');
    } else if (roll < 0.6) {
      p.science += 20;
      addLog(s, `🏺 ${p.name}: древние знания дали 20 науки`, p.id === s.human ? 'good' : 'info');
    } else if (roll < 0.85) {
      const spot = neighbors(t.q, t.r).find((n) => {
        const nt = s.tiles[key(n.q, n.r)];
        return nt && !isWater(nt.t) && nt.t !== 'mountains' && !unitAt(s, n.q, n.r);
      });
      if (spot) spawnUnit(s, p.id, 'warrior', spot.q, spot.r);
      addLog(s, `🏺 ${p.name}: в руинах найден отряд воинов`, p.id === s.human ? 'good' : 'info');
    } else {
      u.hp = UNITS[u.type].hp;
      p.stars += 4;
      addLog(s, `🏺 ${p.name}: руины восстановили отряд`, p.id === s.human ? 'good' : 'info');
    }
  }
  if (t.special === 'village' && t.villageOwner !== u.owner) {
    t.villageOwner = u.owner;
    u.acted = true;
    u.mp = 0;
    const spot = neighbors(t.q, t.r).find((n) => {
      const nt = s.tiles[key(n.q, n.r)];
      return nt && !isWater(nt.t) && nt.t !== 'mountains' && !unitAt(s, n.q, n.r);
    });
    if (spot && !p.barb) spawnUnit(s, u.owner, 'warrior', spot.q, spot.r);
    addLog(s, `🏘️ ${p.name} захватил деревню (+1★/ход)`, u.owner === s.human ? 'good' : 'info');
  }
  if (t.special === 'barbarians' && !p.barb) {
    t.special = null;
    p.stars += 10;
    addLog(s, `💀 ${p.name} разорил стойбище варваров (+10★)`, u.owner === s.human ? 'good' : 'info');
  }
  if (t.special === 'pirates' && !p.barb) {
    t.special = null;
    p.stars += 15;
    addLog(s, `🏴‍☠️ ${p.name} уничтожил пиратское логово (+15★)`, u.owner === s.human ? 'good' : 'info');
  }
  const city = t.city ? s.cities[t.city] : null;
  if (city && city.owner !== u.owner && city.hp <= 0) captureCity(s, city, u.owner);
}

export function captureCity(s: GameState, city: City, byPlayer: number) {
  const old = s.players[city.owner];
  const p = s.players[byPlayer];
  city.owner = byPlayer;
  city.level = Math.max(1, city.level - 1);
  city.hp = Math.max(1, Math.round(cityMaxHp(s, city) / 2));
  for (const k of city.tiles) if (s.tiles[k]) s.tiles[k].owner = byPlayer;
  if (p.civ === 'sparta') p.stars += 2;
  if (p.civ === 'phoenicia' && !city.buildings.includes('tribute')) city.buildings.push('tribute');
  addLog(s, `🔥 ${p.name} захватил город ${city.name} (${old.name})`, 'war');
  checkElimination(s, old.id);
}

export function checkElimination(s: GameState, pid: number) {
  const p = s.players[pid];
  if (p.barb || !p.alive) return;
  if (playerCities(s, pid).length === 0) {
    p.alive = false;
    for (const u of playerUnits(s, pid)) delete s.units[u.id];
    addLog(s, `☠️ ${p.name} уничтожены!`, 'war');
  }
}

/* ------------------------------------------------------------------ */
/* Combat                                                             */
/* ------------------------------------------------------------------ */

export function unitAtkValue(s: GameState, u: Unit) {
  const p = s.players[u.owner];
  const d = UNITS[u.type];
  let a = d.atk + (u.vet >= 1 ? 1 : 0) + (u.vet >= 2 ? 1 : 0);
  if (d.inf && has(p, 'gal_metal')) a += 1;
  if (u.type === 'gaesatae' && u.hp < UNITS.gaesatae.hp / 2) a += 1;
  return a;
}

export function unitDefValue(_s: GameState, u: Unit) {
  const d = UNITS[u.type];
  return d.def + (u.vet >= 2 ? 1 : 0);
}

function adjacentFriends(s: GameState, u: Unit) {
  return neighbors(u.q, u.r)
    .map((n) => unitAt(s, n.q, n.r))
    .filter((x): x is Unit => !!x && x.owner === u.owner);
}

export function attackTargets(s: GameState, u: Unit): string[] {
  const d = UNITS[u.type];
  if (u.acted || d.settler || d.atk === 0) return [];
  if (d.siege && u.moved && u.mp < unitMaxMp(s, u)) return [];
  const out: string[] = [];
  for (const h of inRadius(u.q, u.r, d.rng)) {
    const t = s.tiles[key(h.q, h.r)];
    if (!t) continue;
    if (hexDist(u.q, u.r, t.q, t.r) === 0) continue;
    const target = unitAt(s, t.q, t.r);
    if (target && target.owner !== u.owner) {
      const targetNaval = UNITS[target.type].naval;
      if (targetNaval && !d.naval && d.rng < 2) continue;
      out.push(key(t.q, t.r));
      continue;
    }
    const city = t.city ? s.cities[t.city] : null;
    if (city && city.owner !== u.owner && city.hp > 0 && !d.naval) out.push(key(t.q, t.r));
    else if (city && city.owner !== u.owner && city.hp > 0 && d.naval && d.rng >= 2) out.push(key(t.q, t.r));
  }
  return out;
}

/** Масштаб урона: без него базовая формула даёт 1 урон в ход и бои длятся вечно. */
export const DAMAGE_SCALE = 4;

function damageFormula(atk: number, def: number, mods: number) {
  const raw = atk * (atk / (atk + def)) * DAMAGE_SCALE * mods * (0.9 + Math.random() * 0.2);
  return Math.max(1, Math.floor(raw));
}

export interface CombatResult {
  damage: number;
  retaliation: number;
  killed: boolean;
  attackerDied: boolean;
  captured: boolean;
  text: string;
}

export function resolveAttack(s: GameState, u: Unit, targetKey: string): CombatResult {
  const t = s.tiles[targetKey];
  const p = s.players[u.owner];
  const d = UNITS[u.type];
  const res: CombatResult = { damage: 0, retaliation: 0, killed: false, attackerDied: false, captured: false, text: '' };
  const target = unitAt(s, t.q, t.r);
  const city = t.city ? s.cities[t.city] : null;
  const enemyId = target ? target.owner : city ? city.owner : -1;
  if (enemyId >= 0 && !atWar(s, u.owner, enemyId) && !s.players[enemyId].barb && !p.barb) declareWar(s, u.owner, enemyId);

  let atk = unitAtkValue(s, u);
  let mods = 1;

  // hero aura
  if (adjacentFriends(s, u).some((f) => UNITS[f.type].hero)) mods *= 1.15;
  // gallic ambush
  const myTile = s.tiles[key(u.q, u.r)];
  if (has(p, 'gal_ambush') && myTile.t === 'forest') mods *= 1.5;
  if (d.naval && has(p, 'pho_fleet')) mods *= 1.25;

  if (target) {
    const td = UNITS[target.type];
    const defTile = s.tiles[key(target.q, target.r)];
    let def = unitDefValue(s, target);
    let defMods = 1 + TERRAIN[defTile.t].def;
    const tp = s.players[target.owner];
    if (target.type === 'spearman' && d.cav) defMods *= 1.5;
    if (has(tp, 'rom_triarii') && (d.cav || d.rng > 1)) defMods *= 1.3;
    if (has(tp, 'spa_formation') && adjacentFriends(s, target).length > 0) defMods *= 1.1;
    if (has(tp, 'spa_phalanx') && td.inf) {
      const inf = adjacentFriends(s, target).filter((f) => UNITS[f.type].inf).length;
      defMods *= 1 + 0.2 * Math.min(2, inf);
    }
    const defCity = defTile.city ? s.cities[defTile.city] : null;
    if (defCity && defCity.owner === target.owner) {
      defMods *= 1.25;
      if (defCity.buildings.includes('walls') && !d.siege) mods *= 0.5;
    }
    if (u.type === 'bireme' && td.naval) mods *= 1.5;
    // flanking
    const flank = neighbors(target.q, target.r)
      .map((n) => unitAt(s, n.q, n.r))
      .filter((x) => x && x.owner === u.owner && x.id !== u.id).length;
    mods *= 1 + 0.1 * Math.min(3, flank);

    def = def * defMods;
    const dmg = damageFormula(atk, def, mods);
    target.hp -= dmg;
    res.damage = dmg;
    if (target.hp <= 0) {
      res.killed = true;
      onUnitKilled(s, target, u);
    } else if (hexDist(u.q, u.r, target.q, target.r) === 1 && d.rng === 1) {
      const rAtk = unitAtkValue(s, target);
      const myDef = unitDefValue(s, u) * (1 + TERRAIN[myTile.t].def);
      const back = Math.max(1, Math.floor(damageFormula(rAtk, myDef, 1) * 0.5));
      u.hp -= back;
      res.retaliation = back;
      if (u.hp <= 0) {
        res.attackerDied = true;
        onUnitKilled(s, u, target);
      }
    }
    res.text = `${d.name} → ${UNITS[target.type].name}: −${res.damage} HP${res.killed ? ' ☠️' : ''}${
      res.retaliation ? `, ответ −${res.retaliation}` : ''
    }`;
  } else if (city) {
    let def = cityDefense(s, city);
    if (city.buildings.includes('walls') && !d.siege) mods *= 0.5;
    if (d.siege) {
      if (u.type === 'onager') mods *= 2.5;
      else if (u.type === 'ballista' && city.buildings.includes('walls')) mods *= 2;
      else mods *= 1.5;
    }
    const dmg = damageFormula(atk, def, mods);
    city.hp = Math.max(0, city.hp - dmg);
    res.damage = dmg;
    res.text = `${d.name} → ${city.name}: −${dmg} HP`;
    if (city.hp <= 0 && d.rng === 1 && hexDist(u.q, u.r, city.q, city.r) === 1) {
      captureCity(s, city, u.owner);
      u.q = city.q;
      u.r = city.r;
      res.captured = true;
      res.text += ' — город взят!';
    } else if (city.hp > 0 && city.buildings.includes('walls') && hexDist(u.q, u.r, city.q, city.r) === 1) {
      const back = Math.max(1, Math.floor(damageFormula(cityDefense(s, city), unitDefValue(s, u), 1) * 0.5));
      u.hp -= back;
      res.retaliation = back;
      if (u.hp <= 0) {
        res.attackerDied = true;
        onUnitKilled(s, u, null);
      }
      res.text += `, стены бьют в ответ −${back}`;
    }
  }
  u.acted = true;
  if (d.cav && !res.attackerDied && u.mp > 0) {
    u.acted = false;
    u.mp = Math.min(u.mp, 1);
  } else {
    u.mp = 0;
  }
  updateVisibility(s, u.owner);
  return res;
}

function onUnitKilled(s: GameState, dead: Unit, killer: Unit | null) {
  const dd = UNITS[dead.type];
  delete s.units[dead.id];
  if (killer) {
    killer.kills += 1;
    if (killer.kills >= 6) killer.vet = 2;
    else if (killer.kills >= 3) killer.vet = Math.max(killer.vet, 1);
  }
  if (dd.hero) {
    const p = s.players[dead.owner];
    if (dead.type === 'leonidas') {
      for (const c of playerCities(s, dead.owner)) {
        c.level = Math.max(1, c.level - 1);
        c.hp = Math.min(c.hp, cityMaxHp(s, c));
      }
      addLog(s, `👑 Леонид пал! Города ${p.name} теряют уровень`, 'bad');
    } else if (dead.type === 'vercingetorix') {
      p.heroRespawn = s.turn + 5;
      addLog(s, `🌟 Верцингеторикс пал, но вернётся через 5 ходов`, 'bad');
    }
  }
}

/* ------------------------------------------------------------------ */
/* Turn flow                                                          */
/* ------------------------------------------------------------------ */

export function updateVisibility(s: GameState, pid: number) {
  const p = s.players[pid];
  if (!p) return;
  const mark = (q: number, r: number, rad: number) => {
    for (const h of inRadius(q, r, rad)) {
      const k = key(h.q, h.r);
      if (s.tiles[k]) p.explored[k] = 1;
    }
  };
  for (const u of playerUnits(s, pid)) mark(u.q, u.r, UNITS[u.type].cav || UNITS[u.type].naval ? 3 : 2);
  for (const c of playerCities(s, pid)) mark(c.q, c.r, 3);
}

export function visibleSet(s: GameState, pid: number): Set<string> {
  const out = new Set<string>();
  const mark = (q: number, r: number, rad: number) => {
    for (const h of inRadius(q, r, rad)) out.add(key(h.q, h.r));
  };
  for (const u of playerUnits(s, pid)) mark(u.q, u.r, UNITS[u.type].cav || UNITS[u.type].naval ? 3 : 2);
  for (const c of playerCities(s, pid)) mark(c.q, c.r, 3);
  return out;
}

export function startTurn(s: GameState, pid: number) {
  const p = s.players[pid];
  if (!p || !p.alive) return;
  if (!p.barb) {
    const inc = playerIncome(s, pid);
    p.stars += inc.stars;
    p.science += inc.sci;
    p.culture += inc.culture;

    for (const c of playerCities(s, pid)) {
      const ci = cityIncome(s, c);
      const net = ci.food - ci.upkeep;
      c.food += net;
      if (c.food < 0) c.food = 0;
      let guard = 0;
      while (c.food >= foodNeeded(c.level) && guard < 3) {
        c.food -= foodNeeded(c.level);
        growCity(s, c);
        guard++;
      }
      if (c.hp < cityMaxHp(s, c)) c.hp = Math.min(cityMaxHp(s, c), c.hp + 3);
    }
    if (p.heroRespawn && s.turn >= p.heroRespawn) {
      const cap = playerCities(s, pid).find((c) => c.capital) ?? playerCities(s, pid)[0];
      if (cap && !unitAt(s, cap.q, cap.r)) {
        spawnUnit(s, pid, 'vercingetorix', cap.q, cap.r);
        p.heroRespawn = undefined;
        addLog(s, `🌟 Верцингеторикс вернулся в строй!`, 'good');
      }
    }
  } else {
    spawnBarbarians(s);
  }

  // healing + reset
  for (const u of playerUnits(s, pid)) {
    if (!u.acted) {
      const t = s.tiles[key(u.q, u.r)];
      let heal = 1;
      if (t && t.owner === pid) heal = 3;
      if (t && t.city && s.cities[t.city].owner === pid) heal = 6;
      if (u.type === 'spartiate') heal += 3;
      if (UNITS[u.type].naval && has(p, 'pho_fleet') && t && t.city && s.cities[t.city].owner === pid) heal += 4;
      u.hp = Math.min(UNITS[u.type].hp, u.hp + heal);
    }
    u.acted = false;
    u.moved = false;
    u.mp = unitMaxMp(s, u);
  }
  // druid healing
  for (const dr of playerUnits(s, pid).filter((x) => x.type === 'druid')) {
    for (const n of neighbors(dr.q, dr.r)) {
      const f = unitAt(s, n.q, n.r);
      if (f && f.owner === pid) f.hp = Math.min(UNITS[f.type].hp, f.hp + 3);
    }
  }
  updateVisibility(s, pid);
}

function spawnBarbarians(s: GameState) {
  const barb = s.players[s.players.length - 1];
  for (const t of Object.values(s.tiles)) {
    if (t.special !== 'barbarians' && t.special !== 'pirates') continue;
    t.timer = (t.timer ?? 5) - 1;
    if (t.timer > 0) continue;
    t.timer = 5;
    const naval = t.special === 'pirates';
    const spot = neighbors(t.q, t.r).find((n) => {
      const nt = s.tiles[key(n.q, n.r)];
      if (!nt || unitAt(s, n.q, n.r)) return false;
      return naval ? isWater(nt.t) : !isWater(nt.t) && nt.t !== 'mountains';
    });
    if (!spot) continue;
    const type = naval ? 'trireme' : Math.random() < 0.3 ? 'horseman' : 'warrior';
    const u = spawnUnit(s, barb.id, type, spot.q, spot.r);
    if (u) {
      u.acted = false;
      u.mp = unitMaxMp(s, u);
    }
  }
}

export const EVENTS = [
  {
    id: 'harvest',
    text: '🌾 Богатый урожай! Все города получают +6 пищи.',
    apply: (s: GameState) => {
      for (const c of Object.values(s.cities)) c.food += 6;
    },
  },
  {
    id: 'trade',
    text: '🏺 Открыт великий торговый путь: все державы получают +10 звёзд.',
    apply: (s: GameState) => {
      for (const p of s.players) if (!p.barb) p.stars += 10;
    },
  },
  {
    id: 'raid',
    text: '💀 Нашествие варваров! Стойбища извергают орды.',
    apply: (s: GameState) => {
      for (const t of Object.values(s.tiles)) if (t.special === 'barbarians' || t.special === 'pirates') t.timer = 1;
    },
  },
  {
    id: 'muses',
    text: '📜 Век мудрецов: все державы получают +25 науки.',
    apply: (s: GameState) => {
      for (const p of s.players) if (!p.barb) p.science += 25;
    },
  },
  {
    id: 'revolt',
    text: '🔥 Голодные бунты: города без запаса пищи теряют 1 уровень.',
    apply: (s: GameState) => {
      for (const c of Object.values(s.cities)) {
        if (c.food <= 0 && c.level > 1) c.level -= 1;
      }
    },
  },
];

export function playerScore(s: GameState, pid: number) {
  const cities = playerCities(s, pid);
  const levels = cities.reduce((a, c) => a + c.level, 0);
  const wonders = cities.filter((c) => c.wonder).length;
  const units = playerUnits(s, pid).length;
  const techs = s.players[pid].techs.length;
  return cities.length + levels * 2 + wonders * 3 + units + techs;
}

export function checkVictory(s: GameState) {
  if (s.winner !== null) return;
  const real = s.players.filter((p) => !p.barb);
  const alive = real.filter((p) => p.alive);
  if (alive.length === 1 && real.length > 1) {
    s.winner = alive[0].id;
    s.victory = 'Доминирование';
    return;
  }
  const allCities = Object.values(s.cities);
  for (const p of alive) {
    const mine = playerCities(s, p.id);
    const caps = allCities.filter((c) => c.capital);
    if (caps.length > 1 && caps.every((c) => c.owner === p.id)) {
      s.winner = p.id;
      s.victory = 'Доминирование (все столицы)';
      return;
    }
    const conquered = mine.some((c) => c.founder !== undefined && c.founder !== p.id);
    if (
      allCities.length >= 6 &&
      s.turn >= 12 &&
      conquered &&
      mine.length >= Math.ceil((allCities.length * 2) / 3) &&
      alive.length > 1
    ) {
      s.winner = p.id;
      s.victory = 'Доминирование (2/3 городов)';
      return;
    }
    const all = civTechs(p.civ);
    if (all.every((t) => has(p, t.id))) {
      s.winner = p.id;
      s.victory = 'Научная победа';
      return;
    }
    if (p.stars >= 300 && mine.filter((c) => c.wonder).length >= 2) {
      s.winner = p.id;
      s.victory = 'Экономическая победа';
      return;
    }
  }
  if (s.turn > s.maxTurns) {
    let best = alive[0];
    for (const p of alive) if (playerScore(s, p.id) > playerScore(s, best.id)) best = p;
    s.winner = best.id;
    s.victory = 'Победа по очкам';
  }
}

export function research(s: GameState, pid: number, techId: string): string | null {
  const p = s.players[pid];
  const branches = CIVS[p.civ].branches;
  for (const br of branches) {
    const idx = br.techs.findIndex((t) => t.id === techId);
    if (idx < 0) continue;
    const tech = br.techs[idx];
    if (has(p, techId)) return 'Уже изучено';
    if (idx > 0 && !has(p, br.techs[idx - 1].id)) return 'Нужна предыдущая технология ветки';
    if (p.science < tech.cost) return 'Не хватает науки';
    p.science -= tech.cost;
    p.techs.push(techId);
    addLog(s, `🔬 ${p.name} изучил «${tech.name}»`, pid === s.human ? 'good' : 'info');
    return null;
  }
  return 'Технология не найдена';
}

export function improveTile(s: GameState, pid: number, k: string): string | null {
  const t = s.tiles[k];
  const p = s.players[pid];
  if (!t || !t.res) return 'Нет ресурса';
  if (t.owner !== pid) return 'Клетка вне ваших границ';
  if (t.imp) return 'Уже освоено';
  if (!canImprove(s, pid, t)) return 'Нужна технология';
  const cost = RESOURCES[t.res].cost;
  if (p.stars < cost) return 'Не хватает звёзд';
  p.stars -= cost;
  t.imp = true;
  addLog(s, `${RESOURCES[t.res].icon} Освоен ресурс: ${RESOURCES[t.res].name}`, 'info');
  return null;
}

export function buildRoad(s: GameState, pid: number, k: string): string | null {
  const t = s.tiles[k];
  const p = s.players[pid];
  if (p.civ !== 'rome') return 'Только римляне строят дороги';
  if (!t || t.owner !== pid) return 'Клетка вне ваших границ';
  if (isWater(t.t) || t.t === 'mountains') return 'Нельзя здесь';
  if (t.road) return 'Дорога уже есть';
  t.road = true;
  return null;
}

export function chopForest(s: GameState, pid: number, k: string): string | null {
  const t = s.tiles[k];
  const p = s.players[pid];
  if (!has(p, 'gal_logging')) return 'Нужна Лесозаготовка';
  if (!t || t.owner !== pid || t.t !== 'forest') return 'Нужен свой лес';
  t.t = 'plains';
  if (t.res === 'game') t.res = null;
  p.stars += 8;
  addLog(s, `🪓 Лес вырублен: +8★`, 'info');
  return null;
}

export function drainSwamp(s: GameState, pid: number, k: string): string | null {
  const t = s.tiles[k];
  const p = s.players[pid];
  if (p.civ !== 'phoenicia') return 'Только финикийцы умеют осушать';
  if (!t || t.owner !== pid || t.t !== 'swamp') return 'Нужно своё болото';
  if (p.stars < 5) return 'Нужно 5★';
  p.stars -= 5;
  t.t = 'plains';
  if (t.res === 'spices') t.res = null;
  return null;
}

export function canFoundCity(s: GameState, u: Unit): string | null {
  const p = s.players[u.owner];
  const t = s.tiles[key(u.q, u.r)];
  if (!UNITS[u.type].settler) return 'Не колонист';
  if (!t) return 'Нет клетки';
  if (t.city) return 'Здесь уже город';
  if (t.t === 'mountains') return 'Нельзя в горах';
  if (isWater(t.t) && !(p.civ === 'phoenicia' && t.t === 'coast')) return 'Нельзя на воде';
  if (t.owner !== null && t.owner !== undefined && t.owner !== u.owner) return 'Чужая территория';
  const near = Object.values(s.cities).some((c) => hexDist(c.q, c.r, u.q, u.r) < 3);
  if (near) return 'Слишком близко к другому городу';
  return null;
}

export function doFoundCity(s: GameState, u: Unit): string | null {
  const err = canFoundCity(s, u);
  if (err) return err;
  const p = s.players[u.owner];
  foundCity(s, u.owner, u.q, u.r, false);
  if (has(p, 'pho_factory')) p.stars += 3;
  delete s.units[u.id];
  updateVisibility(s, u.owner);
  addLog(s, `🚩 ${p.name} основал новый город`, u.owner === s.human ? 'good' : 'info');
  return null;
}

export function disbandUnit(s: GameState, u: Unit) {
  const p = s.players[u.owner];
  p.stars += Math.floor(UNITS[u.type].cost / 2);
  delete s.units[u.id];
}
