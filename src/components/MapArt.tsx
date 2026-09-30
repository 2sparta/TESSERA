import { TERRAIN } from '../game/data';
import type { ResourceKey, SpecialKey, TerrainKey } from '../game/types';

const RESOURCE_COLORS: Record<ResourceKey, string> = {
  fruit: '#ce7d9d',
  game: '#d49a6b',
  cattle: '#d0ab73',
  grain: '#e0bd63',
  fish: '#73c9df',
  whale: '#73aeca',
  ore: '#b4a889',
  gems: '#c3a4ef',
  salt: '#e3d5a6',
  spices: '#99c38c',
  obelisk: '#e3c889',
};

const RESOURCE_NAMES: Record<ResourceKey, string> = {
  fruit: 'Фрукты',
  game: 'Дичь',
  cattle: 'Скот',
  grain: 'Зерно',
  fish: 'Рыба',
  whale: 'Кит',
  ore: 'Руда',
  gems: 'Самоцветы',
  salt: 'Соль',
  spices: 'Специи',
  obelisk: 'Обелиск',
};

const TERRAIN_NAMES: Record<TerrainKey, string> = {
  plains: 'Равнина',
  forest: 'Лес',
  hills: 'Холмы',
  mountains: 'Горы',
  desert: 'Пустыня',
  swamp: 'Болото',
  tundra: 'Тундра',
  coast: 'Побережье',
  ocean: 'Океан',
  reef: 'Рифы',
};

const SPECIAL_COLORS: Record<SpecialKey, string> = {
  village: '#e2c188',
  ruins: '#d9b675',
  barbarians: '#dd8069',
  pirates: '#f0b671',
};

function ForestTree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-1.1 3.5h2.2v4h-2.2z" fill="#704d35" />
      <path d="M0-8-5 0h3.1L-5 4.1h10L1.9 0H5z" fill="#315d43" stroke="#b3c78b" strokeOpacity=".24" strokeWidth=".65" strokeLinejoin="round" />
      <path d="M-.8-5.7v8" stroke="#87a776" strokeOpacity=".62" strokeWidth=".65" />
    </g>
  );
}

