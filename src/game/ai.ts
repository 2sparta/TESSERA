import { BUILDINGS, CIVS, UNITS, WONDERS, RESOURCES } from './data';
import { hexDist, key, neighbors } from './hex';
import {
  atWar,
  attackTargets,
  availableBuildings,
  availableUnits,
  buyBuilding,
  buyUnit,
  buyWonder,
  canFoundCity,
  canImprove,
  cityAt,
  computeReachable,
  declareWar,
  doFoundCity,
  has,
  improveTile,
  isWater,
  makePeace,
  moveUnit,
  playerCities,
  playerUnits,
  research,
  resolveAttack,
  unitAtkValue,
  unitCost,
  unitDefValue,
  unitSlots,
  unitAt,
  buildRoad,
} from './engine';
import type { City, GameState, Player, Unit } from './types';

const BRANCH_PREF: Record<string, number[]> = {
  sparta: [0, 2, 1],
  rome: [2, 1, 0],
  phoenicia: [1, 0, 2],
  gaul: [1, 2, 0],
};

export function power(s: GameState, pid: number) {
  let v = playerCities(s, pid).length * 6;
  for (const u of playerUnits(s, pid)) {
    const d = UNITS[u.type];
    v += d.atk + d.def + u.hp / 5;
  }
  return v + 1;
}

function nextTechs(_s: GameState, p: Player) {
  const out: { id: string; cost: number; branch: number }[] = [];
  CIVS[p.civ].branches.forEach((br, bi) => {
    for (let i = 0; i < br.techs.length; i++) {
      if (!has(p, br.techs[i].id)) {
        out.push({ id: br.techs[i].id, cost: br.techs[i].cost, branch: bi });
        break;
      }
    }
  });
  return out;
}

function aiResearch(s: GameState, p: Player) {
  let guard = 0;
  while (guard++ < 4) {
    const opts = nextTechs(s, p).filter((t) => t.cost <= p.science);
    if (!opts.length) return;
    const pref = BRANCH_PREF[p.civ] ?? [0, 1, 2];
    opts.sort((a, b) => pref.indexOf(a.branch) - pref.indexOf(b.branch) || a.cost - b.cost);
    if (research(s, p.id, opts[0].id)) return;
  }
}

function aiDiplomacy(s: GameState, p: Player) {
  for (const o of s.players) {
    if (o.barb || o.id === p.id || !o.alive) continue;
    const ratio = power(s, p.id) / power(s, o.id);
    if (!atWar(s, p.id, o.id)) {
      const caps = playerCities(s, p.id).find((c) => c.capital);
      const ocaps = playerCities(s, o.id).find((c) => c.capital);
      const dist = caps && ocaps ? hexDist(caps.q, caps.r, ocaps.q, ocaps.r) : 99;
      if (s.turn >= 6 && ratio > 1.3 && dist <= 11 && Math.random() < 0.3) declareWar(s, p.id, o.id);
      else if ((p.relations[o.id] ?? 0) < 25 && Math.random() < 0.25) p.relations[o.id] = (p.relations[o.id] ?? 0) + 5;
    } else if (ratio < 0.65 && Math.random() < 0.35) {
      makePeace(s, p.id, o.id);
    }
  }
}

function cityBuildOrder(p: Player): string[] {
  const base = ['workshop', 'library', 'market', 'barracks', 'walls', 'port', 'temple', 'academy', 'colosseum'];
  if (p.civ === 'phoenicia') return ['port', 'workshop', 'market', 'library', 'walls', 'barracks', 'temple', 'academy'];
  if (p.civ === 'sparta') return ['barracks', 'workshop', 'walls', 'market', 'library', 'academy'];
  if (p.civ === 'rome') return ['workshop', 'library', 'walls', 'market', 'colosseum', 'academy', 'temple', 'barracks'];
  return base;
}

function bestCombatUnit(s: GameState, city: City): string | null {
  const avail = availableUnits(s, city).filter((u) => !UNITS[u].settler);
  if (!avail.length) return null;
  avail.sort((a, b) => {
    const ua = UNITS[a];
    const ub = UNITS[b];
    const va = (ua.atk * 2 + ua.def + ua.hp / 4) / unitCost(s, city.owner, a, city);
    const vb = (ub.atk * 2 + ub.def + ub.hp / 4) / unitCost(s, city.owner, b, city);
    return vb - va + (ub.hero ? 5 : 0) - (ua.hero ? 5 : 0);
  });
  return avail[0];
}

