import { CIVS, RESOURCES, TERRAIN, UNITS } from '../game/data';
import { canFoundCity, canImprove, has, isWater, tileYield } from '../game/engine';
import type { GameState, Unit } from '../game/types';
import { UnitBadge } from './MapArt';
import { Bar, Btn, Chip } from './ui';

interface Props {
  state: GameState;
  tileKey: string | null;
  unit: Unit | null;
  onAction: (a: string, payload?: string) => void;
}

export default function TilePanel({ state, tileKey, unit, onAction }: Props) {
  const p = state.players[state.human];
  const tile = tileKey ? state.tiles[tileKey] : null;
  const city = tile && tile.city ? state.cities[tile.city] : null;
  const isMine = unit?.owner === state.human;

  return (
    <div className="pointer-events-auto w-[320px] max-w-[92vw] rounded-2xl border border-amber-700/40 bg-[#101b26]/95 p-3 text-slate-100 shadow-2xl backdrop-blur">
      {unit && (
        <div className="mb-2 rounded-xl border border-white/10 bg-slate-800/60 p-2.5">
          <div className="flex items-center gap-2">
            <UnitBadge
              type={unit.type}
              color={state.players[unit.owner].barb ? '#77675b' : CIVS[state.players[unit.owner].civ].color}
              size={40}
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-sm font-bold">
                {UNITS[unit.type].name}
                {unit.vet === 1 && <span className="text-amber-300">★</span>}
                {unit.vet === 2 && <span className="text-amber-300">★★</span>}
              </div>
              <div className="text-[11px] text-slate-400">{state.players[unit.owner].name}</div>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-emerald-300">
                {unit.hp}/{UNITS[unit.type].hp}
              </div>
              <div className="text-slate-400">HP</div>
            </div>
          </div>
          <div className="mt-1.5">
            <Bar value={unit.hp} max={UNITS[unit.type].hp} color={unit.hp / UNITS[unit.type].hp > 0.5 ? 'bg-emerald-500' : 'bg-rose-500'} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
            <Chip className="bg-rose-500/20">⚔ {UNITS[unit.type].atk}</Chip>
            <Chip className="bg-sky-500/20">🛡 {UNITS[unit.type].def}</Chip>
            <Chip className="bg-emerald-500/20">👣 {unit.mp.toFixed(1)}</Chip>
            {UNITS[unit.type].rng > 1 && <Chip className="bg-amber-500/20">🎯 {UNITS[unit.type].rng}</Chip>}
            {unit.kills > 0 && <Chip>убийств: {unit.kills}</Chip>}
            {unit.acted && <Chip className="bg-slate-500/30">ход завершён</Chip>}
          </div>
          <div className="mt-1.5 text-[11px] leading-snug text-slate-400">{UNITS[unit.type].note}</div>

          {isMine && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {UNITS[unit.type].settler && (
                <Btn size="sm" variant="primary" disabled={!!canFoundCity(state, unit)} title={canFoundCity(state, unit) ?? 'Основать город'} onClick={() => onAction('found')}>
                  🚩 Основать город
                </Btn>
              )}
              {!unit.acted && (
                <Btn size="sm" onClick={() => onAction('skip')}>
                  ⏸ Пропустить
                </Btn>
              )}
              <Btn size="sm" variant="danger" onClick={() => onAction('disband')}>
                🗑 Расформировать
              </Btn>
            </div>
          )}
        </div>
      )}

      {tile && (
        <div className="rounded-xl border border-white/10 bg-slate-800/40 p-2.5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-amber-100">
              {TERRAIN[tile.t].name} <span className="text-[11px] font-normal text-slate-400">({tile.q}, {tile.r})</span>
            </div>
            {tile.owner !== null && tile.owner !== undefined && (
              <span className="rounded px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: CIVS[state.players[tile.owner].civ].color + '55' }}>
                {state.players[tile.owner].name}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
            {(() => {
              const y = tileYield(state, tile, p);
              return (
                <>
                  <Chip className="bg-lime-500/20">🌾 {y.food}</Chip>
                  <Chip className="bg-amber-500/20">★ {y.stars}</Chip>
                  <Chip className="bg-sky-500/20">🔬 {y.sci}</Chip>
                  <Chip>👣 {TERRAIN[tile.t].impassable ? '—' : TERRAIN[tile.t].move}</Chip>
                  {TERRAIN[tile.t].def !== 0 && (
                    <Chip className={TERRAIN[tile.t].def > 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}>
                      защита {TERRAIN[tile.t].def > 0 ? '+' : ''}
                      {Math.round(TERRAIN[tile.t].def * 100)}%
                    </Chip>
                  )}
                </>
              );
            })()}
          </div>
          {tile.res && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-base">{RESOURCES[tile.res].icon}</span>
              <span className="font-semibold">{RESOURCES[tile.res].name}</span>
              {tile.imp ? (
                <Chip className="bg-emerald-500/25">освоено</Chip>
              ) : tile.owner === state.human ? (
                <Btn
                  size="sm"
                  variant="primary"
                  disabled={!canImprove(state, state.human, tile) || p.stars < RESOURCES[tile.res].cost}
                  title={!canImprove(state, state.human, tile) ? 'Нужна технология' : ''}
                  onClick={() => onAction('improve', tileKey!)}
                >
                  Освоить {RESOURCES[tile.res].cost}★
                </Btn>
              ) : (
                <Chip>не освоено</Chip>
              )}
            </div>
          )}
          {tile.special && (
            <div className="mt-2 text-xs text-slate-300">
              {tile.special === 'village' && `🏘️ Деревня${tile.villageOwner !== null && tile.villageOwner !== undefined ? ` — под контролем ${state.players[tile.villageOwner].name}` : ' — свободна, займите юнитом'}`}
              {tile.special === 'ruins' && '🏺 Древние руины — войдите юнитом ради награды'}
              {tile.special === 'barbarians' && '💀 Стойбище варваров — уничтожьте ради +10★'}
              {tile.special === 'pirates' && '🏴‍☠️ Пиратское логово — уничтожьте флотом ради +15★'}
            </div>
          )}

          {tile.owner === state.human && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.civ === 'rome' && !tile.road && !isWater(tile.t) && tile.t !== 'mountains' && (
                <Btn size="sm" onClick={() => onAction('road', tileKey!)}>
                  🛣 Дорога (бесплатно)
                </Btn>
              )}
              {has(p, 'gal_logging') && tile.t === 'forest' && (
                <Btn size="sm" onClick={() => onAction('chop', tileKey!)}>
                  🪓 Срубить лес (+8★)
                </Btn>
              )}
              {p.civ === 'phoenicia' && tile.t === 'swamp' && (
                <Btn size="sm" disabled={p.stars < 5} onClick={() => onAction('drain', tileKey!)}>
                  💧 Осушить (5★)
                </Btn>
              )}
            </div>
          )}

          {city && (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-900/60 p-2">
              <div>
                <div className="text-sm font-bold">{city.name}</div>
                <div className="text-[11px] text-slate-400">
                  Уровень {city.level} · HP {city.hp} · {city.buildings.filter((b) => b !== 'tribute').length} построек
                </div>
              </div>
              {city.owner === state.human && (
                <Btn size="sm" variant="primary" onClick={() => onAction('openCity', city.id)}>
                  Открыть
                </Btn>
              )}
            </div>
          )}
        </div>
      )}

      {!tile && !unit && (
        <div className="space-y-1 p-2 text-xs text-slate-400">
          <div className="font-semibold text-amber-200">Как играть</div>
          <div>• Кликните свой отряд — белые точки это доступные клетки хода.</div>
          <div>• Красные гексы — цели атаки. Клик по ним = бой.</div>
          <div>• Кликните свой город и нажмите «Открыть», чтобы нанимать войска и строить.</div>
          <div>• Пробел — конец хода, N — следующий отряд, колесо мыши — зум.</div>
        </div>
      )}
    </div>
  );
}
