import React, { useEffect, useMemo, useState } from 'react';
import { Archive, CheckCircle2, ChevronRight, Clock3, FilePlus2, ListChecks, Pencil, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import '../../styles/my-list-workspace.css';
import { selectActiveHrList, useHrListStore } from '../../features/hr-list/hrListStore';
import type { HrListEntry } from '../../features/hr-list/hrListTypes';
import {
  selectDraftLegs,
  selectSavedSlips,
  useParlayCommandStore,
  type DraftParlayLeg,
  type ParlayCommandPanel,
} from '../../stores/parlayCommandStore';
import { assessClientParlayIdentity } from '../../lib/parlayIdentity';
import { assessSlipOdds } from '../../lib/parlays/slipOddsPolicy';
import { draftLegsToUiLegs } from '../../lib/parlays/draftLegsToUiLegs';
import { normalizeParlayLeg, normalizeParlaySlip, type CanonicalParlaySlip } from '../../lib/parlays/parlayBridge';
import type { ParlaySaveResult } from '../../domain/parlayActions';
import type { CreatorProofProfile } from '../../types';

type WorkspaceView = 'list' | 'parlay' | 'saved';
type ListState = 'players' | 'waiting' | 'removed';
type Comparator = '>=' | '>' | '<=' | '<' | '=';

const MARKETS = [
  { code: 'ANYTIME_HR', label: 'Home Run', target: 1 },
  { code: 'HIT', label: 'Hits', target: 1 },
  { code: 'TOTAL_BASES', label: 'Total Bases', target: 1 },
  { code: 'RBI', label: 'RBI', target: 1 },
  { code: 'RUN', label: 'Runs', target: 1 },
  { code: 'WALK', label: 'Walks', target: 1 },
  { code: 'STOLEN_BASE', label: 'Stolen Base', target: 1 },
] as const;

const COMPARATORS: Array<{ value: Comparator; label: string }> = [
  { value: '>=', label: 'At least' }, { value: '>', label: 'Over' },
  { value: '<=', label: 'At most' }, { value: '<', label: 'Under' },
  { value: '=', label: 'Exactly' },
];

function marketLabel(code: string | null | undefined) {
  return MARKETS.find((market) => market.code === code)?.label ?? code ?? 'Market';
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 1;
}

function playerToLeg(entry: HrListEntry, marketCode: string, target: number, comparator: Comparator): DraftParlayLeg {
  const gamePk = entry.gamePk == null ? undefined : String(entry.gamePk);
  const playerId = String(entry.playerId);
  return {
    id: ['player', gamePk, playerId, marketCode, target, comparator].filter(Boolean).join('_'),
    source: 'manual', sport: 'MLB',
    selection: `${entry.playerName} · ${comparator} ${target} ${marketLabel(marketCode)}`,
    playerName: entry.playerName, playerId, teamId: entry.teamId ?? null,
    teamLabel: entry.team ?? null, gameId: gamePk ?? null, gamePk,
    marketCode, marketLabel: marketLabel(marketCode), statTarget: target, comparator,
    odds: entry.bestOdds ?? null, externalProvider: 'mlb_statsapi',
    eventKey: gamePk ? ['mlb', gamePk, playerId, marketCode, target, comparator].join('_') : null,
    note: entry.note ?? null,
  };
}

function TargetArchive({ kind }: { kind: 'waiting' | 'removed' }) {
  const waiting = useParlayCommandStore((state) => state.waitingTargets);
  const removed = useParlayCommandStore((state) => state.removedTargets);
  const promote = useParlayCommandStore((state) => state.promoteWaitingTarget);
  const remove = useParlayCommandStore((state) => state.removeWaitingTarget);
  const restore = useParlayCommandStore((state) => state.restoreRemovedTarget);
  const clear = useParlayCommandStore((state) => state.clearRemovedTargets);
  const targets = kind === 'waiting' ? waiting : removed;

  if (targets.length === 0) return (
    <div className="parlay-next-empty"><Archive /><h3>{kind === 'waiting' ? 'Nothing is waiting' : 'Nothing has been removed'}</h3><p>{kind === 'waiting' ? 'Unconfirmed targets can wait here without affecting the active parlay.' : 'Removed targets stay recoverable until you clear them.'}</p></div>
  );
  return (
    <div className="parlay-next-archive">
      {targets.map((target) => <article key={target.id}>
        <div><strong>{target.leg.playerName ?? target.leg.selection}</strong><span>{marketLabel(target.leg.marketCode)} · {target.reason ?? 'No reason recorded'}</span></div>
        <div><button type="button" onClick={() => kind === 'waiting' ? promote(target.id) : restore(target.id)}><RotateCcw /> {kind === 'waiting' ? 'Add to Parlay' : 'Restore'}</button>{kind === 'waiting' ? <button type="button" className="is-danger" onClick={() => remove(target.id, 'Removed from waiting')}><Trash2 /> Remove</button> : null}</div>
      </article>)}
      {kind === 'removed' ? <button type="button" className="parlay-next-clear" onClick={clear}>Clear removed targets</button> : null}
    </div>
  );
}

function MyListEditor({ onSectionChange, onOpenParlay }: { onSectionChange?: (section: string) => void; onOpenParlay: () => void }) {
  const [listState, setListState] = useState<ListState>('players');
  const [editing, setEditing] = useState<HrListEntry | null>(null);
  const [marketCode, setMarketCode] = useState('ANYTIME_HR');
  const [target, setTarget] = useState(1);
  const [comparator, setComparator] = useState<Comparator>('>=');
  const [newListName, setNewListName] = useState('');
  const [message, setMessage] = useState('');
  const lists = useHrListStore((state) => state.lists);
  const activeList = useHrListStore(selectActiveHrList);
  const setActiveList = useHrListStore((state) => state.setActiveList);
  const createList = useHrListStore((state) => state.createList);
  const renameList = useHrListStore((state) => state.renameList);
  const removeList = useHrListStore((state) => state.removeList);
  const removePlayer = useHrListStore((state) => state.removePlayer);
  const setNote = useHrListStore((state) => state.setNote);
  const lastError = useHrListStore((state) => state.lastError);
  const addDraftLeg = useParlayCommandStore((state) => state.addDraftLeg);
  const waitingCount = useParlayCommandStore((state) => state.waitingTargets.length);
  const removedCount = useParlayCommandStore((state) => state.removedTargets.length);
  const players = activeList?.entries ?? [];

  function editPlayer(entry: HrListEntry) {
    setEditing(entry); setMarketCode('ANYTIME_HR'); setTarget(1); setComparator('>='); setMessage('');
  }
  function addToParlay() {
    if (!editing) return;
    if (editing.gamePk == null) { setMessage('This player needs a verified game before the leg can be graded.'); return; }
    addDraftLeg(playerToLeg(editing, marketCode, target, comparator));
    setMessage(`${editing.playerName} added to the active parlay.`); onOpenParlay();
  }
  async function makeList(event: React.FormEvent) {
    event.preventDefault(); const title = newListName.trim() || 'My Player List';
    await createList(title); setNewListName(''); setMessage(`${title} created.`);
  }

  return <section className="parlay-next-panel" aria-labelledby="my-list-heading">
    <div className="parlay-next-panel__heading"><div><p className="parlay-next-eyebrow">PLAYER LIBRARY</p><h2 id="my-list-heading">My List + Editor</h2><p>Save a player for research, then choose if and when they become a gradable parlay leg.</p></div><span className="parlay-next-count">{players.length} players</span></div>
    <div className="parlay-next-list-tools">
      {lists.length ? <select value={activeList?.id ?? ''} onChange={(event) => setActiveList(event.target.value)} aria-label="Choose My List">{lists.map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}</select> : null}
      <form onSubmit={makeList}><input value={newListName} onChange={(event) => setNewListName(event.target.value)} placeholder="New list name" maxLength={80} aria-label="New list name" /><button type="submit"><FilePlus2 /> New List</button></form>
      {activeList ? <div className="parlay-next-list-actions"><button type="button" onClick={() => { const title = window.prompt('Rename this list', activeList.title)?.trim(); if (title) void renameList(activeList.id, title); }}><Pencil /> Rename</button><button type="button" className="is-danger" onClick={() => { if (window.confirm(`Delete “${activeList.title}”?`)) void removeList(activeList.id); }}><Trash2 /> Delete</button></div> : null}
    </div>
    <div className="parlay-next-subnav" role="tablist" aria-label="My List states">
      <button type="button" role="tab" aria-selected={listState === 'players'} onClick={() => setListState('players')}><ListChecks /> Players <span>{players.length}</span></button>
      <button type="button" role="tab" aria-selected={listState === 'waiting'} onClick={() => setListState('waiting')}><Clock3 /> Waiting <span>{waitingCount}</span></button>
      <button type="button" role="tab" aria-selected={listState === 'removed'} onClick={() => setListState('removed')}><Archive /> Removed <span>{removedCount}</span></button>
    </div>
    {lastError ? <p className="parlay-next-alert is-error" role="alert">{lastError}</p> : null}{message ? <p className="parlay-next-alert" role="status">{message}</p> : null}
    {listState === 'players' ? <div className="parlay-next-editor-layout">
      <div className="parlay-next-player-list">
        {!players.length ? <div className="parlay-next-empty"><ListChecks /><h3>{activeList ? 'No players in this list' : 'Create your first player list'}</h3><p>Players added from HR Intelligence stay here without changing your parlay.</p>{activeList ? <button type="button" onClick={() => onSectionChange?.('hr_board')}>Find Players</button> : null}</div> : players.map((entry) => {
          const selected = editing && String(editing.playerId) === String(entry.playerId);
          return <article key={String(entry.playerId)} className={`parlay-next-player ${selected ? 'is-selected' : ''}`}><button type="button" className="parlay-next-player__main" onClick={() => editPlayer(entry)}><span className="parlay-next-player__name">{entry.playerName}</span><span>{[entry.team, entry.opponent ? `vs ${entry.opponent}` : null].filter(Boolean).join(' · ') || 'MLB player'}</span><span className={entry.gamePk == null ? 'is-warning' : 'is-verified'}>{entry.gamePk == null ? 'Game not verified' : `Game ${entry.gamePk} verified`}</span></button><button type="button" className="parlay-next-icon-button" aria-label={`Remove ${entry.playerName}`} onClick={() => activeList && void removePlayer(activeList.id, entry.playerId)}><X /></button></article>;
        })}
      </div>
      <div className="parlay-next-editor" aria-label="Player and parlay editor">
        {editing ? <><div className="parlay-next-editor__title"><div><p>EDITING PLAYER</p><h3>{editing.playerName}</h3></div><button type="button" aria-label="Close editor" onClick={() => setEditing(null)}><X /></button></div>
          <label>Market<select value={marketCode} onChange={(event) => { const next = event.target.value; setMarketCode(next); setTarget(MARKETS.find((market) => market.code === next)?.target ?? 1); }}>{MARKETS.map((market) => <option key={market.code} value={market.code}>{market.label}</option>)}</select></label>
          <div className="parlay-next-form-row"><label>Condition<select value={comparator} onChange={(event) => setComparator(event.target.value as Comparator)}>{COMPARATORS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Line<input type="number" min="0" step="0.5" value={target} onChange={(event) => setTarget(numberValue(event.target.value))} /></label></div>
          <label>Research note<textarea defaultValue={editing.note ?? ''} maxLength={140} placeholder="Why is this player on the list?" onBlur={(event) => activeList && void setNote(activeList.id, editing.playerId, event.target.value)} /></label>
          <div className="parlay-next-editor__preview"><span>Proposed leg</span><strong>{editing.playerName} · {COMPARATORS.find((item) => item.value === comparator)?.label} {target} {marketLabel(marketCode)}</strong></div>
          <div className="parlay-next-editor__actions"><button type="button" className="is-secondary" onClick={() => { setMessage(`${editing.playerName} remains player-only.`); setEditing(null); }}>Keep Player Only</button><button type="button" className="is-primary" disabled={editing.gamePk == null || !Number.isFinite(target)} onClick={addToParlay}><Plus /> Add to Parlay</button></div>
          {editing.gamePk == null ? <p className="parlay-next-help is-warning">A verified game is required before this player can become a gradable parlay leg.</p> : null}</> : <div className="parlay-next-empty is-compact"><Pencil /><h3>Select a player to edit</h3><p>Choose the market, condition, line, and note. Adding to a parlay is always a separate action.</p></div>}
      </div>
    </div> : <TargetArchive kind={listState} />}
  </section>;
}

function ActiveParlay({ onSaveParlay, onSectionChange }: { onSaveParlay?: (parlay: CanonicalParlaySlip) => Promise<ParlaySaveResult>; onSectionChange?: (section: string) => void }) {
  const draftLegs = useParlayCommandStore(selectDraftLegs);
  const updateDraftLeg = useParlayCommandStore((state) => state.updateDraftLeg);
  const removeDraftLeg = useParlayCommandStore((state) => state.removeDraftLeg);
  const moveToWaiting = useParlayCommandStore((state) => state.moveDraftLegToWaiting);
  const clearDraft = useParlayCommandStore((state) => state.clearDraft);
  const slipNote = useParlayCommandStore((state) => state.slipNote);
  const setSlipNote = useParlayCommandStore((state) => state.setSlipNote);
  const [stake, setStake] = useState(10); const [acknowledged, setAcknowledged] = useState(false); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  const identity = useMemo(() => assessClientParlayIdentity(draftLegs as unknown as Record<string, unknown>[]), [draftLegs]);
  const odds = useMemo(() => assessSlipOdds(draftLegsToUiLegs(draftLegs)), [draftLegs]);
  const payout = odds.combined?.decimal && Number.isFinite(odds.combined.decimal) ? Math.round(stake * odds.combined.decimal * 100) / 100 : null;
  const canSave = draftLegs.length > 0 && identity.complete && acknowledged && Boolean(onSaveParlay) && !saving;
  async function saveParlay() {
    if (!canSave || !onSaveParlay) return; setSaving(true); setMessage(''); const draftId = `draft-${Date.now()}`; const capturedAt = new Date().toISOString();
    try { const result = await onSaveParlay(normalizeParlaySlip({ id: draftId, clientRef: draftId, title: `MLB Parlay · ${new Date().toLocaleDateString()}`, mode: 'PRACTICE', source: 'manual_builder', sport: 'mlb', status: 'pending', wagerAmount: stake, legs: draftLegs.map((leg) => normalizeParlayLeg(leg)), createdAt: capturedAt, metadata: { savedContext: { slipNote: slipNote.trim() || null, capturedAt } } })); setMessage(result.syncState === 'synced' ? 'Parlay saved and synced.' : 'Parlay saved on this device; account sync is pending.'); clearDraft(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Parlay could not be saved.'); } finally { setSaving(false); }
  }
  return <section className="parlay-next-panel" aria-labelledby="active-parlay-heading">
    <div className="parlay-next-panel__heading"><div><p className="parlay-next-eyebrow">ACTIVE PARLAY</p><h2 id="active-parlay-heading">Parlay Editor</h2><p>Every leg carries an official player ID, game, market, condition, and target for deterministic grading.</p></div><span className="parlay-next-count">{draftLegs.length} legs</span></div>
    {message ? <p className="parlay-next-alert" role="status">{message}</p> : null}
    {!draftLegs.length ? <div className="parlay-next-empty"><ListChecks /><h3>Your active parlay is empty</h3><p>Add a verified player from My List, HR Intelligence, or Pitcher Matchup.</p><button type="button" onClick={() => onSectionChange?.('hr_board')}>Browse HR Players</button></div> : <>
      <div className="parlay-next-legs">{draftLegs.map((leg, index) => <article key={leg.id} className="parlay-next-leg"><div className="parlay-next-leg__number">{String(index + 1).padStart(2, '0')}</div><div className="parlay-next-leg__body">
        <div className="parlay-next-leg__title"><div><strong>{leg.playerName ?? leg.selection}</strong><span>{[leg.teamLabel, leg.gamePk ? `Game ${leg.gamePk}` : 'Game missing'].filter(Boolean).join(' · ')}</span></div><span className={leg.playerId && leg.gamePk ? 'is-verified' : 'is-warning'}>{leg.playerId && leg.gamePk ? 'GRADABLE' : 'REPAIR NEEDED'}</span></div>
        <div className="parlay-next-leg__controls"><label>Market<select value={leg.marketCode ?? 'ANYTIME_HR'} onChange={(event) => updateDraftLeg(leg.id, { marketCode: event.target.value, marketLabel: marketLabel(event.target.value) })}>{MARKETS.map((market) => <option key={market.code} value={market.code}>{market.label}</option>)}</select></label><label>Condition<select value={leg.comparator ?? '>='} onChange={(event) => updateDraftLeg(leg.id, { comparator: event.target.value })}>{COMPARATORS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Line<input type="number" min="0" step="0.5" value={numberValue(leg.statTarget)} onChange={(event) => updateDraftLeg(leg.id, { statTarget: numberValue(event.target.value) })} /></label><label>Odds<input value={leg.odds ?? ''} onChange={(event) => updateDraftLeg(leg.id, { odds: event.target.value })} placeholder="TBD" /></label></div>
        <label className="parlay-next-leg__note">Leg note<input value={leg.note ?? ''} maxLength={140} onChange={(event) => updateDraftLeg(leg.id, { note: event.target.value })} placeholder="Evidence or risk" /></label>
        <div className="parlay-next-leg__actions"><button type="button" onClick={() => moveToWaiting(leg.id, 'Moved from editor')}><Clock3 /> Move to Waiting</button><button type="button" className="is-danger" onClick={() => removeDraftLeg(leg.id, 'Removed from parlay editor')}><Trash2 /> Remove</button></div>
      </div></article>)}</div>
      <div className="parlay-next-summary"><div><span>Combined odds</span><strong>{odds.canShowCombined ? odds.combined?.american ?? 'TBD' : 'TBD'}</strong></div><label>Stake<input type="number" min="0" step="1" value={stake} onChange={(event) => setStake(Math.max(0, numberValue(event.target.value)))} /></label><div><span>Estimated payout</span><strong>{payout == null ? 'TBD' : `$${payout.toFixed(2)}`}</strong></div></div>
      {!odds.canShowCombined ? <p className="parlay-next-help">Combined odds stay hidden until every leg has usable odds. Correlated legs are adjusted by policy.</p> : null}
      {!identity.complete ? <p className="parlay-next-alert is-error">{identity.missingLegIndexes.length} leg(s) are missing official grading identity and cannot be saved.</p> : null}
      <label className="parlay-next-note">Parlay decision note<textarea value={slipNote} maxLength={500} onChange={(event) => setSlipNote(event.target.value)} placeholder="Record why you built this parlay before the result is known." /></label>
      <label className="parlay-next-ack"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>I understand this is a research tracker, not a guarantee. Bet responsibly.</span></label>
      <div className="parlay-next-savebar"><button type="button" className="is-danger" onClick={clearDraft}><Trash2 /> Clear Parlay</button><button type="button" className="is-primary" disabled={!canSave} onClick={() => void saveParlay()}><Save /> {saving ? 'Saving…' : 'Save Parlay'}</button></div>
    </>}
  </section>;
}

function SavedParlays({ slips }: { slips: unknown[] }) {
  const rows = slips as Array<Record<string, unknown>>;
  return <section className="parlay-next-panel" aria-labelledby="saved-parlays-heading"><div className="parlay-next-panel__heading"><div><p className="parlay-next-eyebrow">SAVED + GRADED</p><h2 id="saved-parlays-heading">Parlay Ledger</h2><p>Saved parlays remain evidence records while their legs settle from official game data.</p></div><span className="parlay-next-count">{rows.length} saved</span></div>
    {!rows.length ? <div className="parlay-next-empty"><Archive /><h3>No saved parlays yet</h3><p>Build a parlay with verified player and game identity, then save it here for grading.</p></div> : <div className="parlay-next-saved-list">{rows.map((slip, index) => { const legs = Array.isArray(slip.legs) ? slip.legs as Array<Record<string, unknown>> : []; return <article key={String(slip.id ?? index)}><div className="parlay-next-saved-list__heading"><div><strong>{String(slip.title ?? 'Saved Parlay')}</strong><span>{String(slip.createdAt ?? slip.created_at ?? '')}</span></div><span>{String(slip.status ?? 'pending').replaceAll('_', ' ').toUpperCase()}</span></div><ol>{legs.map((leg, legIndex) => <li key={String(leg.id ?? legIndex)}><CheckCircle2 /><div><strong>{String(leg.playerName ?? leg.selection ?? 'Player leg')}</strong><span>{String(leg.marketLabel ?? leg.marketCode ?? leg.market ?? 'Market')} · {String(leg.status ?? 'pending').toUpperCase()}</span></div></li>)}</ol></article>; })}</div>}
  </section>;
}

interface ParlayOsWorkspaceProps {
  savedSlips?: unknown[]; liveGames?: unknown[]; profile?: CreatorProofProfile; initialPanel?: ParlayCommandPanel;
  onSectionChange?: (section: string) => void; onAddLegToParlay?: (...args: any[]) => void;
  onSaveVouch?: (...args: any[]) => void; onPostCreated?: (...args: any[]) => void;
  onSaveParlay?: (parlay: CanonicalParlaySlip) => Promise<ParlaySaveResult>;
  onHideParlay?: (parlayId: string) => Promise<void> | void;
}

export default function ParlayOsWorkspace({ savedSlips = [], initialPanel = 'build', onSectionChange, onSaveParlay }: ParlayOsWorkspaceProps) {
  const [view, setView] = useState<WorkspaceView>(initialPanel === 'vai_ledger' || initialPanel === 'live' ? 'saved' : 'list');
  const draftLegs = useParlayCommandStore(selectDraftLegs);
  const commandSavedSlips = useParlayCommandStore(selectSavedSlips);
  const hydrateSavedSlips = useParlayCommandStore((state) => state.hydrateSavedSlips);
  useEffect(() => { hydrateSavedSlips(savedSlips); }, [hydrateSavedSlips, savedSlips]);
  useEffect(() => { setView(initialPanel === 'vai_ledger' || initialPanel === 'live' ? 'saved' : 'list'); }, [initialPanel]);
  return <main className="parlay-next" aria-labelledby="parlay-next-title">
    <header className="parlay-next-hero"><div><p className="parlay-next-eyebrow">VOUCHEDGE · MLB WORKSPACE</p><h1 id="parlay-next-title">My List &amp; Parlay Editor</h1><p>One player library. One active parlay. Official-ID grading for HR and every supported MLB market.</p></div><div className="parlay-next-hero__flow"><span>LIST</span><ChevronRight /><span>EDIT</span><ChevronRight /><span>PARLAY</span><ChevronRight /><span>GRADE</span></div></header>
    <nav className="parlay-next-nav" aria-label="My List and parlay workspace">
      <button type="button" aria-current={view === 'list' ? 'page' : undefined} onClick={() => setView('list')}><ListChecks /><span><strong>My List</strong><small>Players + editor</small></span></button>
      <button type="button" aria-current={view === 'parlay' ? 'page' : undefined} onClick={() => setView('parlay')}><Pencil /><span><strong>Active Parlay</strong><small>{draftLegs.length} gradable legs</small></span><b>{draftLegs.length}</b></button>
      <button type="button" aria-current={view === 'saved' ? 'page' : undefined} onClick={() => setView('saved')}><Archive /><span><strong>Saved &amp; Graded</strong><small>Results ledger</small></span><b>{commandSavedSlips.length}</b></button>
    </nav>
    {view === 'list' ? <MyListEditor onSectionChange={onSectionChange} onOpenParlay={() => setView('parlay')} /> : null}
    {view === 'parlay' ? <ActiveParlay onSaveParlay={onSaveParlay} onSectionChange={onSectionChange} /> : null}
    {view === 'saved' ? <SavedParlays slips={commandSavedSlips} /> : null}
  </main>;
}