export function TerrainArt({ terrain, q, r, x, y }: { terrain: TerrainKey; q: number; r: number; x: number; y: number }) {
  const phase = (Math.abs(q * 17 + r * 29) % 7) - 3;
  const tint = TERRAIN[terrain].color;

  return (
    <g transform={`translate(${x} ${y})`} className={`terrain-art terrain-art--${terrain}`} pointerEvents="none" role="img" aria-label={TERRAIN_NAMES[terrain]}>
      {terrain === 'plains' && (
        <>
          <path d={`M-21 ${11 + phase * 0.2}Q-9 5 1 11T22 7`} fill="none" stroke="#596744" strokeOpacity=".25" strokeWidth="1.2" />
          <path d={`M-20 ${15 + phase * 0.2}Q-9 9 1 15T21 11`} fill="none" stroke="#e4d397" strokeOpacity=".32" strokeWidth="1.3" />
          <path d="M-18-10q3-2 6 0M8-14q3-2 6 0M-2 3q2-2 4 0" fill="none" stroke="#f5e8ae" strokeOpacity=".26" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {terrain === 'forest' && (
        <>
          <path d="M-23 14Q-8 6 2 13T23 10" fill="none" stroke="#d4d5a0" strokeOpacity=".25" strokeWidth="1.2" />
          <ForestTree x={-12} y={-3 + phase * 0.25} scale={0.95} />
          <ForestTree x={0} y={-9 - phase * 0.12} scale={1.08} />
          <ForestTree x={12} y={-2 + phase * 0.2} scale={0.88} />
          <ForestTree x={-4} y={10} scale={0.7} />
        </>
      )}
      {terrain === 'hills' && (
        <>
          <path d={`M-24 10Q-13 ${-6 + phase * 0.25}-4 10T16 7L23 13H-23Z`} fill="#90714c" fillOpacity=".46" />
          <path d={`M-24 7Q-13 ${-9 + phase * 0.25}-4 7T16 4`} fill="none" stroke="#e6c78d" strokeOpacity=".78" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M-15 15q9-5 17-1t17-2" fill="none" stroke="#66583f" strokeOpacity=".5" strokeWidth="1" />
          <path d="M-12 3q3-2 6 0M7 2q2-2 4 0" fill="none" stroke="#8e9560" strokeOpacity=".7" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
      {terrain === 'mountains' && (
        <>
          <path d="M-25 12-11-11-3 1 6-15 24 12Z" fill="#6f706d" stroke="#d7cec0" strokeOpacity=".75" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="m-11-11 4 8-4-1-2 4-3-1zM6-15l5 8-4-1-2 4-3-1z" fill="#f1eee3" stroke="#fff" strokeOpacity=".5" strokeWidth=".7" strokeLinejoin="round" />
          <path d="m-11-2-8 14m25-16 11 16" stroke="#424e50" strokeOpacity=".6" strokeWidth="1.2" />
          <path d="M-24 13h48" stroke="#e2dac9" strokeOpacity=".42" strokeWidth="1" />
        </>
      )}
      {terrain === 'desert' && (
        <>
          <path d={`M-24 10Q-7 ${-1 + phase * 0.2}10 8T24 6`} fill="none" stroke="#f2dda7" strokeOpacity=".86" strokeWidth="2" />
          <path d={`M-24 15Q-7 ${5 + phase * 0.2}10 14T24 12`} fill="none" stroke="#9f8054" strokeOpacity=".56" strokeWidth="1.2" />
          <path d="M-15-9q2-2 4 0M10-14q2-2 4 0M-2-4q1.5-1.5 3 0" fill="none" stroke="#806d4d" strokeOpacity=".4" strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {terrain === 'swamp' && (
        <>
          <ellipse cx={-4 + phase * 0.4} cy={6} rx="13" ry="5" fill="#365d58" fillOpacity=".74" />
          <path d="M-17 6q7-3 14 0t14 0" fill="none" stroke="#8ab09a" strokeOpacity=".8" strokeWidth="1" />
          <path d="M-14-4v10m0-8-3-3m3 5 3-4M14-7v11m0-8-3-3m3 4 3-4" fill="none" stroke="#bdc98a" strokeOpacity=".88" strokeWidth="1.25" strokeLinecap="round" />
          <circle cx="12" cy="8" r="1" fill="#bddbc0" opacity=".78" />
        </>
      )}
      {terrain === 'tundra' && (
        <>
          <path d={`M-22 11Q-8 5 3 11T23 7`} fill="none" stroke="#f6f4df" strokeOpacity=".75" strokeWidth="1.4" />
          <path d="m-13 9 5-8 6 8zm11 8 5-8 6 8z" fill="#738d89" fillOpacity=".7" stroke="#edf4e7" strokeOpacity=".78" strokeWidth=".8" strokeLinejoin="round" />
          <path d="M11-12v8m-3-4h6m-5-2 4 4m0-4-4 4" stroke="#f7f8eb" strokeOpacity=".78" strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {terrain === 'coast' && (
        <>
          <path d={`M-25 7Q-12 ${-8 + phase * 0.2}2 1T24-6`} fill="none" stroke="#d0c18a" strokeOpacity=".83" strokeWidth="3.5" />
          <path d="M-18 12q5-3 10 0t10 0m1-10q5-3 10 0t10 0" fill="none" stroke="#a4d8d2" strokeOpacity=".67" strokeWidth="1.15" strokeLinecap="round" />
          <path d="M-10 17q4-2 8 0t8 0" fill="none" stroke="#eff1d7" strokeOpacity=".42" strokeWidth=".9" />
        </>
      )}
      {terrain === 'ocean' && (
        <>
          <path d={`M-23 ${-4 + phase * 0.2}q6-4 12 0t12 0 12 0`} fill="none" stroke="#96ced0" strokeOpacity=".49" strokeWidth="1.2" strokeLinecap="round" />
          <path d={`M-20 ${5 + phase * 0.2}q6-4 12 0t12 0 12 0`} fill="none" stroke="#a8d8d4" strokeOpacity=".43" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-11 14q5-3 10 0t10 0" fill="none" stroke="#d4e4d4" strokeOpacity=".29" strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {terrain === 'reef' && (
        <>
          <path d="M-20 13q8-4 17-1t23-2" fill="none" stroke="#b1d3ad" strokeOpacity=".5" strokeWidth="1.2" />
          <path d="M0 12V-4m0 6-6-5m6 8 6-7m-6-1 4-5m-4 11-5 3" fill="none" stroke="#f1b796" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-13 5v-6m0 3-3-3m3 5 3-4M14 12V3m0 3 4-4" fill="none" stroke="#f1d58e" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="-15" cy="-12" r="1.2" fill="#eef0cc" opacity=".7" />
          <circle cx="13" cy="-13" r="1" fill="#eef0cc" opacity=".7" />
        </>
      )}
      <path d="M-21-20q10 4 21 1t21-1" fill="none" stroke={tint} strokeOpacity=".14" strokeWidth="1" />
    </g>
  );
}

function ResourceGlyph({ type }: { type: ResourceKey }) {
  const color = RESOURCE_COLORS[type];
  if (type === 'fruit') {
    return <g fill={color} stroke="#fff1d2" strokeWidth=".65"><circle cx="-3" cy="2" r="3"/><circle cx="3" cy="2" r="3"/><circle cy="-2" r="3"/><path d="M0-5q1-3 4-3" fill="none" stroke="#9ec77f"/></g>;
  }
  if (type === 'grain') {
    return <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><path d="M0 7V-7M-4 5l4-3M4 2 0 0M-3-1l3-2M3-4 0-6"/><circle cy="-7" r="1.2" fill={color}/></g>;
  }
  if (type === 'ore') {
    return <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m-6-4 6 5 6-5M0 1v6M-5-7h10"/><path d="m-5-7-1 3m11-3 1 3" stroke="#f7edcf"/></g>;
  }
  if (type === 'gems') {
    return <path d="m-7-3 3-4h8l3 4-7 10z" fill={color} stroke="#f4e8ff" strokeWidth="1" strokeLinejoin="round"/>;
  }
  if (type === 'fish' || type === 'whale') {
    return <g fill={color} stroke="#e3f8f3" strokeWidth=".8" strokeLinejoin="round"><path d="M-7 0q6-7 12 0-6 7-12 0zm12 0 4-4v8z"/><circle cx="-3" cy="-1" r=".7" fill="#20343a" stroke="none"/></g>;
  }
  if (type === 'obelisk') {
    return <g fill={color} stroke="#fff0c7" strokeWidth=".7" strokeLinejoin="round"><path d="m0-8 4 4v8H2v4h-4v-4h-2v-8z"/><path d="M0-4v7" fill="none"/></g>;
  }
  if (type === 'salt') {
    return <path d="M-7 6 0-6 7 6z" fill={color} stroke="#fff4d5" strokeWidth=".8" strokeLinejoin="round"/>;
  }
  if (type === 'spices') {
    return <g fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round"><path d="M0 7V-6M0 0q-7-1-6-6 5 0 6 6zm0 2q7-1 6-6-5 0-6 6z"/><path d="M-3 7h6" stroke="#e9d9b5"/></g>;
  }
  if (type === 'game') {
    return <g fill="none" stroke={color} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"><path d="M0 6V0M0 0-4-5m4 5 4-5m-8 0-2-3m2 3-3 1m11-1 2-3m-2 3 3 1"/><circle cy="6" r="2" fill={color}/></g>;
  }
  if (type === 'cattle') {
    return <g fill={color} stroke="#fff0d1" strokeWidth=".75" strokeLinejoin="round"><path d="M-6-4-9-7l1 5q-2 5 2 8h12q4-3 2-8l1-5-3 3q-4-3-12 0z"/><circle cx="-3" cy="0" r=".7" fill="#352c25"/><circle cx="3" cy="0" r=".7" fill="#352c25"/></g>;
  }
  return <g fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="m-6-5 12 10M6-5-6 5M-7-7l2 2M5 5l2 2M5-7l2 2M-7 5l2 2"/></g>;
}

export function ResourceMark({ type, x, y, improved }: { type: ResourceKey; x: number; y: number; improved?: boolean }) {
  const color = RESOURCE_COLORS[type];
  return (
    <g transform={`translate(${x} ${y}) scale(.78)`} className="map-resource" pointerEvents="none" aria-label={RESOURCE_NAMES[type]}>
      <circle r="10.8" fill="#14212a" stroke={improved ? '#edce80' : '#e7dfca'} strokeWidth="1.2" />
      <circle r="8.7" fill={color} fillOpacity=".2" stroke={color} strokeOpacity=".75" strokeWidth=".7" />
      <g transform="scale(.67)"><ResourceGlyph type={type} /></g>
      {improved && <circle cx="7" cy="7" r="2.2" fill="#bce0a0" stroke="#182c2e" strokeWidth=".9" />}
    </g>
  );
}

function SpecialGlyph({ type }: { type: SpecialKey }) {
  if (type === 'village') {
    return <g fill="#3d3730" stroke="#f6dca8" strokeWidth=".8" strokeLinejoin="round"><path d="M-11 2-5-4 1 2v7h-12z"/><path d="M-2 2 4-4l7 6v7H-2z"/><path d="M-7 4v5m9-5v5" stroke="#e4bd7c"/></g>;
  }
  if (type === 'ruins') {
    return <g fill="#aa8f63" stroke="#f3dcaa" strokeWidth=".8" strokeLinejoin="round"><path d="M-11 7h22v3h-22zM-9-6h4V7h-4zm7 3h4V7h-4zm7-3h4V7H5z"/><path d="m-12-7 5-3 5 3m1 0 5-3 5 3" fill="none" strokeWidth="1.4"/></g>;
  }
  if (type === 'barbarians') {
    return <g fill="none" stroke="#df987a" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="m-8-7 16 15M8-7-8 8"/><path d="M-10-8-7-5m17-3L7-5M-10 9l3-3m14 3L7 6" stroke="#f5d4a6"/></g>;
  }
  return <g stroke="#f0c17e" strokeWidth="1.2" strokeLinejoin="round"><path d="M-7-9h13l-1 9-7 5-6-5z" fill="#443b35"/><path d="M-4-5h2m4 0h2M-4 1h2m2 0h2" stroke="#f0c17e" strokeWidth="1.8" strokeLinecap="round"/><path d="M-12 8q5-3 10 0t12 0" fill="none" stroke="#acd3d2" strokeWidth="1.3"/></g>;
}

export function SpecialMark({ type, x, y, scale = 1 }: { type: SpecialKey; x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} className="map-special" pointerEvents="none" aria-hidden="true">
      <circle r="14" fill="#14212a" fillOpacity=".94" stroke={SPECIAL_COLORS[type]} strokeWidth="1.4" />
      <circle r="11.3" fill={SPECIAL_COLORS[type]} fillOpacity=".14" stroke="#fff1d1" strokeOpacity=".35" strokeWidth=".65" />
      <SpecialGlyph type={type} />
    </g>
  );
}

function UnitSigil({ type }: { type: string }) {
  if (type === 'settler') {
    return <g stroke="#f3e6c8" strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round"><path d="M0 8V-8"/><path d="M1-7h7l-1 5H1z" fill="#e7bd6b"/><path d="m-4 8 4-3 4 3" fill="none"/></g>;
  }
  if (['trireme', 'bireme', 'quinquereme'].includes(type)) {
    return <g stroke="#f1dfbf" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round"><path d="M-9 3h18l-3 4h-12z" fill="#d4a76a"/><path d="M0 2v-11M-1-8l-6 7h6z" fill="#fff0d0"/><path d="M1-6 7 0H1z" fill="#da815e"/><path d="M-6 9q3-2 6 0t6 0" fill="none" stroke="#9bd4d1"/></g>;
  }
  if (['catapult', 'ballista', 'onager'].includes(type)) {
    return <g stroke="#f0dfbd" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M-8 4h16l-2 3h-12z" fill="#bd9b68"/><circle cx="-5" cy="8" r="1.5" fill="#d7b981"/><circle cx="5" cy="8" r="1.5" fill="#d7b981"/><path d="M-5 3 2-3l4-5M-5-2q5-6 10 0M4-7l4 2" fill="none"/><circle cx="8" cy="-6" r="1.5" fill="#e7b66d" stroke="none"/></g>;
  }
  if (type === 'archer' || type === 'velite') {
    return <g fill="none" stroke="#f3e1bd" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"><path d="M-5-8q11 8 0 16M-4 0h12m-3-3 3 3-3 3"/><path d="M-2-6q2 6 0 12" stroke="#d6a96f"/></g>;
  }
  if (['horseman', 'numidian', 'grider'].includes(type)) {
    return <g fill="#d3ad77" stroke="#fff0ce" strokeWidth=".85" strokeLinejoin="round" strokeLinecap="round"><path d="M-8-2q4-4 8-1l4-2 3 3-2 3 2 5h-2l-3-4-4 1-2 4h-2l1-5-5 2-2 3h-2l1-5z"/><path d="m4-5 2-3 3 1-2 3m-8 2 1-4 3-2" fill="none"/><path d="M-1-7v-3"/></g>;
  }
  if (type === 'druid') {
    return <g fill="none" stroke="#b9dfa7" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"><path d="M0 8V-8m0 5q-6 0-6-5 5 0 6 5zm0 3q6 0 6-5-5 0-6 5z"/><path d="M-4 8h8" stroke="#f2dfbb"/></g>;
  }
  if (type === 'gaesatae') {
    return <g fill="none" stroke="#f2dfbd" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"><path d="m-6-8 12 16m0-16L-6 8"/><path d="m-8-9 4 1 1 4q-5 0-5-5zm16 0-4 1-1 4q5 0 5-5zM-8 9l4-1 1-4q-5 0-5 5zm16 0-4-1-1-4q5 0 5 5z" fill="#c99c64"/></g>;
  }

  // Infantry and heroes: a shield, short blade, and a distinctive helmet crest.
  return (
    <g stroke="#f4e4c5" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round">
      <path d="M-8-4 0-8l8 4v6q-1 5-8 8-7-3-8-8z" fill="#d4b27a" />
      <path d="M-4-4h8v6q-1 3-4 5-3-2-4-5z" fill="#657b77" />
      <path d="M4-5 8-9l3 1-3 5m-7-5v-3m0 0q4 1 5 3" fill="none" />
      <path d="M-2 0 2-2" fill="none" />
      {type === 'leonidas' || type === 'vercingetorix' ? <path d="M-2-10 0-13l2 3" fill="#e7c678" stroke="#e7c678" /> : null}
      {type === 'hoplite' || type === 'spearman' ? <path d="M-10-10 7 9m-1-2 3 2" fill="none" stroke="#e9d8b0" /> : null}
      {type === 'legionary' && <path d="M-8-2q-4 4-1 8h3" fill="none" stroke="#e39b70" strokeWidth="1.6" />}
    </g>
  );
}

export function UnitBadge({ type, color, size = 38 }: { type: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0" role="img" aria-label={type}>
      <circle cx="20" cy="20" r="18" fill="#10202a" stroke="#d8c391" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="15" fill={color} stroke="#f4e4bf" strokeOpacity=".62" strokeWidth=".8" />
      <circle cx="20" cy="20" r="12.5" fill="#14242a" fillOpacity=".72" />
      <g transform="translate(20 20) scale(.82)"><UnitSigil type={type} /></g>
    </svg>
  );
}

export function UnitToken({
  type,
  color,
  hp,
  maxHp,
  x,
  y,
  veteran,
  dimmed,
  ready,
  label,
}: {
  type: string;
  color: string;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  veteran: number;
  dimmed?: boolean;
  ready?: boolean;
  label: string;
}) {
  const ratio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const hpColor = ratio > 0.5 ? '#94cf91' : ratio > 0.25 ? '#e6c66f' : '#e37d6e';
  return (
    <g transform={`translate(${x} ${y})`} className={ready ? 'map-unit map-unit--ready' : 'map-unit'} opacity={dimmed ? 0.58 : 1} aria-label={label}>
      <circle cy="1.4" r="17.4" fill="#07131b" fillOpacity=".82" />
      <circle r="16.2" fill="#17252a" stroke="#11191b" strokeWidth="2" />
      <circle r="14.6" fill={color} stroke="#f3dba5" strokeWidth="1.15" />
      <circle r="11.8" fill="#10202a" fillOpacity=".82" stroke="#ffffff" strokeOpacity=".28" strokeWidth=".7" />
      <g transform="scale(.82)"><UnitSigil type={type} /></g>
      {veteran > 0 && (
        <g className="map-veteran" transform="translate(10 -12)">
          <circle r="5.4" fill="#1a2020" stroke="#f1cd78" strokeWidth="1" />
          <path d="m0-3.4 1 2.1 2.3.3-1.7 1.5.5 2.3L0 1.7-2.1 2.8l.5-2.3-1.7-1.5 2.3-.3z" fill="#f1cd78" />
          {veteran > 1 && <circle cx="-13" cy="-1" r="2.2" fill="#f1cd78" stroke="#152128" strokeWidth=".8" />}
        </g>
      )}
      <path d="M-11 16h22" stroke="#10202a" strokeWidth="4" strokeLinecap="round" />
      <path d="M-10 16h20" stroke="#495752" strokeWidth="2.4" strokeLinecap="round" />
      <path d={`M-10 16h${20 * ratio}`} stroke={hpColor} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="-10" cy="16" r="1.2" fill="#f2e5c5" />
      <circle cx="10" cy="16" r="1.2" fill="#f2e5c5" />
    </g>
  );
}

export function CityToken({
  color,
  name,
  level,
  hp,
  maxHp,
  capital,
  wonder,
  x,
  y,
}: {
  color: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  capital: boolean;
  wonder: boolean;
  x: number;
  y: number;
}) {
  const ratio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  return (
    <g transform={`translate(${x} ${y})`} className="map-city" aria-label={`${capital ? 'Столица' : 'Город'} ${name}`}>
      <circle cy="1.5" r="23" fill="#07131b" fillOpacity=".5" />
      <path d="M0-21 18-11V10L0 21-18 10V-11z" fill="#14212a" stroke="#e7d2a1" strokeWidth="1.45" />
      <path d="M0-17 14.5-8.5v17L0 17-14.5 8.5v-17z" fill={color} stroke="#fff3d2" strokeOpacity=".75" strokeWidth=".8" />
      <path d="M-11 7V-1l3-2v-5h4v5H-2v-5h4v5h2v-5h4v5l3 2v8z" fill="#202c30" stroke="#f3dfb6" strokeWidth="1.15" strokeLinejoin="round" />
      <path d="M-3 7V2q3-4 6 0v5" fill="#d8bd86" stroke="#fff1cf" strokeWidth=".8" />
      <path d="M-8 0h3m5-4h2m5 4h3" stroke="#f4dfaf" strokeWidth="1" strokeLinecap="round" />
      {capital && <path d="m-5-21 2-4 3 3 3-3 2 4" fill="none" stroke="#f3d079" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />}
      {wonder && <path d="M-3-13 0-18l3 5z" fill="#f3d079" stroke="#fff0c8" strokeWidth=".7" />}
      <circle cx="15" cy="13" r="6.4" fill="#15212a" stroke="#ead9b4" strokeWidth=".9" />
      <text x="15" y="15.7" textAnchor="middle" fontSize="7.3" fontWeight="800" fill="#f7edda">{level}</text>
      <path d="M-13 24h26" stroke="#15212a" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M-12 24h24" stroke="#5c5140" strokeWidth="1.8" strokeLinecap="round" />
      <path d={`M-12 24h${24 * ratio}`} stroke={ratio > 0.4 ? '#a8cf8c' : '#e27b68'} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="-31" y="27.5" width="62" height="12" rx="5" fill="#101b20" fillOpacity=".85" stroke="#e7d2a1" strokeOpacity=".28" strokeWidth=".65" />
      <text x="0" y="36" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#f3e6c9" letterSpacing=".15">{name}</text>
    </g>
  );
}
