import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Activity,
  Bell,
  Crown,
  FlaskConical,
  Flame,
  GripVertical,
  Pencil,
  Radio,
  RotateCcw,
  ScrollText,
  Shield,
  Sparkles,
  Trophy,
  UserCircle,
} from "lucide-react";
import { HrBrandIcon } from "../../features/hr/components/HrBrandIcon";

type Widget = {
  id: string;
  title: string;
  subtitle: string;
  section: string;
  tag: string;
  icon: typeof Flame;
};

type IslandWidgetGridProps = {
  onSectionChange?: (section: string) => void;
};

const STORAGE_KEY = "vouchres.edgeIsland.layout.v1";

const DEFAULT_WIDGETS: Widget[] = [
  {
    id: "daily-edge-board",
    title: "HR Board",
    subtitle: "HR board, high-value edges, daily research cards",
    section: "hr_board",
    tag: "HR",
    icon: Flame,
  },
  {
    id: "daily-players",
    title: "Daily Players",
    subtitle: "Player cards, props, matchup signals",
    section: "daily_players",
    tag: "Players",
    icon: UserCircle,
  },
  {
    id: "live-projections",
    title: "Live Projections",
    subtitle: "Live game movement and projection checks",
    section: "live_games",
    tag: "Live",
    icon: Radio,
  },
  {
    id: "parlay-dock",
    title: "Parlay Dock",
    subtitle: "Build, save, scan, and track parlays",
    section: "parlays",
    tag: "Parlays",
    icon: Shield,
  },
  {
    id: "saved-parlays",
    title: "Saved Parlays",
    subtitle: "Your slips, locks, and live tracking",
    section: "my_parlays",
    tag: "Saved",
    icon: ScrollText,
  },
  {
    id: "research-lab",
    title: "Research Lab",
    subtitle: "Player, pitcher, team, and matchup research",
    section: "research",
    tag: "Research",
    icon: FlaskConical,
  },
  {
    id: "ledger-vault",
    title: "Ledger Vault",
    subtitle: "Wins, losses, ROI, grading, and proof",
    section: "results",
    tag: "Ledger",
    icon: Trophy,
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    subtitle: "Rankings, trust score, and capper proof",
    section: "leaderboard",
    tag: "Social",
    icon: Activity,
  },
  {
    id: "notification-beacon",
    title: "Notification Beacon",
    subtitle: "HR alerts, slip alerts, and live updates",
    section: "notifications",
    tag: "Alerts",
    icon: Bell,
  },
  {
    id: "pro-tower",
    title: "Pro Tower",
    subtitle: "Premium tools, upgrades, and pro research",
    section: "premium",
    tag: "Pro",
    icon: Crown,
  },
];

function getSavedOrder() {
  if (typeof window === "undefined") return DEFAULT_WIDGETS.map((w) => w.id);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS.map((w) => w.id);

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_WIDGETS.map((w) => w.id);

    const validIds = new Set(DEFAULT_WIDGETS.map((w) => w.id));
    const cleaned = parsed.filter((id) => typeof id === "string" && validIds.has(id));
    const missing = DEFAULT_WIDGETS.map((w) => w.id).filter((id) => !cleaned.includes(id));

    return [...cleaned, ...missing];
  } catch {
    return DEFAULT_WIDGETS.map((w) => w.id);
  }
}

function SortableWidget({
  widget,
  editMode,
  onOpen,
}: {
  widget: Widget;
  editMode: boolean;
  onOpen: (section: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const Icon = widget.icon;
  const isHrBoard = widget.section === 'hr_board';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "relative rounded-2xl border border-white/10 bg-slate-950/60 p-3.5 text-left shadow-xl shadow-black/20 transition sm:rounded-3xl sm:p-4",
        isDragging ? "z-50 scale-[1.02] border-cyan-300/70 bg-cyan-300/10 shadow-cyan-950/40" : "",
        !isDragging && !editMode ? "hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/10" : "",
        editMode && !isDragging ? "border-cyan-300/25 bg-cyan-300/[0.06]" : "",
      ].join(" ")}
    >
      {editMode && (
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <span className="hidden rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-cyan-100 sm:inline-flex">
            Move
          </span>
          <button
            type="button"
            aria-label={`Move ${widget.title}`}
            title={`Move ${widget.title}`}
            className="grid h-10 w-10 touch-none cursor-grab place-items-center rounded-2xl border border-white/10 bg-white/10 text-slate-100 shadow-lg shadow-black/20 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => !editMode && onOpen(widget.section)}
        aria-disabled={editMode}
        className={`w-full text-left ${editMode ? "cursor-default" : ""}`}
      >
        <div className="mb-3 flex items-center justify-between gap-3 pr-12 sm:mb-4">
          {isHrBoard ? (
            <HrBrandIcon size="sm" />
          ) : (
            <div className="rounded-2xl bg-cyan-300/10 p-2.5 text-cyan-200 sm:p-3">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
            {widget.tag}
          </span>
        </div>

        <h3 className="text-sm font-black text-white sm:text-base">{widget.title}</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-400 sm:text-sm">{widget.subtitle}</p>

        {!editMode && (
          <div className="mt-4 text-xs font-black uppercase tracking-wide text-amber-200">
            Open →
          </div>
        )}

        {editMode && (
          <div className="mt-4 text-[11px] font-black uppercase tracking-wide text-cyan-100">
            Hold the handle to move
          </div>
        )}
      </button>
    </div>
  );
}

export default function IslandWidgetGrid({ onSectionChange }: IslandWidgetGridProps) {
  const [editMode, setEditMode] = useState(false);
  const [order, setOrder] = useState<string[]>(() => getSavedOrder());

  const widgetMap = useMemo(() => {
    return new Map(DEFAULT_WIDGETS.map((widget) => [widget.id, widget]));
  }, []);

  const widgets = order
    .map((id) => widgetMap.get(id))
    .filter(Boolean) as Widget[];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  }, [order]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setOrder((items) => {
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));

      if (oldIndex === -1 || newIndex === -1) return items;

      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const resetLayout = () => {
    setOrder(DEFAULT_WIDGETS.map((widget) => widget.id));
  };

  const openSection = (section: string) => {
    onSectionChange?.(section);
  };

  return (
    <section className="mt-4 rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-3.5 backdrop-blur sm:mt-5 sm:rounded-[2rem] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Custom Island
          </div>
          <h2 className="text-lg font-black text-white sm:text-xl">Move Your Widgets</h2>
          <p className="text-xs font-semibold leading-5 text-slate-400 sm:text-sm">
            Put your most-used tools first. Layout saves on this device.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => setEditMode((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-300/20"
          >
            <Pencil className="h-3.5 w-3.5" />
            {editMode ? "Done" : "Edit Island"}
          </button>

          {editMode && (
            <button
              type="button"
              onClick={resetLayout}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-200 transition hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {editMode && (
        <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold leading-5 text-cyan-50">
          Edit mode is on. Use the handle on each widget to drag. Tap Done when your island feels right.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                editMode={editMode}
                onOpen={openSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
