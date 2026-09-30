import { useEffect, useMemo, useRef, useState } from 'react';
import HexMap from './components/HexMap';
import TopBar from './components/TopBar';
import TilePanel from './components/TilePanel';
import SidePanel from './components/SidePanel';
import CityModal from './components/CityModal';
import { GameOverModal, GrowthModal, PauseMenu, RulesModal, StartMenu } from './components/Modals';
import { CIVS, CIV_LIST } from './game/data';
import { key } from './game/hex';
import {
  EVENTS,
  addLog,
  applyGrowth,
  attackTargets,
  buildRoad,
  buyBuilding,
  buyUnit,
  buyWonder,
  checkVictory,
  chopForest,
  computeReachable,
  declareWar,
  disbandUnit,
  doFoundCity,
  drainSwamp,
  improveTile,
  makePeace,
  moveUnit,
  newGame,
  playerIncome,
  playerScore,
  playerUnits,
  research,
  resolveAttack,
  startTurn,
  unitSlots,
  visibleSet,
} from './game/engine';
import { aiTakeTurn, aiWantsPeace, aiWantsTrade } from './game/ai';
import { clearSave, hasSave, loadGame, loadSettings, saveGame, saveSettings } from './game/save';
import type { CivKey, GameState } from './game/types';
import { Btn } from './components/ui';

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [selUnitId, setSelUnitId] = useState<string | null>(null);
  const [selTile, setSelTile] = useState<string | null>(null);
  const [side, setSide] = useState<'tech' | 'cities' | 'diplo' | 'log' | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [pause, setPause] = useState(false);
  const [rules, setRules] = useState(false);
  const [overShown, setOverShown] = useState(true);
  const [busy, setBusy] = useState(false);
  const [aiName, setAiName] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: 'info' | 'bad' | 'good' } | null>(null);
  const [focus, setFocus] = useState<{ q: number; r: number } | null>(null);
  const [stats, setStats] = useState(() => loadSettings());

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const ref = useRef<GameState | null>(null);
  ref.current = state;

  const mutate = (fn: (s: GameState) => void) => {
    const cur = ref.current;
    if (!cur) return;
    const next = { ...cur };
    fn(next);
    next.rev = cur.rev + 1;
    ref.current = next;
    setState(next);
  };

  const flash = (text: string, kind: 'info' | 'bad' | 'good' = 'info') => setToast({ text, kind });

  /* ----------------------------- game setup ----------------------------- */

  const startNew = (o: { humanCiv: CivKey; size: 'small' | 'medium'; bots: number; maxTurns: number }) => {
    const pool = CIV_LIST.filter((c) => c !== o.humanCiv).sort(() => Math.random() - 0.5);
    const g = newGame({ size: o.size, humanCiv: o.humanCiv, opponents: pool.slice(0, o.bots), maxTurns: o.maxTurns });
    setState(g);
    setScreen('game');
    setSelUnitId(null);
    setSelTile(null);
    setOverShown(true);
    const cap = Object.values(g.cities).find((c) => c.owner === 0);
    if (cap) setFocus({ q: cap.q, r: cap.r });
    saveGame(g);
    const st = { ...stats, games: stats.games + 1, lastCiv: o.humanCiv };
    setStats(st);
    saveSettings(st);
  };

  const continueGame = () => {
    const g = loadGame();
    if (!g) {
      flash('Сохранение не найдено', 'bad');
      return;
    }
    setState(g);
    setScreen('game');
    setOverShown(true);
    const cap = Object.values(g.cities).find((c) => c.owner === g.human);
    if (cap) setFocus({ q: cap.q, r: cap.r });
  };

  /* ----------------------------- derived ----------------------------- */

  const selUnit = state && selUnitId ? state.units[selUnitId] ?? null : null;
  const visible = useMemo(() => (state ? visibleSet(state, state.human) : new Set<string>()), [state?.rev]);
  const income = useMemo(() => (state ? playerIncome(state, state.human) : { stars: 0, sci: 0, culture: 0, lines: [] }), [state?.rev]);
  const reach = useMemo(
    () => (state && selUnit && selUnit.owner === state.human && !selUnit.acted ? computeReachable(state, selUnit) : {}),
    [state?.rev, selUnitId],
  );
  const targets = useMemo(
    () => (state && selUnit && selUnit.owner === state.human ? attackTargets(state, selUnit) : []),
    [state?.rev, selUnitId],
  );

  /* ----------------------------- actions ----------------------------- */

  const onTileClick = (k: string) => {
    if (!state || busy) return;
    const s = state;
    const tile = s.tiles[k];
    if (!tile) return;
    const unitHere = Object.values(s.units).find((u) => key(u.q, u.r) === k);

    if (selUnit && selUnit.owner === s.human && !selUnit.acted) {
      if (targets.includes(k)) {
        mutate((g) => {
          const u = g.units[selUnit.id];
          if (!u) return;
          const res = resolveAttack(g, u, k);
          addLog(g, res.text, 'war');
          setToast({ text: res.text, kind: res.killed || res.captured ? 'good' : 'info' });
          checkVictory(g);
        });
        return;
      }
      if (reach[k] && k !== key(selUnit.q, selUnit.r)) {
        mutate((g) => {
          const u = g.units[selUnit.id];
          if (u) moveUnit(g, u, k);
        });
        setSelTile(k);
        return;
      }
    }

    if (unitHere && unitHere.owner === s.human) {
      setSelUnitId(unitHere.id);
      setSelTile(k);
      return;
    }
    setSelUnitId(unitHere && unitHere.owner === s.human ? unitHere.id : null);
    setSelTile(k);
  };

  const tileAction = (a: string, payload?: string) => {
    if (!state) return;
    mutate((g) => {
      const u = selUnitId ? g.units[selUnitId] : null;
      let err: string | null = null;
      if (a === 'found' && u) {
        err = doFoundCity(g, u);
        if (!err) setSelUnitId(null);
      } else if (a === 'skip' && u) {
        u.acted = true;
        u.mp = 0;
      } else if (a === 'disband' && u) {
        disbandUnit(g, u);
        setSelUnitId(null);
      } else if (a === 'improve' && payload) err = improveTile(g, g.human, payload);
      else if (a === 'road' && payload) err = buildRoad(g, g.human, payload);
      else if (a === 'chop' && payload) err = chopForest(g, g.human, payload);
      else if (a === 'drain' && payload) err = drainSwamp(g, g.human, payload);
      else if (a === 'openCity' && payload) setCityId(payload);
      if (err) setToast({ text: err, kind: 'bad' });
    });
  };

  const sideAction = (a: string, payload?: string) => {
    if (!state || !payload) return;
    if (a === 'focus') {
      const c = state.cities[payload];
      if (c) setFocus({ q: c.q, r: c.r });
      return;
    }
    if (a === 'openCity') {
      setCityId(payload);
      return;
    }
    mutate((g) => {
      if (a === 'research') {
        const err = research(g, g.human, payload);
        if (err) setToast({ text: err, kind: 'bad' });
        else checkVictory(g);
      } else if (a === 'war') {
        declareWar(g, g.human, Number(payload));
      } else if (a === 'peace') {
        const id = Number(payload);
        if (aiWantsPeace(g, id, g.human)) {
          makePeace(g, g.human, id);
          setToast({ text: 'Мир заключён', kind: 'good' });
        } else {
          addLog(g, `${g.players[id].name} отвергли предложение мира`, 'war');
          setToast({ text: 'Предложение отвергнуто', kind: 'bad' });
        }
      } else if (a === 'trade') {
        const id = Number(payload);
        if (aiWantsTrade(g, id, g.human)) {
          g.players[g.human].trade[id] = true;
          g.players[id].trade[g.human] = true;
          g.players[g.human].relations[id] = (g.players[g.human].relations[id] ?? 0) + 20;
          g.players[id].relations[g.human] = (g.players[id].relations[g.human] ?? 0) + 20;
          addLog(g, `🤝 Торговое соглашение с ${g.players[id].name}`, 'good');
          setToast({ text: 'Торговое соглашение заключено', kind: 'good' });
        } else {
          setToast({ text: 'Торговое предложение отвергнуто', kind: 'bad' });
        }
      }
    });
  };

  const cityAction = (a: string, payload: string) => {
    if (!state || !cityId) return;
    mutate((g) => {
      const c = g.cities[cityId];
      if (!c) return;
      let err: string | null = null;
      if (a === 'buyUnit') err = buyUnit(g, c, payload);
      else if (a === 'buyBuilding') err = buyBuilding(g, c, payload);
      else if (a === 'buyWonder') {
        err = buyWonder(g, c, payload);
        if (!err) checkVictory(g);
      }
      if (err) setToast({ text: err, kind: 'bad' });
    });
  };

  const nextUnit = () => {
    if (!state) return;
    const mine = playerUnits(state, state.human).filter((u) => !u.acted && u.mp > 0);
    if (!mine.length) {
      flash('Нет юнитов, готовых к действию');
      return;
    }
    const idx = mine.findIndex((u) => u.id === selUnitId);
    const u = mine[(idx + 1) % mine.length];
    setSelUnitId(u.id);
    setSelTile(key(u.q, u.r));
    setFocus({ q: u.q, r: u.r });
  };

  /* ----------------------------- turn cycle ----------------------------- */

  const endTurn = async () => {
    if (!state || busy) return;
    if (state.pendingGrowth.length) {
      flash('Сначала выберите расширение города', 'bad');
      return;
    }
    if (state.winner !== null) {
      flash('Партия окончена');
      return;
    }
    setBusy(true);
    setSelUnitId(null);
    const count = state.players.length;
    for (let pid = 1; pid < count; pid++) {
      const pl = ref.current?.players[pid];
      if (!pl || !pl.alive) continue;
      if (ref.current?.winner !== null) break;
      setAiName(pl.barb ? 'Варвары' : pl.name);
      mutate((g) => {
        g.current = pid;
        startTurn(g, pid);
      });
      await sleep(90);
      mutate((g) => {
        aiTakeTurn(g, pid);
        checkVictory(g);
      });
      await sleep(260);
    }
    setAiName(null);
    mutate((g) => {
      g.current = g.human;
      g.turn += 1;
      if (g.turn % 10 === 0) {
        const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        ev.apply(g);
        addLog(g, ev.text, 'event');
        g.lastEvent = ev.text;
      }
      startTurn(g, g.human);
      checkVictory(g);
      if (!g.players[g.human].alive && g.winner === null) {
        const alive = g.players.filter((p) => !p.barb && p.alive);
        let best = alive[0];
        for (const p of alive) if (playerScore(g, p.id) > playerScore(g, best.id)) best = p;
        g.winner = best ? best.id : null;
        g.victory = 'Ваша держава уничтожена';
      }
      saveGame(g);
    });
    setBusy(false);
    const ev = ref.current?.lastEvent;
    if (ev && ref.current && ref.current.turn % 10 === 0) flash(ev, 'info');
    if (ref.current && ref.current.winner === null) {
      const idleUnits = playerUnits(ref.current, ref.current.human).filter((u) => !u.acted);
      if (idleUnits.length) {
        setSelUnitId(idleUnits[0].id);
        setSelTile(key(idleUnits[0].q, idleUnits[0].r));
      }
    }
  };

  useEffect(() => {
    if (!state || state.winner === null) return;
    if (state.winner === state.human && overShown) {
      const st = { ...stats, wins: stats.wins + 1 };
      if (st.wins !== stats.wins) {
        setStats(st);
        saveSettings(st);
      }
    }
  }, [state?.winner]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (screen !== 'game') return;
      if (e.code === 'Space') {
        e.preventDefault();
        endTurn();
      } else if (e.code === 'Escape') {
        setSelUnitId(null);
        setSide(null);
        setCityId(null);
      } else if (e.key === 'n' || e.key === 'т') nextUnit();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  /* ----------------------------- render ----------------------------- */

  if (screen === 'menu' || !state) {
    return (
      <>
        <StartMenu onStart={startNew} hasSaveGame={hasSave()} onContinue={continueGame} onRules={() => setRules(true)} stats={stats} />
        {rules && <RulesModal onClose={() => setRules(false)} />}
      </>
    );
  }

  const human = state.players[state.human];
  const growth = state.pendingGrowth[0] ?? null;
  const city = cityId ? state.cities[cityId] : null;
  const idle = playerUnits(state, state.human).filter((u) => !u.acted && u.mp > 0).length;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0b141d] text-slate-100">
      <TopBar
        state={state}
        income={income}
        busy={busy}
        onEndTurn={endTurn}
        unitsUsed={playerUnits(state, state.human).length}
        unitsMax={unitSlots(state, state.human)}
        onOpen={(p) => {
          if (p === 'rules') setRules(true);
          else if (p === 'menu') setPause(true);
          else setSide((cur) => (cur === p ? null : (p as 'tech' | 'cities' | 'diplo' | 'log')));
        }}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <HexMap
          state={state}
          visible={visible}
          selectedUnit={selUnit}
          selectedKey={selTile}
          reach={reach}
          targets={targets}
          focus={focus}
          onTileClick={onTileClick}
        />

        <div
          className={`pointer-events-none absolute bottom-3 top-3 flex flex-col items-end justify-between gap-2 transition-all ${
            side ? 'right-[412px]' : 'right-3'
          }`}
        >
          <div className="pointer-events-auto flex flex-col items-end gap-1.5">
            <div className="rounded-xl border border-white/10 bg-[#101b26]/90 px-3 py-2 text-xs shadow-lg backdrop-blur">
              <div className="font-bold text-amber-200">
                {CIVS[human.civ].emoji} {human.name}
              </div>
              <div className="text-slate-400">Очки: {playerScore(state, state.human)}</div>
              <div className="text-slate-400">Готовы: {idle} юнит(ов)</div>
            </div>
            <Btn size="sm" onClick={nextUnit}>
              ⏭ Следующий юнит (N)
            </Btn>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3">
          <TilePanel state={state} tileKey={selTile} unit={selUnit} onAction={tileAction} />
        </div>

        {side && (
          <div className="absolute right-0 top-0 h-full">
            <SidePanel state={state} tab={side} onClose={() => setSide(null)} onAction={sideAction} />
          </div>
        )}

        {busy && (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-amber-500/40 bg-[#101b26]/95 px-5 py-2 text-sm font-semibold text-amber-200 shadow-xl">
            ⏳ Ход противника{aiName ? `: ${aiName}` : ''}…
          </div>
        )}

        {toast && (
          <div
            className={`pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-semibold shadow-xl ${
              toast.kind === 'bad' ? 'bg-rose-600/90 text-white' : toast.kind === 'good' ? 'bg-emerald-600/90 text-white' : 'bg-slate-800/95 text-slate-100'
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>

      {city && <CityModal state={state} city={city} onClose={() => setCityId(null)} onAction={cityAction} />}
      {growth && !busy && (
        <GrowthModal
          state={state}
          choice={growth}
          onApply={(tileKey, extra) =>
            mutate((g) => {
              const ch = g.pendingGrowth.shift();
              if (ch) applyGrowth(g, ch, tileKey, extra);
            })
          }
        />
      )}
      {rules && <RulesModal onClose={() => setRules(false)} />}
      {pause && (
        <PauseMenu
          state={state}
          onClose={() => setPause(false)}
          onRules={() => {
            setPause(false);
            setRules(true);
          }}
          onSave={() => {
            saveGame(state);
            setPause(false);
            flash('Игра сохранена', 'good');
          }}
          onMenu={() => {
            saveGame(state);
            setPause(false);
            setScreen('menu');
          }}
        />
      )}
      {state.winner !== null && overShown && (
        <GameOverModal
          state={state}
          onClose={() => setOverShown(false)}
          onMenu={() => {
            clearSave();
            setScreen('menu');
            setState(null);
          }}
        />
      )}
    </div>
  );
}
