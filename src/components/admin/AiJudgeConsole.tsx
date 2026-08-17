import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Send,
} from 'lucide-react';
import type { ApiError } from '../../lib/apiClient';
import {
  AURORA_LABEL,
  AURORA_PANEL_PREMIUM,
  AURORA_SECTION_HEADER,
} from '../../theme/auroraTokens';
import {
  useAiJudgeSocialDrafts,
  useAiJudgeSocialJudges,
  useGenerateHrSocialDrafts,
  useMockPostSocialDraft,
  useQueueSocialDraft,
  type AiJudge,
  type AiJudgeCandidate,
  type GenerateHrDraftsResponse,
  type SocialDraft,
} from '../../hooks/queries/useAiJudgeSocial';

/**
 * Operator console for the AI-judge social pipeline.
 *
 * Truth rules for this file: every rendered value comes from the API response.
 * Anything the server omitted renders as ABSENT — never a substituted number,
 * name, percentage, or sentence.
 */

const PANEL = `rounded-lg ${AURORA_PANEL_PREMIUM}`;
const INPUT =
  'w-full rounded-md border border-white/10 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400';
const BUTTON =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45';
const PRIMARY_BUTTON = `${BUTTON} border-emerald-400/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30`;

const ABSENT = '----';

type DraftAction = 'queue' | 'mock_post';
type ActionPhase = 'pending' | 'success' | 'error';

interface ActionState {
  action: DraftAction;
  phase: ActionPhase;
  message: string;
}

function errorMessage(error: unknown) {
  const apiError = error as ApiError | undefined;
  return apiError?.message || apiError?.error || 'The request could not be completed.';
}

/** Renders a string only when the server actually returned one. */
function text(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return ABSENT;
}

function count(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : ABSENT;
}

function timestamp(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) return ABSENT;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

/** Mirrors the server's own formatting: <= 1 is a fraction, otherwise a percent. */
function hrProbability(candidate: AiJudgeCandidate): string {
  const raw = Number(candidate.estimatedHrProbability);
  if (!Number.isFinite(raw)) return ABSENT;
  return raw <= 1 ? `${(raw * 100).toFixed(1)}%` : `${raw.toFixed(1)}%`;
}

function candidateOpponent(candidate: AiJudgeCandidate): string {
  return text(candidate.opponent ?? candidate.opponentTeam);
}

function candidateName(candidate: AiJudgeCandidate): string {
  return text(candidate.playerName ?? candidate.name);
}

