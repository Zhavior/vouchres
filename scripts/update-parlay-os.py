import re

path = 'src/components/parlay/os/ParlayOsLayer.tsx'
with open(path, 'r') as f:
    content = f.read()

# First, add `activeTab` to state in `ParlayOsLayer`
state_injection = """  const legListRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'parlays'>('editor');"""

content = re.sub(r'const legListRef = useRef<HTMLDivElement>\(null\);', state_injection, content)

# Also import selectSavedSlips and clearDraft
import_injection = """import {
  selectDraftLegs,
  selectSavedSlips,
  useParlayCommandStore,
} from "../../../stores/parlayCommandStore";"""

content = re.sub(r'import \{\s*selectDraftLegs,\s*useParlayCommandStore,\s*\} from "../../../stores/parlayCommandStore";', import_injection, content)

# Next, hook up savedSlips
saved_slips_injection = """  const draftLegs = useParlayCommandStore(selectDraftLegs);
  const savedSlips = useParlayCommandStore(selectSavedSlips);
  const clearDraft = useParlayCommandStore((state) => state.clearDraft);
  const addOptimisticSlip = useParlayCommandStore((state) => state.addOptimisticSlip);"""

content = re.sub(r'const draftLegs = useParlayCommandStore\(selectDraftLegs\);', saved_slips_injection, content)

# Now, add Tabs to the header
header_tabs = """                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[9px] text-white/42">
                    <span className="h-1.5 w-1.5 rounded-full bg-vouch-emerald/80" aria-hidden="true" />
                    Draft auto-saved on this device
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSheet}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/45 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98] hover:border-white/20 hover:text-white"
                  aria-label="Close My List"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5 bg-[#03080e]">
                <button 
                  onClick={() => setActiveTab('editor')} 
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-colors ${activeTab === 'editor' ? 'bg-emerald-300/10 text-emerald-300 border border-emerald-300/20' : 'text-white/40 hover:text-white border border-transparent'}`}
                >
                  Editor
                </button>
                <button 
                  onClick={() => setActiveTab('parlays')} 
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-colors ${activeTab === 'parlays' ? 'bg-emerald-300/10 text-emerald-300 border border-emerald-300/20' : 'text-white/40 hover:text-white border border-transparent'}`}
                >
                  My Parlays {savedSlips.length > 0 && `(${savedSlips.length})`}
                </button>
              </div>"""

content = re.sub(r'                  </div>\s*<p className="mt-0.5 flex items-center gap-1.5 text-\[9px\] text-white/42">\s*<span className="h-1.5 w-1.5 rounded-full bg-vouch-emerald/80" aria-hidden="true" />\s*Draft auto-saved on this device\s*</p>\s*</div>\s*<button\s*type="button"\s*onClick=\{closeSheet\}\s*className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/45 transition-all duration-200 ease-\[cubic-bezier\(0.16,1,0.3,1\)\] hover:scale-\[0.98\] hover:border-white/20 hover:text-white"\s*aria-label="Close My List"\s*>\s*<X className="h-4 w-4" />\s*</button>\s*</header>', header_tabs, content)

# Add "Save as Parlay" logic
save_parlay_logic = """  const handleSaveParlay = useCallback(() => {
    if (draftLegs.length < 2) return;
    
    // Convert draftLegs to slip format
    const rawSlip = {
      title: `${draftLegs.length}-Leg Parlay`,
      status: "PENDING",
      legs: draftLegs,
      odds: combinedOdds,
    };
    
    addOptimisticSlip(rawSlip);
    clearDraft();
    setActiveTab('parlays');
    notify({
      kind: "success",
      title: "Parlay Saved",
      body: "Your parlay has been saved to My Parlays.",
    });
  }, [draftLegs, combinedOdds, addOptimisticSlip, clearDraft]);

  const handleOpenHub = useCallback(() => {"""

content = re.sub(r'const handleOpenHub = useCallback\(\(\) => \{', save_parlay_logic, content)

with open(path, 'w') as f:
    f.write(content)
