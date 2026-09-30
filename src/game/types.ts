export type TerrainKey =
  | 'plains'
  | 'forest'
  | 'hills'
  | 'mountains'
  | 'desert'
  | 'swamp'
  | 'tundra'
  | 'coast'
  | 'ocean'
  | 'reef';

export type ResourceKey =
  | 'fruit'
  | 'game'
  | 'cattle'
  | 'grain'
  | 'fish'
  | 'whale'
  | 'ore'
  | 'gems'
  | 'salt'
  | 'spices'
  | 'obelisk';

export type SpecialKey = 'village' | 'ruins' | 'barbarians' | 'pirates';

export type CivKey = 'sparta' | 'rome' | 'phoenicia' | 'gaul';

export interface Tile {
  q: number;
  r: number;
  t: TerrainKey;
  res?: ResourceKey | null;
  imp?: boolean;
  road?: boolean;
  owner?: number | null;
  city?: string | null;
  special?: SpecialKey | null;
  villageOwner?: number | null;
  timer?: number;
}

export interface Unit {
  id: string;
  type: string;
  owner: number;
  q: number;
  r: number;
  hp: number;
  mp: number;
  acted: boolean;
  moved: boolean;
  kills: number;
  vet: number;
}

export interface City {
  id: string;
  owner: number;
  q: number;
  r: number;
  name: string;
  level: number;
  food: number;
  hp: number;
  capital: boolean;
  founder?: number;
  buildings: string[];
  tiles: string[];
  wonder?: string | null;
  bought?: boolean;
}

export interface Player {
  id: number;
  name: string;
  civ: CivKey;
  isAI: boolean;
  barb?: boolean;
  stars: number;
  science: number;
  culture: number;
  techs: string[];
  explored: Record<string, 1>;
  relations: Record<number, number>;
  war: Record<number, boolean>;
  trade: Record<number, boolean>;
  alive: boolean;
  extraSlots: number;
  heroRespawn?: number;
}

export interface LogEntry {
  turn: number;
  text: string;
  kind: 'info' | 'war' | 'good' | 'bad' | 'event';
}

export interface GrowthChoice {
  cityId: string;
  level: number;
  options: string[];
  reward: 'star' | 'building' | 'slot' | 'wonder';
}

export interface GameState {
  seed: number;
  turn: number;
  maxTurns: number;
  mapSize: 'small' | 'medium';
  tiles: Record<string, Tile>;
  units: Record<string, Unit>;
  cities: Record<string, City>;
  players: Player[];
  human: number;
  current: number;
  log: LogEntry[];
  winner: number | null;
  victory: string | null;
  pendingGrowth: GrowthChoice[];
  nextId: number;
  wonders: string[];
  rev: number;
  lastEvent?: string | null;
}