function aiEconomy(s: GameState, p: Player) {
  const cities = playerCities(s, p.id);
  if (!cities.length) return;

  // improve resource tiles
  for (const c of cities) {
    for (const k of c.tiles) {
      const t = s.tiles[k];
      if (!t || !t.res || t.imp) continue;
      if (!canImprove(s, p.id, t)) continue;
      const cost = RESOURCES[t.res].cost;
      if (p.stars >= cost + 3) improveTile(s, p.id, k);
    }
    if (p.civ === 'rome') {
      for (const k of c.tiles) {
        const t = s.tiles[k];
        if (t && !t.road && !isWater(t.t) && t.t !== 'mountains') buildRoad(s, p.id, k);
      }
    }
  }

  // settlers early
  const settlers = playerUnits(s, p.id).filter((u) => UNITS[u.type].settler).length;
  if (cities.length < 5 && settlers === 0 && s.turn < s.maxTurns * 0.75) {
    const home = cities[0];
    const cost = unitCost(s, p.id, 'settler', home);
    if (p.stars >= cost + 2 && playerUnits(s, p.id).length < unitSlots(s, p.id)) buyUnit(s, home, 'settler');
  }

  // buildings
  for (const c of cities) {
    const order = cityBuildOrder(p).filter((b) => availableBuildings(s, c).includes(b));
    for (const b of order) {
      const cost = BUILDINGS[b].cost;
      if (p.stars >= cost + 6) buyBuilding(s, c, b);
    }
    if (c.level >= 4 && !c.wonder && p.stars > 45) {
      const w = Object.keys(WONDERS).find((x) => !s.wonders.includes(x));
      if (w) buyWonder(s, c, w);
    }
  }

  // military
  const threatened = cities.some((c) =>
    Object.values(s.units).some((u) => u.owner !== p.id && atWar(s, p.id, u.owner) && hexDist(u.q, u.r, c.q, c.r) <= 3),
  );
  const wantUnits = threatened || s.turn > 8;
  if (wantUnits) {
    let guard = 0;
    while (guard++ < 3 && playerUnits(s, p.id).length < unitSlots(s, p.id)) {
      const city = cities.slice().sort((a, b) => b.level - a.level)[0];
      const type = bestCombatUnit(s, city);
      if (!type) break;
      const cost = unitCost(s, p.id, type, city);
      const reserve = threatened ? 0 : 6;
      if (p.stars < cost + reserve) break;
      if (buyUnit(s, city, type)) break;
    }
  }
}

function spotScore(s: GameState, p: Player, q: number, r: number) {
  const t = s.tiles[key(q, r)];
  if (!t) return -99;
  if (isWater(t.t) && !(p.civ === 'phoenicia' && t.t === 'coast')) return -99;
  if (t.t === 'mountains' || t.city) return -99;
  if (t.owner !== null && t.owner !== undefined && t.owner !== p.id) return -99;
  const near = Object.values(s.cities).some((c) => hexDist(c.q, c.r, q, r) < 3);
  if (near) return -99;
  let score = 0;
  for (const n of [{ q, r }, ...neighbors(q, r)]) {
    const nt = s.tiles[key(n.q, n.r)];
    if (!nt) continue;
    if (nt.res) score += 2.5;
    if (nt.t === 'plains') score += 1.2;
    if (nt.t === 'hills') score += 1;
    if (nt.t === 'forest') score += p.civ === 'gaul' ? 1.4 : 0.8;
    if (isWater(nt.t)) score += p.civ === 'phoenicia' ? 1.2 : 0.2;
    if (nt.owner !== null && nt.owner !== undefined && nt.owner !== p.id) score -= 2;
  }
  return score;
}

function moveToward(s: GameState, u: Unit, tq: number, tr: number) {
  const reach = computeReachable(s, u);
  let best: string | null = null;
  let bestD = hexDist(u.q, u.r, tq, tr);
  let bestCost = 0;
  for (const [k, e] of Object.entries(reach)) {
    const t = s.tiles[k];
    if (!t) continue;
    const d = hexDist(t.q, t.r, tq, tr);
    if (d < bestD || (d === bestD && e.cost < bestCost && best)) {
      best = k;
      bestD = d;
      bestCost = e.cost;
    }
  }
  if (best) return moveUnit(s, u, best, reach);
  return false;
}

