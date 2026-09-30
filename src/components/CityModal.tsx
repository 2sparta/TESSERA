import { BUILDINGS, CIVS, UNITS, WONDERS, WONDER_COST, foodNeeded } from '../game/data';
import {
  availableBuildings,
  availableUnits,
  buildingCost,
  cityIncome,
  cityMaxHp,
  cityDefense,
  playerUnits,
  unitCost,
  unitSlots,
} from '../game/engine';
import type { City, GameState } from '../game/types';
import { UnitBadge } from './MapArt';
import { Bar, Btn, Chip, Modal } from './ui';

interface Props {
  state: GameState;
  city: City;
  onClose: () => void;
  onAction: (a: string, payload: string) => void;
}

export default function CityModal({ state, city, onClose, onAction }: Props) {
  const p = state.players[city.owner];
  const inc = cityIncome(state, city);
  const builds = availableBuildings(state, city);
  const units = availableUnits(state, city);
  const slotsUsed = playerUnits(state, p.id).length;
  const slotsMax = unitSlots(state, p.id);

  return (
    <Modal
      wide
      title={
        <span>
          {city.capital ? '👑' : '🏙️'} {city.name} <span className="text-sm font-normal text-slate-400">уровень {city.level}</span>
        </span>
      }
      onClose={onClose}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300/90">Экономика города</div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Chip className="bg-amber-500/20">★ +{inc.stars}</Chip>
              <Chip className="bg-sky-500/20">🔬 +{inc.sci}</Chip>
              <Chip className="bg-fuchsia-500/20">🎭 +{inc.culture}</Chip>
              <Chip className="bg-lime-500/20">🌾 {inc.food} − {inc.upkeep} едят</Chip>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Рост до уровня {city.level + 1}</div>
            <div className="mt-1 flex items-center gap-2">
              <Bar value={city.food} max={foodNeeded(city.level)} color="bg-lime-500" />
              <span className="w-14 text-right text-[10px] text-slate-400">
                {city.food}/{foodNeeded(city.level)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Оборона</div>
            <div className="mt-1 flex items-center gap-2">
              <Bar value={city.hp} max={cityMaxHp(state, city)} color="bg-rose-500" />
              <span className="w-14 text-right text-[10px] text-slate-400">
                {city.hp}/{cityMaxHp(state, city)}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Защита: {cityDefense(state, city)} · Территория: {city.tiles.length} клеток</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300/90">Построено</div>
            <div className="flex flex-wrap gap-1.5">
              {city.buildings.filter((b) => BUILDINGS[b]).map((b) => (
                <span key={b} className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-200" title={BUILDINGS[b].desc}>
                  {BUILDINGS[b].icon} {BUILDINGS[b].name}
                </span>
              ))}
              {city.wonder && (
                <span className="rounded-md bg-fuchsia-500/20 px-2 py-1 text-xs text-fuchsia-200">
                  {WONDERS[city.wonder].icon} {WONDERS[city.wonder].name}
                </span>
              )}
              {city.buildings.includes('tribute') && <Chip className="bg-cyan-500/20">дань (+1★)</Chip>}
              {city.buildings.filter((b) => BUILDINGS[b]).length === 0 && !city.wonder && (
                <span className="text-xs text-slate-500">Пока ничего не построено</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-300/90">Постройки</div>
          {builds.map((b) => {
            const cost = buildingCost(state, p.id, b);
            return (
              <div key={b} className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/40 p-2">
                <span className="text-lg">{BUILDINGS[b].icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{BUILDINGS[b].name}</div>
                  <div className="text-[11px] leading-snug text-slate-400">{BUILDINGS[b].desc}</div>
                </div>
                <Btn size="sm" variant={p.stars >= cost ? 'primary' : 'default'} disabled={p.stars < cost} onClick={() => onAction('buyBuilding', b)}>
                  {cost}★
                </Btn>
              </div>
            );
          })}
          {city.level >= 4 && !city.wonder && (
            <>
              <div className="pt-1 text-xs font-bold uppercase tracking-wider text-fuchsia-300/90">Чудо света ({WONDER_COST}★)</div>
              {Object.entries(WONDERS)
                .filter(([k]) => !state.wonders.includes(k))
                .map(([k, w]) => (
                  <div key={k} className="flex items-center gap-2 rounded-lg border border-fuchsia-400/20 bg-fuchsia-500/5 p-2">
                    <span className="text-lg">{w.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{w.name}</div>
                      <div className="text-[11px] text-slate-400">{w.desc}</div>
                    </div>
                    <Btn size="sm" disabled={p.stars < WONDER_COST} variant={p.stars >= WONDER_COST ? 'primary' : 'default'} onClick={() => onAction('buyWonder', k)}>
                      {WONDER_COST}★
                    </Btn>
                  </div>
                ))}
            </>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300/90">Найм юнитов</div>
            <Chip className={slotsUsed >= slotsMax ? 'bg-rose-500/30' : ''}>
              слоты {slotsUsed}/{slotsMax}
            </Chip>
          </div>
          {units.map((u) => {
            const d = UNITS[u];
            const cost = unitCost(state, p.id, u, city);
            const blocked = p.stars < cost || slotsUsed >= slotsMax;
            return (
              <div key={u} className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800/40 p-2">
                <UnitBadge type={u} color={CIVS[p.civ].color} size={34} />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{d.name}</div>
                  <div className="flex flex-wrap gap-1 text-[10px] text-slate-400">
                    <span>⚔{d.atk}</span>
                    <span>🛡{d.def}</span>
                    <span>❤{d.hp}</span>
                    <span>👣{d.mv}</span>
                    {d.rng > 1 && <span>🎯{d.rng}</span>}
                  </div>
                </div>
                <Btn size="sm" variant={!blocked ? 'primary' : 'default'} disabled={blocked} onClick={() => onAction('buyUnit', u)}>
                  {cost}★
                </Btn>
              </div>
            );
          })}
          {city.buildings.includes('barracks') && <div className="text-[11px] text-emerald-300">Казармы: новые юниты — Ветераны (+1 атака)</div>}
        </div>
      </div>
    </Modal>
  );
}
