import { ArrowRight, Search } from "lucide-react";

export default function ActionRail() {
  return (
    <div className="mt-6 flex gap-3">
      <button className="flex-1 rounded-xl bg-ve-ion px-4 py-3 font-semibold transition hover:brightness-110">
        Research
      </button>

      <button className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 transition hover:border-ve-ion/40">
        <Search className="h-4 w-4" />
        Compare
      </button>

      <button className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 transition hover:border-ve-ion/40">
        Add
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
