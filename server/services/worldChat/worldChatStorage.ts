/** World Chat storage contract — honest about ephemeral in-memory MVP. */

export type WorldChatStorageMeta = {
  mode: "in_memory_ephemeral";
  multiInstanceSafe: false;
  persistence: "none";
  note: string;
};

export function worldChatStorageMeta(): WorldChatStorageMeta {
  return {
    mode: "in_memory_ephemeral",
    multiInstanceSafe: false,
    persistence: "none",
    note:
      "Messages are stored in process memory only. They reset on restart and are not shared across instances. " +
      "Do not treat world chat as durable until a Redis/DB backend ships.",
  };
}

export function logWorldChatEphemeralBootNotice(): void {
  if (process.env.NODE_ENV !== "production") return;
  console.log(
    "[boot] World chat is in-memory ephemeral (single-instance). See docs/WORLD_CHAT.md before scaling horizontally.",
  );
}
