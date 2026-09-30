import { CIVS } from '../game/data';
import type { Income } from '../game/engine';
import type { GameState } from '../game/types';
import { Btn } from './ui';

interface Props {
  state: GameState;
  income: Income;
  busy: boolean;
  onEndTurn: () => void;
  onOpen: (p: 'tech' | 'cities' | 'diplo' | 'log' | 'rules' | 'menu') => void;
  unitsUsed: number;
  unitsMax: number;
}

export default function TopBar({ state, income, busy, onEndTurn, onOpen, unitsUsed, unitsMax }: Props) {
  const p = state.players[state.human];
  const civ = CIVS[p.civ];
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-amber-700/30 bg-[#0d1620]/95 px-3 py-2 text-slate-100 shadow-lg">
      <div className="flex items-center gap-2 pr-2">
        <span className="text-xl">{civ.emoji}</span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-amber-100">ТЕССЕРА</div>
          <div className="text-[11px] text-slate-400">{civ.name}</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/70 px-2.5 py-1">
        <span className="text-amber-300">★</span>
        <span className="font-bold">{p.stars}</span>
        <span className="text-xs text-emerald-400">+{income.stars}</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/70 px-2.5 py-1">
        <span className="text-sky-300">🔬</span>
        <span className="font-bold">{p.science}</span>
        <span className="text-xs text-emerald-400">+{income.sci}</span>
      </div>
      <div className="hidden items-center gap-1.5 rounded-lg bg-slate-800/70 px-2.5 py-1 sm:flex">
        <span className="text-fuchsia-300">🎭</span>
        <span className="font-bold">{p.culture}</span>
      </div>
      <div className="hidden items-center gap-1.5 rounded-lg bg-slate-800/70 px-2.5 py-1 md:flex" title="Юниты / лимит">
        <span>⚔️</span>
        <span className="font-bold">
          {unitsUsed}/{unitsMax}
        </span>
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/70 px-2.5 py-1">
        <span className="text-xs text-slate-400">Ход</span>
        <span className="font-bold">
          {Math.min(state.turn, state.maxTurns)}/{state.maxTurns}
        </span>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <Btn size="sm" variant="ghost" onClick={() => onOpen('tech')}>
          🔬 Науки
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => onOpen('cities')}>
          🏙️ Города
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => onOpen('diplo')}>
          🕊️ Дипломатия
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => onOpen('log')}>
          📜 Журнал
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => onOpen('rules')}>
          ❔
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => onOpen('menu')}>
          ⚙️
        </Btn>
        <Btn variant="gold" onClick={onEndTurn} disabled={busy} className="min-w-[130px]">
          {busy ? 'Ход ИИ…' : 'Конец хода ⏭'}
        </Btn>
      </div>
    </div>
  );
}
