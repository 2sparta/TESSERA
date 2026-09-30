import { RESOURCES } from './data';
import { hexDist, key, mulberry32, neighbors } from './hex';
import type { ResourceKey, Tile } from './types';

export interface MapResult {
  tiles: Record<string, Tile>;
  starts: { q: number; r: number }[];
  W: number;
  H: number;
}

interface Cell {
  q: number;
  r: number;
  c: number;
  row: number;
  x: number;
  y: number;
  land: number;
  wet: number;
}

export function generateMap(seed: number, size: 'small' | 'medium', players: number): MapResult {
  const rnd = mulberry32(seed);
  const W = size === 'small' ? 11 : 16;
  const H = size === 'small' ? 11 : 16;

  const cells: Cell[] = [];
  for (let row = 0; row < H; row++) {
    for (let c = 0; c < W; c++) {
      const q = c - Math.floor(row / 2);
      cells.push({ q, r: row, c, row, x: c, y: row * 0.866, land: 0, wet: 0 });
    }
  }

  const makeField = (count: number) => {
    const blobs: { x: number; y: number; rad: number; amp: number }[] = [];
    for (let i = 0; i < count; i++) {
      blobs.push({
        x: rnd() * W,
        y: rnd() * H * 0.866,
        rad: 1.2 + rnd() * (W / 4),
        amp: 0.5 + rnd(),
      });
    }
    return (x: number, y: number) => {
      let v = 0;
      for (const b of blobs) {
        const d2 = (x - b.x) ** 2 + (y - b.y) ** 2;
        v += b.amp * Math.exp(-d2 / (2 * b.rad * b.rad));
      }
      return v;
    };
  };

  const landField = makeField(Math.round((W * H) / 14) + 4);
  const wetField = makeField(Math.round((W * H) / 18) + 3);

  for (const cell of cells) {
    const dx = (cell.c - (W - 1) / 2) / (W / 2);
    const dy = (cell.row - (H - 1) / 2) / (H / 2);
    const d = Math.min(1.4, Math.sqrt(dx * dx + dy * dy));
    cell.land = landField(cell.x, cell.y) * (1 - 0.75 * Math.pow(d, 2.1)) + rnd() * 0.05;
    cell.wet = wetField(cell.x, cell.y) + rnd() * 0.1;
  }

  const sortedLand = [...cells].sort((a, b) => b.land - a.land);
  const landCount = Math.round(cells.length * 0.6);
  const landSet = new Set(sortedLand.slice(0, landCount).map((c) => key(c.q, c.r)));

  const tiles: Record<string, Tile> = {};
  const landCells = cells.filter((c) => landSet.has(key(c.q, c.r)));
  const byElev = [...landCells].sort((a, b) => b.land - a.land);
  const mountainCut = Math.round(landCells.length * 0.08);
  const hillCut = mountainCut + Math.round(landCells.length * 0.16);
  const elevRank = new Map<string, number>();
  byElev.forEach((c, i) => elevRank.set(key(c.q, c.r), i));

  const byWet = [...landCells].sort((a, b) => b.wet - a.wet);
  const wetRank = new Map<string, number>();
  byWet.forEach((c, i) => wetRank.set(key(c.q, c.r), i));
  const forestCut = Math.round(landCells.length * 0.3);
  const dryCut = Math.round(landCells.length * 0.82);

  for (const cell of cells) {
    const k = key(cell.q, cell.r);
    const tile: Tile = { q: cell.q, r: cell.r, t: 'ocean', owner: null, city: null, special: null };
    if (landSet.has(k)) {
      const er = elevRank.get(k)!;
      const wr = wetRank.get(k)!;
      const polar = cell.row < H * 0.08 || cell.row > H * 0.92;
      if (er < mountainCut) tile.t = 'mountains';
      else if (er < hillCut) tile.t = 'hills';
      else if (polar) tile.t = 'tundra';
      else if (wr < forestCut * 0.22 && er > hillCut + landCells.length * 0.35) tile.t = 'swamp';
      else if (wr < forestCut) tile.t = 'forest';
      else if (wr > dryCut) tile.t = 'desert';
      else tile.t = 'plains';
    }
    tiles[k] = tile;
  }

  // Shallow water next to land becomes coast, plus a few reefs
  for (const k of Object.keys(tiles)) {
    const t = tiles[k];
    if (t.t !== 'ocean') continue;
    const near = neighbors(t.q, t.r).some((n) => {
      const nt = tiles[key(n.q, n.r)];
      return nt && nt.t !== 'ocean' && nt.t !== 'coast' && nt.t !== 'reef';
    });
    if (near) t.t = 'coast';
  }
  for (const k of Object.keys(tiles)) {
    const t = tiles[k];
    if ((t.t === 'coast' || t.t === 'ocean') && rnd() < 0.05) t.t = 'reef';
  }

  // Resources
  const resTable: { t: string; chance: number; pool: ResourceKey[] }[] = [
    { t: 'plains', chance: 0.26, pool: ['grain', 'cattle', 'fruit'] },
    { t: 'forest', chance: 0.3, pool: ['game', 'game', 'fruit'] },
    { t: 'hills', chance: 0.34, pool: ['ore'] },
    { t: 'mountains', chance: 0.25, pool: ['gems'] },
    { t: 'desert', chance: 0.28, pool: ['salt'] },
    { t: 'swamp', chance: 0.34, pool: ['spices'] },
    { t: 'coast', chance: 0.2, pool: ['fish'] },
    { t: 'ocean', chance: 0.09, pool: ['whale'] },
    { t: 'reef', chance: 0.2, pool: ['fish'] },
  ];
  for (const k of Object.keys(tiles)) {
    const t = tiles[k];
    const row = resTable.find((x) => x.t === t.t);
    if (row && rnd() < row.chance) {
      const res = row.pool[Math.floor(rnd() * row.pool.length)];
      if (RESOURCES[res].on.length === 0 || RESOURCES[res].on.includes(t.t)) t.res = res;
      else t.res = res;
    } else if (!TWATER.includes(t.t) && rnd() < 0.06) {
      t.res = 'obelisk';
    }
  }

  const landKeys = Object.keys(tiles).filter((k) => !TWATER.includes(tiles[k].t) && tiles[k].t !== 'mountains');
  const waterKeys = Object.keys(tiles).filter((k) => TWATER.includes(tiles[k].t));

  const pick = (arr: string[]) => arr[Math.floor(rnd() * arr.length)];
  const placed: string[] = [];
  const canPlace = (k: string, minDist: number) => {
    const t = tiles[k];
    if (t.special) return false;
    return placed.every((p) => {
      const pt = tiles[p];
      return hexDist(t.q, t.r, pt.q, pt.r) >= minDist;
    });
  };

  const villages = Math.max(3, Math.round(landKeys.length / 13));
  for (let i = 0, guard = 0; i < villages && guard < 400; guard++) {
    const k = pick(landKeys);
    if (canPlace(k, 3)) {
      tiles[k].special = 'village';
      tiles[k].res = null;
      placed.push(k);
      i++;
    }
  }
  const camps = Math.max(1, Math.round(landKeys.length / 26));
  for (let i = 0, guard = 0; i < camps && guard < 400; guard++) {
    const k = pick(landKeys);
    if (canPlace(k, 3)) {
      tiles[k].special = 'barbarians';
      tiles[k].timer = 3 + Math.floor(rnd() * 3);
      placed.push(k);
      i++;
    }
  }
  const coves = Math.min(3, Math.max(1, Math.round(waterKeys.length / 45)));
  for (let i = 0, guard = 0; i < coves && guard < 400; guard++) {
    const k = pick(waterKeys);
    if (canPlace(k, 4)) {
      tiles[k].special = 'pirates';
      tiles[k].timer = 4 + Math.floor(rnd() * 3);
      placed.push(k);
      i++;
    }
  }
  const ruins = Math.max(3, Math.round(landKeys.length / 11));
  for (let i = 0, guard = 0; i < ruins && guard < 500; guard++) {
    const k = pick(landKeys);
    if (!tiles[k].special && !tiles[k].res) {
      tiles[k].special = 'ruins';
      i++;
    }
  }

  // Start positions — farthest point sampling on good land
  const candidates = Object.keys(tiles).filter((k) => {
    const t = tiles[k];
    if (t.t !== 'plains' && t.t !== 'hills' && t.t !== 'forest') return false;
    const nb = neighbors(t.q, t.r).map((n) => tiles[key(n.q, n.r)]);
    if (nb.some((x) => !x)) return false;
    const land = nb.filter((x) => x && !TWATER.includes(x.t)).length;
    return land >= 4;
  });
  const starts: { q: number; r: number }[] = [];
  if (candidates.length) {
    let best = candidates[0];
    let bestScore = -1;
    for (const k of candidates) {
      const t = tiles[k];
      const score = neighbors(t.q, t.r).filter((n) => {
        const nt = tiles[key(n.q, n.r)];
        return nt && !TWATER.includes(nt.t);
      }).length + rnd();
      if (score > bestScore) {
        bestScore = score;
        best = k;
      }
    }
    starts.push({ q: tiles[best].q, r: tiles[best].r });
    const used = new Set<string>([best]);
    while (starts.length < players) {
      let pickK: string | null = null;
      let pickD = -1;
      for (const k of candidates) {
        if (used.has(k)) continue;
        const t = tiles[k];
        const minD = Math.min(...starts.map((s) => hexDist(t.q, t.r, s.q, s.r)));
        if (minD > pickD) {
          pickD = minD;
          pickK = k;
        }
      }
      if (!pickK) break;
      used.add(pickK);
      starts.push({ q: tiles[pickK].q, r: tiles[pickK].r });
    }
  }
  // fallback: guarantee a start for every player
  if (starts.length < players) {
    for (const k of landKeys) {
      if (starts.length >= players) break;
      const t = tiles[k];
      if (starts.some((s) => hexDist(s.q, s.r, t.q, t.r) < 3)) continue;
      starts.push({ q: t.q, r: t.r });
    }
  }

  // Clean up around starts & guarantee food
  for (const s of starts) {
    const k = key(s.q, s.r);
    tiles[k].special = null;
    tiles[k].res = null;
    if (tiles[k].t === 'forest') tiles[k].t = 'plains';
    let food = 0;
    const around: string[] = [];
    for (const n of neighbors(s.q, s.r)) {
      const nk = key(n.q, n.r);
      const nt = tiles[nk];
      if (!nt) continue;
      around.push(nk);
      if (nt.special === 'barbarians' || nt.special === 'pirates') nt.special = null;
      if (nt.res && RESOURCES[nt.res].food > 0) food++;
    }
    if (food === 0) {
      const spot = around.find((nk) => tiles[nk].t === 'plains' && !tiles[nk].res && !tiles[nk].special);
      if (spot) tiles[spot].res = 'grain';
      const spot2 = around.find((nk) => tiles[nk].t === 'plains' && !tiles[nk].res && !tiles[nk].special);
      if (spot2) tiles[spot2].res = 'cattle';
    }
  }

  return { tiles, starts, W, H };
}

const TWATER = ['coast', 'ocean', 'reef'];
export const WATER_TERRAIN = TWATER;
