import { useEffect, useMemo, useRef, useState } from 'react';
import { CIVS, UNITS } from '../game/data';
import { cityMaxHp } from '../game/engine';
import { HEX_SIZE, hexCorners, hexToPixel, key, neighbors } from '../game/hex';
import type { GameState, Unit } from '../game/types';
import type { ReachEntry } from '../game/engine';
import { CityToken, ResourceMark, SpecialMark, TerrainArt, UnitToken } from './MapArt';

const BORDER_EDGE = [0, 5, 4, 3, 2, 1];

function hexVertices(cx: number, cy: number, size: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return { x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) };
  });
}

interface Props {
  state: GameState;
  visible: Set<string>;
  selectedUnit: Unit | null;
  selectedKey: string | null;
  reach: Record<string, ReachEntry>;
  targets: string[];
  focus: { q: number; r: number } | null;
  onTileClick: (k: string) => void;
}

export default function HexMap({ state, visible, selectedUnit, selectedKey, reach, targets, focus, onTileClick }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ tx: 40, ty: 40, scale: 1 });
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);

  const tiles = useMemo(() => Object.values(state.tiles), [state.tiles, state.rev]);

  const bounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const t of tiles) {
      const { x, y } = hexToPixel(t.q, t.r);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    return { minX: minX - HEX_SIZE * 1.2, minY: minY - HEX_SIZE * 1.2, w: maxX - minX + HEX_SIZE * 2.4, h: maxY - minY + HEX_SIZE * 2.4 };
  }, [tiles]);

  const unitMap = useMemo(() => {
    const m: Record<string, Unit> = {};
    for (const u of Object.values(state.units)) m[key(u.q, u.r)] = u;
    return m;
  }, [state.units, state.rev]);

  useEffect(() => {
    if (!focus || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const p = hexToPixel(focus.q, focus.r);
    setView((v) => ({ ...v, tx: rect.width / 2 - (p.x - bounds.minX) * v.scale, ty: rect.height / 2 - (p.y - bounds.minY) * v.scale }));
  }, [focus, bounds.minX, bounds.minY]);

  const onWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setView((v) => {
      const scale = Math.min(2.2, Math.max(0.42, v.scale * delta));
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return { ...v, scale };
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const k = scale / v.scale;
      return { scale, tx: mx - (mx - v.tx) * k, ty: my - (my - v.ty) * k };
    });
  };

  const reachKeys = useMemo(() => new Set(Object.keys(reach)), [reach]);
  const targetSet = useMemo(() => new Set(targets), [targets]);
  const selUnitKey = selectedUnit ? key(selectedUnit.q, selectedUnit.r) : null;

  return (
    <div
      ref={wrapRef}
      className="hex-map-canvas relative h-full w-full cursor-grab touch-none overflow-hidden active:cursor-grabbing"
      onWheel={onWheel}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: false };
        (e.target as Element).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.x;
        const dy = e.clientY - drag.current.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true;
        setView((v) => ({ ...v, tx: drag.current!.tx + dx, ty: drag.current!.ty + dy }));
      }}
      onPointerUp={() => {
        setTimeout(() => (drag.current = null), 0);
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})` }}
      >
        <svg width={bounds.w} height={bounds.h} className="block select-none" role="img" aria-label="Гексагональная карта Тессеры">
          <defs>
            <filter id="mapShadow" x="-35%" y="-35%" width="170%" height="180%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#06131a" floodOpacity=".55" />
            </filter>
            <linearGradient id="terrain-plains" x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox">
              <stop stopColor="#a8ad6b" />
              <stop offset=".54" stopColor="#bac17a" />
              <stop offset="1" stopColor="#9b9f61" />
            </linearGradient>
            <linearGradient id="terrain-forest" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
              <stop stopColor="#4e7758" />
              <stop offset=".56" stopColor="#66895c" />
              <stop offset="1" stopColor="#416b51" />
            </linearGradient>
            <linearGradient id="terrain-hills" x1="0" y1="0" x2=".85" y2="1" gradientUnits="objectBoundingBox">
              <stop stopColor="#bc9b65" />
              <stop offset=".56" stopColor="#b28d58" />
              <stop offset="1" stopColor="#92764f" />
            </linearGradient>
            <linearGradient id="terrain-mountains" x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox">
              <stop stopColor="#a8a39a" />
              <stop offset=".5" stopColor="#898a84" />
              <stop offset="1" stopColor="#696f70" />
            </linearGradient>
            <linearGradient id="terrain-desert" x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox">
              <stop stopColor="#d3b77e" />
              <stop offset=".58" stopColor="#c9a96d" />
              <stop offset="1" stopColor="#b18f5c" />
            </linearGradient>
            <linearGradient id="terrain-swamp" x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox">
              <stop stopColor="#78896a" />
              <stop offset=".55" stopColor="#687e65" />
              <stop offset="1" stopColor="#526e60" />
            </linearGradient>
            <linearGradient id="terrain-tundra" x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox">
              <stop stopColor="#d8e1d5" />
              <stop offset=".58" stopColor="#bccbc2" />
              <stop offset="1" stopColor="#9dafa8" />
            </linearGradient>
            <linearGradient id="terrain-coast" x1="0" y1="0" x2=".7" y2="1" gradientUnits="objectBoundingBox">
              <stop stopColor="#61979a" />
              <stop offset=".56" stopColor="#4d858d" />
              <stop offset="1" stopColor="#3a6f7d" />
            </linearGradient>
            <linearGradient id="terrain-ocean" x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox">
              <stop stopColor="#366f85" />
              <stop offset=".55" stopColor="#2d627c" />
              <stop offset="1" stopColor="#244f6b" />
            </linearGradient>
            <linearGradient id="terrain-reef" x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox">
              <stop stopColor="#55a59a" />
              <stop offset=".58" stopColor="#428f87" />
              <stop offset="1" stopColor="#31776f" />
            </linearGradient>
          </defs>
          {tiles.map((t) => {
            const k = key(t.q, t.r);
            const p = hexToPixel(t.q, t.r);
            const cx = p.x - bounds.minX;
            const cy = p.y - bounds.minY;
            const human = state.players[state.human];
            const explored = !!human.explored[k];
            const vis = visible.has(k);
            const pts = hexCorners(cx, cy, HEX_SIZE - 0.6);
            if (!explored) {
              return <polygon key={k} points={pts} fill="#112330" stroke="#1a3443" strokeWidth={1.2} />;
            }
            const city = t.city ? state.cities[t.city] : null;
            const unit = vis ? unitMap[k] : undefined;
            const ownerColor = t.owner !== null && t.owner !== undefined ? CIVS[state.players[t.owner]?.civ]?.color : null;
            const isReach = reachKeys.has(k) && k !== selUnitKey;
            const isTarget = targetSet.has(k);
            const vertices = hexVertices(cx, cy, HEX_SIZE - 1.2);
            const borderEdges = ownerColor
              ? neighbors(t.q, t.r).flatMap((n, i) => {
                  const next = state.tiles[key(n.q, n.r)];
                  if (next?.owner === t.owner) return [];
                  const edge = BORDER_EDGE[i];
                  return [
                    <line
                      key={`${k}-border-${i}`}
                      x1={vertices[edge].x}
                      y1={vertices[edge].y}
                      x2={vertices[(edge + 1) % 6].x}
                      y2={vertices[(edge + 1) % 6].y}
                      stroke={ownerColor}
                      strokeWidth="2.7"
                      strokeLinecap="round"
                      opacity=".95"
                      vectorEffect="non-scaling-stroke"
                    />,
                  ];
                })
              : [];
            const connectedRoads = t.road
              ? neighbors(t.q, t.r).flatMap((n, i) => {
                  const next = state.tiles[key(n.q, n.r)];
                  if (!next || next.owner !== t.owner || (!next.road && !next.city)) return [];
                  const dx = n.q + n.r / 2;
                  const dy = n.r * 0.866;
                  const length = Math.hypot(dx, dy) || 1;
                  return [{ x: (dx / length) * 24, y: (dy / length) * 24, id: i }];
                })
              : [];
            return (
              <g key={k} onClick={() => !drag.current?.moved && onTileClick(k)} className="map-hex-group cursor-pointer">
                <polygon points={pts} fill={`url(#terrain-${t.t})`} stroke="#d4cfb0" strokeOpacity=".48" strokeWidth="1.15" />
                <polygon points={hexCorners(cx, cy, HEX_SIZE - 4.5)} fill="none" stroke="#f7edcf" strokeOpacity=".12" strokeWidth=".8" />
                <TerrainArt terrain={t.t} q={t.q} r={t.r} x={cx} y={cy} />
                {ownerColor && <polygon points={pts} fill={ownerColor} fillOpacity=".09" stroke="none" />}
                {borderEdges}
                {t.road && (
                  <g className="map-road" pointerEvents="none">
                    {connectedRoads.length === 0 && <path d="M-20 1H20" transform={`translate(${cx} ${cy})`} />}
                    {connectedRoads.map((road) => (
                      <g key={road.id}>
                        <path d={`M${cx} ${cy}L${cx + road.x} ${cy + road.y}`} className="map-road-shadow" />
                        <path d={`M${cx} ${cy}L${cx + road.x} ${cy + road.y}`} className="map-road-line" />
                      </g>
                    ))}
                    <circle cx={cx} cy={cy} r="2.1" fill="#dfc18a" stroke="#675039" strokeWidth="1" />
                  </g>
                )}
                {t.res && <ResourceMark type={t.res} x={cx + 18} y={cy - 14} improved={t.imp} />}
                {city && (
                  <g filter="url(#mapShadow)">
                    <CityToken
                      x={cx}
                      y={cy}
                      color={CIVS[state.players[city.owner].civ].color}
                      name={city.name}
                      level={city.level}
                      hp={city.hp}
                      maxHp={cityMaxHp(state, city)}
                      capital={city.capital}
                      wonder={!!city.wonder}
                    />
                  </g>
                )}
                {unit && (
                  <g filter="url(#mapShadow)">
                    <UnitToken
                      x={cx}
                      y={cy - (city ? 19 : 0)}
                      type={unit.type}
                      color={state.players[unit.owner].barb ? '#77675b' : CIVS[state.players[unit.owner].civ].color}
                      hp={unit.hp}
                      maxHp={UNITS[unit.type].hp}
                      veteran={unit.vet}
                      dimmed={unit.acted && unit.owner === state.human}
                      ready={!unit.acted && unit.owner === state.human}
                      label={UNITS[unit.type].name}
                    />
                  </g>
                )}
                {t.special && !city && (
                  <g filter="url(#mapShadow)">
                    <SpecialMark type={t.special} x={cx + (unit ? 19 : 0)} y={cy + (unit ? 14 : 0)} scale={unit ? 0.72 : 1} />
                  </g>
                )}
                {!vis && <polygon points={pts} fill="#10212b" fillOpacity=".49" />}
                {isReach && (
                  <g className="map-reachable" pointerEvents="none">
                    <polygon points={pts} fill="#e8f2c1" fillOpacity=".12" stroke="#d6efc2" strokeOpacity=".76" strokeWidth="1.8" strokeDasharray="4 4" />
                    <circle cx={cx} cy={cy} r="3.5" fill="#e6f2ca" stroke="#385c59" strokeWidth="1.2" />
                  </g>
                )}
                {isTarget && (
                  <polygon
                    points={pts}
                    className="map-attack-target"
                    fill="#d65447"
                    fillOpacity=".19"
                    stroke="#ffc08d"
                    strokeWidth="2.6"
                    pointerEvents="none"
                  />
                )}
                {k === selUnitKey && <polygon points={hexCorners(cx, cy, HEX_SIZE - 2)} className="map-selected-hex" fill="none" pointerEvents="none" />}
                {k === selectedKey && k !== selUnitKey && (
                  <polygon points={hexCorners(cx, cy, HEX_SIZE - 2)} fill="none" stroke="#fff2cb" strokeWidth="2" strokeDasharray="5 3" pointerEvents="none" />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex gap-2">
        <button
          className="map-control pointer-events-auto rounded-lg px-3 py-1.5 text-sm text-white shadow"
          onClick={() => setView((v) => ({ ...v, scale: Math.min(2.2, v.scale * 1.2) }))}
        >
          ＋
        </button>
        <button
          className="map-control pointer-events-auto rounded-lg px-3 py-1.5 text-sm text-white shadow"
          onClick={() => setView((v) => ({ ...v, scale: Math.max(0.42, v.scale / 1.2) }))}
        >
          －
        </button>
      </div>
    </div>
  );
}
