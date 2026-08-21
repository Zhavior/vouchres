import re

path = 'src/components/parlay/os/ParlayOsLayer.tsx'
with open(path, 'r') as f:
    content = f.read()

replacement = """  return (
    <div className="h-full space-y-2 overflow-y-auto px-2.5 py-2.5">
      {savedSlips.map((slip) => (
        <article key={slip.publicId} className="rounded-md border border-white/10 bg-white/[0.02] p-3">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h4 className="text-[11px] font-black text-white truncate min-w-0 flex-1">{slip.title}</h4>
            <span className="shrink-0 font-mono text-[10px] text-emerald-200">{slip.oddsLabel}</span>
          </div>
          <div className="flex flex-col gap-1">
            {slip.summary && <p className="text-[9px] text-white/40 line-clamp-2 break-words">{slip.summary}</p>}
            <p className="text-[9px] text-white/30">{slip.syncedLabel}</p>
          </div>
        </article>
      ))}
    </div>
  );"""

content = re.sub(r'  return \(\n    <div className="h-full space-y-2 overflow-y-auto px-2.5 py-2.5">[\s\S]*?    </div>\n  \);', replacement, content)

with open(path, 'w') as f:
    f.write(content)
