import re

path = 'src/components/parlay/os/ParlayOsLayer.tsx'
with open(path, 'r') as f:
    content = f.read()

# First, import replaceOptimisticSlip and removeOptimisticSlip from parlayCommandStore
import_injection = """import {
  selectDraftLegs,
  selectSavedSlips,
  useParlayCommandStore,
} from "../../../stores/parlayCommandStore";"""

new_import_injection = """import {
  selectDraftLegs,
  selectSavedSlips,
  useParlayCommandStore,
} from "../../../stores/parlayCommandStore";"""

# Just grab the store hooks
store_hooks = """  const draftLegs = useParlayCommandStore(selectDraftLegs);
  const savedSlips = useParlayCommandStore(selectSavedSlips);
  const clearDraft = useParlayCommandStore((state) => state.clearDraft);
  const addOptimisticSlip = useParlayCommandStore((state) => state.addOptimisticSlip);
  const replaceOptimisticSlip = useParlayCommandStore((state) => state.replaceOptimisticSlip);
  const removeOptimisticSlip = useParlayCommandStore((state) => state.removeOptimisticSlip);"""

content = re.sub(r'  const draftLegs = useParlayCommandStore\(selectDraftLegs\);\n  const savedSlips = useParlayCommandStore\(selectSavedSlips\);\n  const clearDraft = useParlayCommandStore\(\(state\) => state.clearDraft\);\n  const addOptimisticSlip = useParlayCommandStore\(\(state\) => state.addOptimisticSlip\);', store_hooks, content)


save_parlay_logic = """  const handleSaveParlay = useCallback(async () => {
    if (draftLegs.length < 2) return;
    
    const rawSlip = {
      title: `${draftLegs.length}-Leg Parlay`,
      status: "PENDING",
      legs: draftLegs.map(leg => ({
        ...leg,
        playerName: leg.playerName ?? leg.selection,
        market: leg.marketLabel,
      })),
      odds: combinedOdds,
    };
    
    const optimisticId = addOptimisticSlip(rawSlip);
    clearDraft();
    setActiveTab('parlays');
    notify({
      kind: "success",
      title: "Saving Parlay...",
      body: "Your parlay is being saved.",
    });

    try {
      const res = await fetch('/api/v3/parlays/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawSlip),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        replaceOptimisticSlip(optimisticId, data.parlay || data.data);
        notify({
          kind: "success",
          title: "Parlay Saved!",
          body: "Successfully synced to Supabase.",
        });
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err) {
      removeOptimisticSlip(optimisticId);
      notify({
        kind: "error",
        title: "Failed to Save",
        body: err instanceof Error ? err.message : "Supabase sync failed.",
      });
    }
  }, [draftLegs, combinedOdds, addOptimisticSlip, replaceOptimisticSlip, removeOptimisticSlip, clearDraft]);"""

content = re.sub(r'  const handleSaveParlay = useCallback\(\(\) => \{[\s\S]*?body: "Your parlay has been saved to My Parlays\.",\s*\}\);\s*\}, \[.*?\]\);', save_parlay_logic, content)

with open(path, 'w') as f:
    f.write(content)
