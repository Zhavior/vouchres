# World Chat storage (ephemeral MVP)

World Chat is **honest about durability**: there is no Redis/DB persistence yet.

## Current contract

| Property | Value |
| --- | --- |
| Storage | In-process memory (`worldChatService.ts`) |
| Multi-instance | **Not safe** — each pod has its own message list |
| Restart | All messages lost |
| API signal | `storage.mode = "in_memory_ephemeral"` on read/write responses |

## Operator guidance

- Run **one API instance** for consistent chat, **or** accept that users behind a load balancer see different message histories per instance.
- Before horizontal scaling, ship Redis or Supabase-backed chat persistence and remove the ephemeral contract.
- Production boot logs: `[boot] World chat is in-memory ephemeral...`

## Endpoints

- `GET /api/world-chat/messages` — public read (empty list when no messages; no fake seed data)
- `POST /api/world-chat/messages` — auth + rate limit required
