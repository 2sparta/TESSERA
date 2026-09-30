import { CIVS } from '../game/data';
import { atWar, cityIncome, has, playerCities, playerScore } from '../game/engine';
import { foodNeeded } from '../game/data';
import type { GameState } from '../game/types';
import { Bar, Btn, Chip } from './ui';

interface Props {
  state: GameState;
  tab: 'tech' | 'cities' | 'diplo' | 'log';
  onClose: () => void;
  onAction: (a: string, payload?: string, extra?: number) => void;
}

export default function SidePanel({ state, tab, onClose, onAction }: Props) {
  const p = state.players[state.human];
  const civ = CIVS[p.civ];

  return (
    <div className="pointer-events-auto flex h-full w-[400px] max-w-[95vw] flex-col border-l border-amber-700/40 bg-[#0e1822]/97 text-slate-100 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-amber-700/30 px-3 py-2">
        <div className="text-sm font-bold tracking-wide text-amber-100">
          {tab === 'tech' && '🔬 Дерево технологий'}
          {tab === 'cities' && '🏙️ Города державы'}
          {tab === 'diplo' && '🕊️ Дипломатия'}
          {tab === 'log' && '📜 Журнал событий'}
        </div>
        <button onClick={onClose} className="rounded px-2 py-0.5 text-slate-400 hover:bg-white/10 hover:text-white">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'tech' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-sky-500/10 p-2 text-xs text-sky-200">
              Наука: <b>{p.science}</b>. Изучено {p.techs.length} из {civ.branches.flatMap((b) => b.techs).length}. Открой всё дерево — научная победа.
            </div>
            {civ.branches.map((br, bi) => (
              <div key={bi}>
                <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-amber-300/90">Ветка: {br.name}</div>
                <div className="space-y-1.5">
                  {br.techs.map((t, ti) => {
                    const learned = has(p, t.id);
                    const prevOk = ti === 0 || has(p, br.techs[ti - 1].id);
                    const canBuy = !learned && prevOk && p.science >= t.cost;
                    return (
                      <div
                        key={t.id}
                        className={`rounded-lg border p-2 ${
                          learned ? 'border-emerald-500/40 bg-emerald-500/10' : prevOk ? 'border-white/15 bg-slate-800/60' : 'border-white/5 bg-slate-900/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold">
                            {learned ? '✅ ' : prevOk ? '' : '🔒 '}
                            {t.name}
                          </div>
                          {!learned && (
                            <Btn size="sm" variant={canBuy ? 'primary' : 'default'} disabled={!canBuy} onClick={() => onAction('research', t.id)}>
                              {t.cost === 0 ? 'Бесплатно' : `${t.cost} 🔬`}
                            </Btn>
                          )}
                        </div>
                        <div className="mt-1 text-[11px] leading-snug text-slate-400">{t.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'cities' && (
          <div className="space-y-2">
            {playerCities(state, state.human).map((c) => {
              const inc = cityIncome(state, c);
              return (
                <div key={c.id} className="rounded-xl border border-white/10 bg-slate-800/50 p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold">
                      {c.capital ? '👑 ' : '🏙️ '}
                      {c.name} <span className="text-xs font-normal text-slate-400">ур. {c.level}</span>
                    </div>
                    <div className="flex gap-1">
                      <Btn size="sm" variant="ghost" onClick={() => onAction('focus', c.id)}>
                        🎯
                      </Btn>
                      <Btn size="sm" variant="primary" onClick={() => onAction('openCity', c.id)}>
                        Открыть
                      </Btn>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
                    <Chip className="bg-amber-500/20">★ +{inc.stars}</Chip>
                    <Chip className="bg-sky-500/20">🔬 +{inc.sci}</Chip>
                    <Chip className="bg-lime-500/20">
                      🌾 {inc.food - inc.upkeep >= 0 ? '+' : ''}
                      {inc.food - inc.upkeep}
                    </Chip>
                    <Chip>❤️ {c.hp}</Chip>
                    {c.wonder && <Chip className="bg-fuchsia-500/20">🏛 чудо</Chip>}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Bar value={c.food} max={foodNeeded(c.level)} color="bg-lime-500" />
                    <span className="w-14 text-right text-[10px] text-slate-400">
                      {c.food}/{foodNeeded(c.level)}
                    </span>
                  </div>
                </div>
              );
            })}
            {playerCities(state, state.human).length === 0 && <div className="text-sm text-slate-400">Городов нет.</div>}
          </div>
        )}

        {tab === 'diplo' && (
          <div className="space-y-2">
            {state.players
              .filter((o) => !o.barb && o.id !== state.human)
              .map((o) => {
                const war = atWar(state, state.human, o.id);
                const rel = p.relations[o.id] ?? 0;
                return (
                  <div key={o.id} className="rounded-xl border border-white/10 bg-slate-800/50 p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{CIVS[o.civ].emoji}</span>
                        <div>
                          <div className="text-sm font-bold">{o.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {o.alive ? (war ? '⚔️ Война' : p.trade[o.id] ? '🤝 Торговое соглашение' : '🕊️ Мир') : '☠️ Уничтожены'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-[11px]">
                        <div className="text-slate-400">отношения</div>
                        <div className={rel >= 0 ? 'font-bold text-emerald-300' : 'font-bold text-rose-300'}>{rel}</div>
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-slate-400">
                      <Chip>городов: {playerCities(state, o.id).length}</Chip>
                      <Chip>очки: {playerScore(state, o.id)}</Chip>
                    </div>
                    {o.alive && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {war ? (
                          <Btn size="sm" onClick={() => onAction('peace', String(o.id))}>
                            🕊️ Предложить мир
                          </Btn>
                        ) : (
                          <>
                            <Btn size="sm" variant="danger" onClick={() => onAction('war', String(o.id))}>
                              ⚔️ Объявить войну
                            </Btn>
                            {!p.trade[o.id] && (
                              <Btn size="sm" onClick={() => onAction('trade', String(o.id))}>
                                🤝 Торговый договор
                              </Btn>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            <div className="rounded-lg bg-white/5 p-2 text-[11px] text-slate-400">
              Торговое соглашение даёт обеим сторонам +1★ в ход. Война с сильным соседом опасна: ИИ атакует города и разоряет деревни.
            </div>
          </div>
        )}

        {tab === 'log' && (
          <div className="space-y-1">
            {state.log.map((l, i) => (
              <div
                key={i}
                className={`rounded-md px-2 py-1 text-xs ${
                  l.kind === 'war'
                    ? 'bg-rose-500/10 text-rose-200'
                    : l.kind === 'good'
                      ? 'bg-emerald-500/10 text-emerald-200'
                      : l.kind === 'event'
                        ? 'bg-amber-500/10 text-amber-200'
                        : l.kind === 'bad'
                          ? 'bg-orange-500/10 text-orange-200'
                          : 'bg-white/5 text-slate-300'
                }`}
              >
                <span className="mr-1 text-[10px] text-slate-500">[{l.turn}]</span>
                {l.text}
              </div>
            ))}
            {state.log.length === 0 && <div className="text-sm text-slate-400">Пока пусто.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