function tryAttacks(s: GameState, u: Unit): boolean {
  const targets = attackTargets(s, u).filter((k) => {
    const t = s.tiles[k];
    const tu = unitAt(s, t.q, t.r);
    const c = t.city ? s.cities[t.city] : null;
    const enemyId = tu ? tu.owner : c ? c.owner : -1;
    if (enemyId < 0) return false;
    return atWar(s, u.owner, enemyId) || s.players[enemyId].barb || s.players[u.owner].barb;
  });
  if (!targets.length) return false;
  let best: string | null = null;
  let bestVal = -99;
  for (const k of targets) {
    const t = s.tiles[k];
    const tu = unitAt(s, t.q, t.r);
    let val = 0;
    if (tu) {
      const a = unitAtkValue(s, u);
      const d = unitDefValue(s, tu);
      const est = a * (a / (a + d));
      val = est - (UNITS[u.type].rng > 1 ? 0 : unitAtkValue(s, tu) * 0.4);
      if (est >= tu.hp) val += 8;
      if (UNITS[tu.type].settler || UNITS[tu.type].siege) val += 3;
    } else {
      const c = t.city ? s.cities[t.city] : null;
      if (c) val = c.hp <= 6 ? 12 : 4;
    }
    if (val > bestVal) {
      bestVal = val;
      best = k;
    }
  }
  if (best && bestVal > -1) {
    resolveAttack(s, u, best);
    return true;
  }
  return false;
}

function nearestEnemyTarget(s: GameState, p: Player, u: Unit) {
  let best: { q: number; r: number; d: number } | null = null;
  const consider = (q: number, r: number, bias = 0) => {
    const d = hexDist(u.q, u.r, q, r) + bias;
    if (!best || d < best.d) best = { q, r, d };
  };
  for (const c of Object.values(s.cities)) {
    if (c.owner === p.id) continue;
    if (!atWar(s, p.id, c.owner)) continue;
    consider(c.q, c.r, c.hp <= 0 ? -4 : 0);
  }
  for (const eu of Object.values(s.units)) {
    if (eu.owner === p.id || !atWar(s, p.id, eu.owner)) continue;
    consider(eu.q, eu.r, 2);
  }
  return best as { q: number; r: number; d: number } | null;
}

function nearestNeutralPrize(s: GameState, p: Player, u: Unit) {
  let best: { q: number; r: number; d: number } | null = null;
  for (const t of Object.values(s.tiles)) {
    if (!t.special) continue;
    if (t.special === 'village' && t.villageOwner === p.id) continue;
    if (t.special === 'pirates' && !UNITS[u.type].naval) continue;
    if (t.special === 'barbarians' && UNITS[u.type].naval) continue;
    if (t.special === 'ruins' || t.special === 'village' || t.special === 'barbarians' || t.special === 'pirates') {
      if (isWater(t.t) !== !!UNITS[u.type].naval) continue;
      const d = hexDist(u.q, u.r, t.q, t.r);
      if (d > 9) continue;
      if (!best || d < best.d) best = { q: t.q, r: t.r, d };
    }
  }
  return best;
}

