import { useState } from 'react';
import { BUILDINGS, CIVS, CIV_LIST, RESOURCES, TERRAIN, UNITS, WONDERS } from '../game/data';
import { playerCities, playerScore, tileYield } from '../game/engine';
import type { CivKey, GameState, GrowthChoice } from '../game/types';
import { Btn, Chip, Modal } from './ui';

/* ------------------------- Start menu ------------------------- */

export function StartMenu({
  onStart,
  hasSaveGame,
  onContinue,
  onRules,
  stats,
}: {
  onStart: (o: { humanCiv: CivKey; size: 'small' | 'medium'; bots: number; maxTurns: number }) => void;
  hasSaveGame: boolean;
  onContinue: () => void;
  onRules: () => void;
  stats: { wins: number; games: number };
}) {
  const [civ, setCiv] = useState<CivKey>('sparta');
  const [size, setSize] = useState<'small' | 'medium'>('small');
  const [bots, setBots] = useState(1);
  const [turns, setTurns] = useState(30);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-[#0b141d] bg-[radial-gradient(ellipse_at_top,#1e3a52_0%,#0b141d_60%)] px-4 py-8 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 17v34L30 68 0 51V17z' fill='none' stroke='%23e0b063' stroke-opacity='.13'/%3E%3Cpath d='M0 52l30 17v34L0 120l-30-17V69z' fill='none' stroke='%23e0b063' stroke-opacity='.13'/%3E%3Cpath d='M60 52l30 17v34l-30 17-30-17V69z' fill='none' stroke='%23e0b063' stroke-opacity='.13'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <div className="text-5xl font-black tracking-[0.3em] text-amber-300 drop-shadow">ТЕССЕРА</div>
          <div className="mt-2 text-sm tracking-widest text-slate-400">ГЕКСАГОНАЛЬНАЯ 4X-СТРАТЕГИЯ АНТИЧНОСТИ</div>
          <div className="mt-1 text-xs text-slate-500">
            Партия {turns} ходов · один ход = сезон года · победа: доминирование, наука, экономика или очки
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CIV_LIST.map((c) => {
            const d = CIVS[c];
            const sel = civ === c;
            return (
              <button
                key={c}
                onClick={() => setCiv(c)}
                className={`rounded-2xl border p-3 text-left transition ${
                  sel ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-900/40' : 'border-white/10 bg-white/5 hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{d.emoji}</span>
                  <div>
                    <div className="font-bold" style={{ color: d.color }}>
                      {d.name}
                    </div>
                    <div className="text-[11px] italic text-slate-400">«{d.motto}»</div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-semibold text-amber-200">{d.bonusName}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-400">{d.bonus}</div>
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">Карта</div>
            <div className="flex gap-1">
              <Btn variant={size === 'small' ? 'primary' : 'default'} size="sm" onClick={() => setSize('small')}>
                Малая 11×11
              </Btn>
              <Btn variant={size === 'medium' ? 'primary' : 'default'} size="sm" onClick={() => setSize('medium')}>
                Средняя 16×16
              </Btn>
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">Боты</div>
            <div className="flex gap-1">
              {[1, 2, 3].map((n) => (
                <Btn key={n} variant={bots === n ? 'primary' : 'default'} size="sm" onClick={() => setBots(n)}>
                  {n}
                </Btn>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">Длина партии</div>
            <div className="flex gap-1">
              {[30, 40, 60].map((n) => (
                <Btn key={n} variant={turns === n ? 'primary' : 'default'} size="sm" onClick={() => setTurns(n)}>
                  {n} ходов
                </Btn>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Btn variant="gold" size="lg" onClick={() => onStart({ humanCiv: civ, size, bots, maxTurns: turns })}>
            ⚔️ Новая партия
          </Btn>
          {hasSaveGame && (
            <Btn size="lg" onClick={onContinue}>
              💾 Продолжить
            </Btn>
          )}
          <Btn size="lg" variant="ghost" onClick={onRules}>
            📜 Правила
          </Btn>
        </div>
        <div className="mt-4 text-center text-xs text-slate-500">
          Сыграно партий: {stats.games} · Побед: {stats.wins} · прогресс хранится в локальном хранилище браузера
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Rules ------------------------- */

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal wide title="📜 Правила ТЕССЕРЫ" onClose={onClose}>
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <section>
          <h3 className="mb-1 font-bold text-amber-200">Ход</h3>
          <p className="text-slate-300">
            Доход → рост городов → движение и бой → покупки → конец хода. Столица даёт 3★ и 2🔬, обычный город — 2★ и 1🔬, плюс по +1★ за
            каждые 2 населения и доход от клеток в границах.
          </p>
        </section>
        <section>
          <h3 className="mb-1 font-bold text-amber-200">Города</h3>
          <p className="text-slate-300">
            Пища с клеток минус 2 за каждый уровень идёт в рост. Пороги: 8 / 18 / 35 / 60 / +45. На каждом уровне вы сами выбираете, какой
            соседний гекс присоединить. Ур. 3 — бесплатная постройка, ур. 4 — слот юнита, ур. 5 — Чудо света.
          </p>
        </section>
        <section>
          <h3 className="mb-1 font-bold text-amber-200">Бой</h3>
          <p className="text-slate-300">
            Урон = Атака × Атака/(Атака+Защита) × 4 × модификаторы × (0.9…1.1). Лес и холмы дают +25% защиты, горы +50%, болото −25%. Фланг:
            +10% за каждого союзника рядом с целью (макс +30%). Лучники и осадные орудия не получают ответного удара. Стены снижают урон по
            городу на 50% без осадных юнитов.
          </p>
        </section>
        <section>
          <h3 className="mb-1 font-bold text-amber-200">Победа</h3>
          <ul className="list-disc pl-4 text-slate-300">
            <li>Доминирование — все столицы или 2/3 городов</li>
            <li>Наука — открыть всё дерево технологий</li>
            <li>Экономика — 300★ и 2 чуда света</li>
            <li>Очки к финальному ходу: город +1, уровень +2, чудо +3, юнит +1, технология +1</li>
          </ul>
        </section>
        <section>
          <h3 className="mb-1 font-bold text-amber-200">Местность</h3>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
            {Object.entries(TERRAIN).map(([k, t]) => (
              <div key={k} className="flex items-center gap-1 rounded bg-white/5 px-1.5 py-1">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: t.color }} />
                {t.name}: 🌾{t.food} ★{t.stars} 👣{t.impassable ? '—' : t.move}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-1 font-bold text-amber-200">Ресурсы</h3>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
            {Object.entries(RESOURCES).map(([k, r]) => (
              <div key={k} className="rounded bg-white/5 px-1.5 py-1">
                {r.icon} {r.name}: 🌾{r.food} ★{r.stars} 🔬{r.sci} — {r.cost}★
              </div>
            ))}
          </div>
        </section>
        <section className="md:col-span-2">
          <h3 className="mb-1 font-bold text-amber-200">Особые клетки</h3>
          <p className="text-slate-300">
            🏘️ Деревни захватываются юнитом: дают бесплатного Воина и +1★/ход. 🏺 Древние руины — разовая награда. 💀 Стойбища варваров и 🏴‍☠️
            пиратские логова каждые 5 ходов извергают врагов, при уничтожении дают +10★ / +15★.
          </p>
        </section>
      </div>
    </Modal>
  );
}

/* ------------------------- Growth ------------------------- */

export function GrowthModal({ state, choice, onApply }: { state: GameState; choice: GrowthChoice; onApply: (tileKey: string | null, extra?: string) => void }) {
  const city = state.cities[choice.cityId];
  const [tile, setTile] = useState<string | null>(choice.options[0] ?? null);
  const [extra, setExtra] = useState<string | undefined>(() => {
    if (choice.reward === 'building') return ['library', 'barracks', 'workshop'].find((b) => !city?.buildings.includes(b));
    if (choice.reward === 'wonder') return Object.keys(WONDERS).find((w) => !state.wonders.includes(w));
    return undefined;
  });
  if (!city) return null;
  const p = state.players[city.owner];

  return (
    <Modal
      title={`🏙️ ${city.name} — уровень ${choice.level}`}
      onClose={() => onApply(tile, extra)}
      footer={
        <div className="flex justify-end">
          <Btn variant="gold" onClick={() => onApply(tile, extra)}>
            Подтвердить
          </Btn>
        </div>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="text-slate-300">Выберите гекс для расширения границ:</div>
        <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3">
          {choice.options.map((k) => {
            const t = state.tiles[k];
            if (!t) return null;
            const y = tileYield(state, t, p);
            return (
              <button
                key={k}
                onClick={() => setTile(k)}
                className={`rounded-lg border p-2 text-left text-xs transition ${
                  tile === k ? 'border-amber-400 bg-amber-400/15' : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: TERRAIN[t.t].color }} />
                  {TERRAIN[t.t].name}
                  {t.res && <span>{RESOURCES[t.res].icon}</span>}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-400">
                  🌾{y.food} ★{y.stars} 🔬{y.sci}
                </div>
              </button>
            );
          })}
          {choice.options.length === 0 && <div className="col-span-3 text-xs text-slate-400">Свободных соседних клеток нет.</div>}
        </div>

        {choice.reward === 'star' && <div className="rounded-lg bg-amber-500/10 p-2 text-amber-200">Награда: +3★ в казну.</div>}
        {choice.reward === 'slot' && <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-200">Награда: +1 слот юнита на карте.</div>}
        {choice.reward === 'building' && (
          <div>
            <div className="mb-1 text-slate-300">Бесплатная постройка:</div>
            <div className="flex flex-wrap gap-1.5">
              {['library', 'barracks', 'workshop']
                .filter((b) => !city.buildings.includes(b))
                .map((b) => (
                  <Btn key={b} size="sm" variant={extra === b ? 'primary' : 'default'} onClick={() => setExtra(b)}>
                    {BUILDINGS[b].icon} {BUILDINGS[b].name}
                  </Btn>
                ))}
            </div>
          </div>
        )}
        {choice.reward === 'wonder' && (
          <div>
            <div className="mb-1 text-slate-300">Бесплатное Чудо света:</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(WONDERS)
                .filter(([k]) => !state.wonders.includes(k))
                .map(([k, w]) => (
                  <Btn key={k} size="sm" variant={extra === k ? 'primary' : 'default'} onClick={() => setExtra(k)}>
                    {w.icon} {w.name}
                  </Btn>
                ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------- Game over ------------------------- */

export function GameOverModal({ state, onMenu, onClose }: { state: GameState; onMenu: () => void; onClose: () => void }) {
  const winner = state.winner !== null ? state.players[state.winner] : null;
  const human = state.players[state.human];
  const won = winner?.id === human.id;
  return (
    <Modal
      title={won ? '🏆 Победа!' : '☠️ Поражение'}
      onClose={onClose}
      footer={
        <div className="flex justify-between">
          <Btn variant="ghost" onClick={onClose}>
            Осмотреть карту
          </Btn>
          <Btn variant="gold" onClick={onMenu}>
            В главное меню
          </Btn>
        </div>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <div className="text-lg font-bold" style={{ color: winner ? CIVS[winner.civ].color : '#fff' }}>
            {winner ? `${CIVS[winner.civ].emoji} ${winner.name}` : '—'}
          </div>
          <div className="text-xs text-slate-400">{state.victory}</div>
        </div>
        <table className="w-full text-xs">
          <thead className="text-slate-400">
            <tr>
              <th className="text-left">Держава</th>
              <th>Города</th>
              <th>Юниты</th>
              <th>Технологии</th>
              <th>Очки</th>
            </tr>
          </thead>
          <tbody>
            {state.players
              .filter((p) => !p.barb)
              .map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="py-1 font-semibold" style={{ color: CIVS[p.civ].color }}>
                    {CIVS[p.civ].emoji} {p.name}
                  </td>
                  <td className="text-center">{playerCities(state, p.id).length}</td>
                  <td className="text-center">{Object.values(state.units).filter((u) => u.owner === p.id).length}</td>
                  <td className="text-center">{p.techs.length}</td>
                  <td className="text-center font-bold">{playerScore(state, p.id)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

/* ------------------------- Pause / settings ------------------------- */

export function PauseMenu({ onClose, onSave, onMenu, onRules, state }: { onClose: () => void; onSave: () => void; onMenu: () => void; onRules: () => void; state: GameState }) {
  const human = state.players[state.human];
  return (
    <Modal title="⚙️ Меню партии" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="font-bold text-amber-100">
            {CIVS[human.civ].emoji} {human.name}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Chip>ход {state.turn}/{state.maxTurns}</Chip>
            <Chip>городов {playerCities(state, human.id).length}</Chip>
            <Chip>юнитов {Object.values(state.units).filter((u) => u.owner === human.id).length}</Chip>
            <Chip>очки {playerScore(state, human.id)}</Chip>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">{CIVS[human.civ].bonus}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Btn onClick={onSave}>💾 Сохранить</Btn>
          <Btn onClick={onRules}>📜 Правила</Btn>
          <Btn variant="ghost" onClick={onClose}>
            ↩️ Продолжить
          </Btn>
          <Btn variant="danger" onClick={onMenu}>
            🏠 В меню
          </Btn>
        </div>
        <div className="text-[11px] text-slate-500">
          Игра автоматически сохраняется в конце каждого хода. Уникальные юниты вашей державы:{' '}
          {Object.values(UNITS)
            .filter((u) => u.civ === human.civ)
            .map((u) => u.name)
            .join(', ') || '—'}
          .
        </div>
      </div>
    </Modal>
  );
}