function PanelTitle({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <div
      className={`${AURORA_SECTION_HEADER} flex items-center justify-between gap-4 border-b border-white/5 px-4 py-4 sm:px-5`}
    >
      <h2 className={`${AURORA_LABEL} text-white`}>{children}</h2>
      {action}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className={`${AURORA_LABEL} text-white/45`}>{label}</p>
      <p className="mt-1 truncate font-mono text-xs text-white/75">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'mock_posted'
      ? 'border-emerald-300/35 bg-emerald-400/10 text-emerald-100'
      : status === 'queued'
        ? 'border-sky-300/35 bg-sky-400/10 text-sky-100'
        : status === 'failed'
          ? 'border-rose-300/35 bg-rose-400/10 text-rose-100'
          : 'border-white/12 bg-white/[0.04] text-white/70';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${tone}`}
    >
      {status}
    </span>
  );
}

function JudgeCard({ judge }: { judge: AiJudge }) {
  return (
    <li className="flex min-h-[132px] gap-3 rounded-md border border-white/8 bg-white/[0.03] p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/40 font-mono text-[11px] font-bold text-emerald-100">
        {text(judge.icon)}
      </span>
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-semibold text-white">{text(judge.name)}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/40">{text(judge.id)}</p>
        <p className="text-xs text-white/65">{text(judge.personality)}</p>
        <p className="text-xs text-white/45">{text(judge.strategy)}</p>
      </div>
    </li>
  );
}

function PicksTable({ picks }: { picks: AiJudgeCandidate[] }) {
  if (picks.length === 0) {
    return (
      <p className="px-4 py-4 text-xs text-white/45 sm:px-5">
        This draft returned no picks.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm text-white/70">
        <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase text-white/45">
          <tr>
            <th className="px-4 py-2.5 font-medium">Player</th>
            <th className="px-4 py-2.5 font-medium">Team</th>
            <th className="px-4 py-2.5 font-medium">Opponent</th>
            <th className="px-4 py-2.5 font-medium">HR score</th>
            <th className="px-4 py-2.5 font-medium">Est. HR</th>
            <th className="px-4 py-2.5 font-medium">Risk tier</th>
            <th className="px-4 py-2.5 font-medium">Lineup</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {picks.map((pick, index) => (
            <tr key={`${text(pick.playerId)}-${index}`}>
              <td className="px-4 py-2.5 text-white">{candidateName(pick)}</td>
              <td className="px-4 py-2.5">{text(pick.team)}</td>
              <td className="px-4 py-2.5">{candidateOpponent(pick)}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{count(pick.hrScore)}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{hrProbability(pick)}</td>
              <td className="px-4 py-2.5 text-xs">{text(pick.riskTier)}</td>
              <td className="px-4 py-2.5 text-xs">{text(pick.lineupStatus ?? pick.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DraftCard({
  draft,
  actionState,
  onQueue,
  onMockPost,
}: {
  draft: SocialDraft;
  actionState?: ActionState;
  onQueue: () => void;
  onMockPost: () => void;
}) {
  const picks = Array.isArray(draft.picks) ? draft.picks : [];
  const busy = actionState?.phase === 'pending';

  return (
    <section className={`${PANEL} overflow-hidden`}>
      <PanelTitle
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={text(draft.status)} />
            <span className="font-mono text-[10px] text-white/35">{text(draft.platform)}</span>
          </div>
        }
      >
        {text(draft.judgeName)}
      </PanelTitle>

      <div className="grid grid-cols-2 gap-3 border-b border-white/5 px-4 py-3 sm:grid-cols-3 sm:px-5 lg:grid-cols-6">
        <Field label="Judge id" value={text(draft.judgeId)} />
        <Field label="Post type" value={text(draft.postType)} />
        <Field label="Board date" value={text(draft.date)} />
        <Field label="Scheduled for" value={text(draft.scheduledFor)} />
        <Field label="Mock post id" value={text(draft.mockPostId)} />
        <Field label="Updated" value={timestamp(draft.updatedAt)} />
      </div>

      <div className="border-b border-white/5 px-4 py-3 sm:px-5">
        <p className={`${AURORA_LABEL} text-white/45`}>Draft content</p>
        {typeof draft.content === 'string' && draft.content.length > 0 ? (
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-white/8 bg-black/35 p-3 font-mono text-xs leading-relaxed text-white/75">
            {draft.content}
          </pre>
        ) : (
          <p className="mt-2 rounded-md border border-white/8 bg-black/35 p-3 text-xs text-white/45">
            The server returned no content for this draft.
          </p>
        )}
      </div>

      <div className="border-b border-white/5">
        <p className={`${AURORA_LABEL} px-4 pt-3 text-white/45 sm:px-5`}>Picks ({picks.length})</p>
        <div className="mt-2">
          <PicksTable picks={picks} />
        </div>
      </div>

      <div className="flex min-h-[64px] flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
        <button type="button" className={BUTTON} onClick={onQueue} disabled={busy}>
          {busy && actionState?.action === 'queue' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          Queue draft
        </button>
        <button type="button" className={PRIMARY_BUTTON} onClick={onMockPost} disabled={busy}>
          {busy && actionState?.action === 'mock_post' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Mock post
        </button>

        <div className="min-w-0 flex-1 text-xs">
          {actionState?.phase === 'pending' ? (
            <p className="text-white/55">Request in flight...</p>
          ) : null}
          {actionState?.phase === 'success' ? (
            <p className="flex items-start gap-2 text-emerald-200">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {actionState.message}
            </p>
          ) : null}
          {actionState?.phase === 'error' ? (
            <p className="flex items-start gap-2 text-rose-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {actionState.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function AiJudgeConsole() {
  const judgesQuery = useAiJudgeSocialJudges();
  const draftsQuery = useAiJudgeSocialDrafts();
  const generateMutation = useGenerateHrSocialDrafts();
  const queueMutation = useQueueSocialDraft();
  const mockPostMutation = useMockPostSocialDraft();

  const [dateInput, setDateInput] = useState('');
  const [generateResult, setGenerateResult] = useState<GenerateHrDraftsResponse | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});

  const judges = useMemo(
    () => (Array.isArray(judgesQuery.data?.judges) ? judgesQuery.data.judges : []),
    [judgesQuery.data],
  );
  const drafts = useMemo(
    () => (Array.isArray(draftsQuery.data?.drafts) ? draftsQuery.data.drafts : []),
    [draftsQuery.data],
  );

  // Both reads are resolved before any content paints, so the console lands in
  // one piece instead of two panels popping in at different times.
  const initialLoading = judgesQuery.isPending || draftsQuery.isPending;
  const refreshing = judgesQuery.isFetching || draftsQuery.isFetching;

  const runGenerate = useCallback(async () => {
    setGenerateError(null);
    setGenerateResult(null);
    try {
      const result = await generateMutation.mutateAsync(
        dateInput.trim() ? { date: dateInput.trim() } : undefined,
      );
      setGenerateResult(result);
    } catch (error) {
      setGenerateError(errorMessage(error));
    }
  }, [dateInput, generateMutation]);

  const runDraftAction = useCallback(
    async (draftId: string, action: DraftAction) => {
      setActionStates((previous) => ({
        ...previous,
        [draftId]: { action, phase: 'pending', message: '' },
      }));

      try {
        const response =
          action === 'queue'
            ? await queueMutation.mutateAsync(draftId)
            : await mockPostMutation.mutateAsync(draftId);

        const serverMessage =
          typeof response.message === 'string' && response.message.length > 0
            ? response.message
            : typeof response.status === 'string' && response.status.length > 0
              ? `Server status: ${response.status}`
              : 'The server returned no message for this action.';

        setActionStates((previous) => ({
          ...previous,
          [draftId]: { action, phase: 'success', message: serverMessage },
        }));
      } catch (error) {
        setActionStates((previous) => ({
          ...previous,
          [draftId]: { action, phase: 'error', message: errorMessage(error) },
        }));
      }
    },
    [mockPostMutation, queueMutation],
  );

  const refreshAll = useCallback(() => {
    void judgesQuery.refetch();
    void draftsQuery.refetch();
  }, [draftsQuery, judgesQuery]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-white">AI Judge social pipeline</h2>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-100">
              Staff only
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-white/55">
            Generate, review, queue, and mock-post AI-judge social drafts. Mock posting never
            reaches X/Twitter — the server reports its own mode below.
          </p>
        </div>
        <button type="button" className={BUTTON} onClick={refreshAll} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {judgesQuery.isError ? (
        <p className="text-sm text-rose-200">Judges request failed: {errorMessage(judgesQuery.error)}</p>
      ) : null}
      {draftsQuery.isError ? (
        <p className="text-sm text-rose-200">Drafts request failed: {errorMessage(draftsQuery.error)}</p>
      ) : null}

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle
          action={
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/40">
              {initialLoading ? '' : `${text(judgesQuery.data?.status)} · ${text(judgesQuery.data?.mode)}`}
            </span>
          }
        >
          Judges
        </PanelTitle>
        <div className="min-h-[164px] p-4 sm:p-5">
          {initialLoading ? (
            <p className="flex items-center gap-2 text-sm text-white/55">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading the judge roster and draft queue...
            </p>
          ) : judges.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-white/45">
              <Bot className="h-4 w-4" /> The server returned no judges.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {judges.map((judge, index) => (
                <JudgeCard key={`${text(judge.id)}-${index}`} judge={judge} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle>Generate HR drafts</PanelTitle>
        <div className="min-h-[152px] space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="sm:max-w-xs sm:flex-1">
              <label className={`${AURORA_LABEL} block text-white/50`} htmlFor="ai-judge-console-date">
                Board date (optional)
              </label>
              <input
                id="ai-judge-console-date"
                className={`${INPUT} mt-2`}
                type="date"
                value={dateInput}
                onChange={(event) => setDateInput(event.target.value)}
              />
            </div>
            <button
              type="button"
              className={PRIMARY_BUTTON}
              onClick={() => void runGenerate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              Generate drafts
            </button>
          </div>

          <p className="text-xs text-white/40">
            Leaving the date empty lets the server pick the board date it resolves. One draft is
            created per judge.
          </p>

          <div className="min-h-[46px]">
            {generateMutation.isPending ? (
              <p className="text-sm text-white/55">Generating drafts...</p>
            ) : null}
            {generateError ? (
              <p className="flex items-start gap-2 text-sm text-rose-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {generateError}
              </p>
            ) : null}
            {generateResult && !generateError ? (
              <div className="grid grid-cols-2 gap-3 rounded-md border border-emerald-300/25 bg-emerald-400/[0.06] p-3 sm:grid-cols-5">
                <Field label="Status" value={text(generateResult.status)} />
                <Field label="Mode" value={text(generateResult.mode)} />
                <Field label="Date" value={text(generateResult.date)} />
                <Field label="Candidates" value={count(generateResult.candidateCount)} />
                <Field
                  label="Drafts created"
                  value={Array.isArray(generateResult.drafts) ? String(generateResult.drafts.length) : ABSENT}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle
          action={
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/40">
              {initialLoading ? '' : `${drafts.length} in queue`}
            </span>
          }
        >
          Draft queue
        </PanelTitle>
        <div className="min-h-[88px] p-4 sm:p-5">
          {initialLoading ? (
            <p className="flex items-center gap-2 text-sm text-white/55">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading drafts...
            </p>
          ) : drafts.length === 0 ? (
            <p className="text-sm text-white/45">
              No drafts exist yet. Drafts are held in server memory, so a backend restart clears
              them — generate a new set above.
            </p>
          ) : (
            <p className="text-xs text-white/40">
              Server mode: {text(draftsQuery.data?.mode)} · status: {text(draftsQuery.data?.status)}
            </p>
          )}
        </div>
      </section>

      {!initialLoading && drafts.length > 0
        ? drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              actionState={actionStates[draft.id]}
              onQueue={() => void runDraftAction(draft.id, 'queue')}
              onMockPost={() => void runDraftAction(draft.id, 'mock_post')}
            />
          ))
        : null}
    </div>
  );
}