function aiUnits(s: GameState, p: Player) {
  const units = playerUnits(s, p.id).sort((a, b) => (UNITS[b.type].mv ?? 1) - (UNITS[a.type].mv ?? 1));
  for (const u of units) {
    if (!s.units[u.id]) continue;
    const d = UNITS[u.type];

    if (d.settler) {
      const here = spotScore(s, p, u.q, u.r);
      if (!canFoundCity(s, u) && (here > 7 || s.turn > 12)) {
        doFoundCity(s, u);
        continue;
      }
      let best: { q: number; r: number; v: number } | null = null;
      const reach = computeReachable(s, u);
      for (const t of Object.values(s.tiles)) {
        const dist = hexDist(u.q, u.r, t.q, t.r);
        if (dist > 7) continue;
        const v = spotScore(s, p, t.q, t.r) - dist * 0.8;
        if (v > -50 && (!best || v > best.v)) best = { q: t.q, r: t.r, v };
      }
      if (best) moveToward(s, u, best.q, best.r);
      else {
        const keys = Object.keys(reach);
        if (keys.length > 1) moveUnit(s, u, keys[Math.floor(Math.random() * keys.length)], reach);
      }
      if (!canFoundCity(s, u) && spotScore(s, p, u.q, u.r) > 5) doFoundCity(s, u);
      continue;
    }

    if (tryAttacks(s, u)) {
      if (!s.units[u.id] || u.acted) continue;
    }

    // defend threatened city
    const myCities = playerCities(s, p.id);
    const threat = myCities.find((c) =>
      Object.values(s.units).some((e) => e.owner !== p.id && atWar(s, p.id, e.owner) && hexDist(e.q, e.r, c.q, c.r) <= 2),
    );
    const defenders = threat ? Object.values(s.units).filter((x) => x.owner === p.id && hexDist(x.q, x.r, threat.q, threat.r) <= 1).length : 0;

    if (threat && defenders < 2 && hexDist(u.q, u.r, threat.q, threat.r) <= 5) {
      moveToward(s, u, threat.q, threat.r);
      tryAttacks(s, u);
      continue;
    }

    const prize = nearestNeutralPrize(s, p, u);
    const enemy = nearestEnemyTarget(s, p, u);
    if (prize && (!enemy || prize.d < enemy.d - 1) && !(d.hero || d.siege)) {
      moveToward(s, u, prize.q, prize.r);
      tryAttacks(s, u);
      continue;
    }
    if (enemy) {
      moveToward(s, u, enemy.q, enemy.r);
      tryAttacks(s, u);
      continue;
    }
    // garrison / explore
    const cap = playerCities(s, p.id)[0];
    if (cap && hexDist(u.q, u.r, cap.q, cap.r) > 4) {
      moveToward(s, u, cap.q, cap.r);
    } else {
      const reach = computeReachable(s, u);
      const unexplored = Object.keys(reach).filter((k) => !p.explored[k]);
      const pool = unexplored.length ? unexplored : Object.keys(reach);
      if (pool.length) moveUnit(s, u, pool[Math.floor(Math.random() * pool.length)], reach);
    }
  }
}

function barbTurn(s: GameState, pid: number) {
  for (const u of playerUnits(s, pid)) {
    if (!s.units[u.id]) continue;
    if (tryAttacks(s, u)) continue;
    let best: { q: number; r: number; d: number } | null = null;
    for (const t of Object.values(s.units)) {
      if (t.owner === pid) continue;
      const d = hexDist(u.q, u.r, t.q, t.r);
      if (d <= 6 && (!best || d < best.d)) best = { q: t.q, r: t.r, d };
    }
    for (const c of Object.values(s.cities)) {
      const d = hexDist(u.q, u.r, c.q, c.r);
      if (d <= 6 && (!best || d < best.d)) best = { q: c.q, r: c.r, d };
    }
    if (best) {
      moveToward(s, u, best.q, best.r);
      tryAttacks(s, u);
    } else {
      const reach = computeReachable(s, u);
      const keys = Object.keys(reach);
      if (keys.length > 1) moveUnit(s, u, keys[Math.floor(Math.random() * keys.length)], reach);
    }
  }
}

export function aiTakeTurn(s: GameState, pid: number) {
  const p = s.players[pid];
  if (!p || !p.alive) return;
  if (p.barb) {
    barbTurn(s, pid);
    return;
  }
  aiResearch(s, p);
  aiDiplomacy(s, p);
  aiEconomy(s, p);
  aiUnits(s, p);
  aiEconomy(s, p);
}

export function aiWantsPeace(s: GameState, aiId: number, withId: number) {
  const ratio = power(s, aiId) / power(s, withId);
  return ratio < 1.15 || Math.random() < 0.2;
}

export function aiWantsTrade(s: GameState, aiId: number, withId: number) {
  const p = s.players[aiId];
  return !atWar(s, aiId, withId) && (p.relations[withId] ?? 0) > -20;
}

export function cityNear(s: GameState, q: number, r: number): City | null {
  const c = cityAt(s, q, r);
  return c ?? null;
}
