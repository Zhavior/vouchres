# vouchedge — agent operating rules

Token discipline is a hard requirement. Global prefs in `~/.claude/CLAUDE.md` also apply.

## Output

- Terse by default. No preamble, no restating the task, no summary unless asked.
- Report final outcomes only — do not narrate intermediate steps.
- Never paste full file contents or long command output into chat. Use `path:line` refs.
- No encouragement, no unsolicited next-step lists.

## Reading

- Grep/glob with a narrow scope before opening any file. Read the matched range, not the whole file.
- Never re-read a file already read this session unless it changed on disk.
- For broad or unfamiliar-area search, delegate to an Explore agent so the file dumps stay out of the main context.

## Editing

- Targeted diffs only. Never rewrite a whole file to change part of it.
- Touch only files relevant to the task.

## Terminal

- Batch related commands into one call (`&&` / `;`), not one call per command.
- Prefer `rtk`-proxied forms for noisy commands — `rtk git`, `rtk diff`, `rtk test`, `rtk tsc`, `rtk grep`, `rtk read`, `rtk ls`, `rtk find`. See `~/.claude/RTK.md`.
- Pipe through `head`/`tail` when only a slice matters.

## Project

- Dev server: `npm run dev` (port 3000, custom `server.ts`). Do not start it with a raw shell call — use the preview tooling.
- Type check: `rtk tsc` — grouped errors instead of the full compiler dump.
