import React, { useMemo, useState } from 'react';
import {
  Loader,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import ProfileAvatarBorder from '../components/profile/ProfileAvatarBorder';
import { useAuth } from '../lib/useAuth';
import { useProfileStore } from '../stores/profileStore';
import { INITIAL_PROFILE } from '../data/mockData';
import {
  useDirectMessages,
  useFollowingHub,
  type FollowingHubPerson,
  type FollowingHubStory,
} from '../hooks/useFollowingHub';
import { Z8_LABEL, Z8_PAGE, Z8_PAGE_PAD_X, Z8_PAGE_PAD_Y, Z8_PANEL_PREMIUM } from '../theme/z8Tokens';

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function StoryViewer({
  person,
  onClose,
  onViewed,
}: {
  person: FollowingHubPerson;
  onClose: () => void;
  onViewed: (storyId: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const story = person.stories[index] as FollowingHubStory | undefined;

  React.useEffect(() => {
    if (story?.id) void onViewed(story.id);
  }, [story?.id, onViewed]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full border border-white/15 p-2 text-white/70 hover:text-white"
        aria-label="Close story"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        className="w-full max-w-sm aspect-[9/16] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
        style={{ background: story.background ?? '#0f172a' }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/30">
          <ProfileAvatarBorder
            avatarUrl={person.avatarUrl ?? undefined}
            displayName={person.displayName}
            initials={person.displayName.slice(0, 2).toUpperCase()}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{person.displayName}</p>
            <p className="text-[11px] text-white/45">{timeAgo(story.created_at)}</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 text-center">
          {story.kind === 'image' && story.media_url ? (
            <img src={story.media_url} alt="" className="max-h-full max-w-full object-contain rounded-xl" />
          ) : (
            <p className="text-xl font-semibold leading-snug text-white whitespace-pre-wrap">{story.body}</p>
          )}
        </div>

        {person.stories.length > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-black/30">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
              className="text-xs font-bold text-white/60 disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-[11px] text-white/45">{index + 1} / {person.stories.length}</span>
            <button
              type="button"
              disabled={index >= person.stories.length - 1}
              onClick={() => setIndex((value) => Math.min(person.stories.length - 1, value + 1))}
              className="text-xs font-bold text-vouch-cyan disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FollowingHubPage() {
  const { user } = useAuth();
  const profile = useProfileStore((state) => state.profile) ?? INITIAL_PROFILE;
  const [activeTab, setActiveTab] = useState<'circle' | 'messages'>('circle');
  const [storyPerson, setStoryPerson] = useState<FollowingHubPerson | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteEmoji, setNoteEmoji] = useState('✨');
  const [storyDraft, setStoryDraft] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [showNoteComposer, setShowNoteComposer] = useState(false);
  const [showStoryComposer, setShowStoryComposer] = useState(false);

  const hub = useFollowingHub(Boolean(user));
  const dm = useDirectMessages(Boolean(user) && activeTab === 'messages');

  const followingOnly = useMemo(
    () => hub.people.filter((person) => !person.isSelf),
    [hub.people],
  );

  if (!user) {
    return (
      <div className={`${Z8_PAGE} ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}>
        <div className={`${Z8_PANEL_PREMIUM} p-8 text-center`}>
          <Users className="w-8 h-8 text-white/45 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-white">Following</h1>
          <p className="mt-2 text-sm text-white/45">Sign in to see stories, status notes, and messages from people you follow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${Z8_PAGE} ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} space-y-4`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className={Z8_LABEL}>Social</p>
          <h1 className="text-2xl font-black text-white tracking-tight">Following</h1>
          <p className="mt-1 text-sm text-white/45">Stories, status notes, and DMs from your circle.</p>
        </div>
        <div className="flex rounded-full border border-white/10 bg-black/30 p-1">
          {(['circle', 'messages'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === tab ? 'bg-vouch-emerald/15 text-vouch-emerald' : 'text-white/45 hover:text-white/75'
              }`}
            >
              {tab === 'circle' ? 'Circle' : 'Messages'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'circle' ? (
        <>
          <section className={`${Z8_PANEL_PREMIUM} p-4 space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Stories</h2>
                <p className="text-xs text-white/45">24-hour updates from people you follow.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStoryComposer(true)}
                className="inline-flex items-center gap-1 rounded-full border border-vouch-cyan/30 px-3 py-1.5 text-xs font-bold text-vouch-cyan"
              >
                <Plus className="w-3.5 h-3.5" />
                Add story
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {hub.people.map((person) => {
                const hasStories = person.stories.length > 0;
                const ringClass = person.isSelf
                  ? 'ring-vouch-cyan/60'
                  : person.hasUnseenStories
                    ? 'ring-vouch-emerald'
                    : hasStories
                      ? 'ring-white/20'
                      : 'ring-white/10';

                return (
                  <button
                    key={person.userId}
                    type="button"
                    onClick={() => {
                      if (person.isSelf) {
                        setShowStoryComposer(true);
                        return;
                      }
                      if (hasStories) setStoryPerson(person);
                    }}
                    className="shrink-0 flex flex-col items-center gap-2 w-[72px]"
                  >
                    <div className={`rounded-full p-[2px] ring-2 ${ringClass}`}>
                      <ProfileAvatarBorder
                        avatarUrl={person.avatarUrl ?? undefined}
                        displayName={person.displayName}
                        initials={person.displayName.slice(0, 2).toUpperCase()}
                        size="md"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-white/70 truncate w-full text-center">
                      {person.isSelf ? 'You' : person.displayName.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={`${Z8_PANEL_PREMIUM} p-4 space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Notes</h2>
                <p className="text-xs text-white/45">MSN / Discord-style status from your circle.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNoteComposer(true)}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/70 hover:text-white"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Set note
              </button>
            </div>

            {hub.notes.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {hub.notes.map((note) => (
                  <div
                    key={note.userId}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4 flex gap-3"
                  >
                    <ProfileAvatarBorder
                      avatarUrl={note.avatarUrl ?? undefined}
                      displayName={note.displayName}
                      initials={note.displayName.slice(0, 2).toUpperCase()}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white truncate">{note.displayName}</p>
                        {note.emoji && <span>{note.emoji}</span>}
                      </div>
                      <p className="mt-1 text-sm text-white/75 leading-snug">{note.body}</p>
                      <p className="mt-2 text-[11px] text-white/35">
                        {note.updatedAt ? timeAgo(note.updatedAt) : 'Active now'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/45">No active notes yet. Set yours or follow creators to see theirs here.</p>
            )}
          </section>

          <section className={`${Z8_PANEL_PREMIUM} p-4 space-y-3`}>
            <h2 className="text-sm font-bold text-white">Your circle</h2>
            {hub.loading ? (
              <div className="flex items-center gap-2 text-sm text-white/45 py-6">
                <Loader className="w-4 h-4 animate-spin" />
                Loading following…
              </div>
            ) : followingOnly.length === 0 ? (
              <p className="text-sm text-white/45">Follow creators from the Home feed to populate your circle.</p>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {followingOnly.map((person) => (
                  <div key={person.userId} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProfileAvatarBorder
                        avatarUrl={person.avatarUrl ?? undefined}
                        displayName={person.displayName}
                        initials={person.displayName.slice(0, 2).toUpperCase()}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{person.displayName}</p>
                        <p className="text-xs text-white/45 truncate">@{person.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void dm.startConversation(person.userId)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/70 hover:text-vouch-cyan"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Message
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className={`${Z8_PANEL_PREMIUM} overflow-hidden`}>
          <div className="grid min-h-[520px] lg:grid-cols-[280px_1fr]">
            <div className="border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-sm font-bold text-white">Inbox</h2>
              </div>
              <div className="max-h-[460px] overflow-y-auto">
                {dm.conversations.length === 0 ? (
                  <p className="p-4 text-sm text-white/45">No conversations yet. Message someone from your circle.</p>
                ) : (
                  dm.conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => void dm.openConversation(conversation.id)}
                      className={`w-full text-left px-4 py-3 border-b border-white/[0.05] hover:bg-white/[0.03] ${
                        dm.activeConversationId === conversation.id ? 'bg-white/[0.04]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ProfileAvatarBorder
                          avatarUrl={conversation.avatarUrl ?? undefined}
                          displayName={conversation.displayName}
                          initials={conversation.displayName.slice(0, 2).toUpperCase()}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-white truncate">{conversation.displayName}</p>
                            {conversation.unread && <span className="h-2 w-2 rounded-full bg-vouch-emerald" />}
                          </div>
                          <p className="text-xs text-white/45 truncate">
                            {conversation.lastMessage ? String(conversation.lastMessage.body) : 'Start chatting'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col min-h-[520px]">
              {dm.activeConversationId ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {dm.messages.map((message) => {
                      const isMine = message.sender_id === user.id;
                      return (
                        <div
                          key={message.id}
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            isMine
                              ? 'ml-auto bg-vouch-cyan/15 border border-vouch-cyan/20 text-white'
                              : 'mr-auto bg-black/30 border border-white/10 text-white/85'
                          }`}
                        >
                          <p>{message.body}</p>
                          <p className="mt-1 text-[10px] text-white/35">{timeAgo(message.created_at)}</p>
                        </div>
                      );
                    })}
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!messageDraft.trim()) return;
                      void dm.sendMessage(messageDraft.trim()).then(() => setMessageDraft(''));
                    }}
                    className="border-t border-white/10 p-4 flex gap-2"
                  >
                    <input
                      value={messageDraft}
                      onChange={(event) => setMessageDraft(event.target.value)}
                      placeholder="Write a message…"
                      className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-vouch-cyan/40"
                    />
                    <button
                      type="submit"
                      className="rounded-2xl bg-vouch-cyan px-3 py-2 text-obsidian-900"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-white/45">
                  Select a conversation or message someone from your circle.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {showNoteComposer && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void hub.publishNote(noteDraft, noteEmoji).then(() => {
                setShowNoteComposer(false);
                setNoteDraft('');
              });
            }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Set your note</h3>
              <button type="button" onClick={() => setShowNoteComposer(false)} className="text-white/45 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              value={noteEmoji}
              onChange={(event) => setNoteEmoji(event.target.value.slice(0, 2))}
              className="w-16 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-lg"
              aria-label="Note emoji"
            />
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value.slice(0, 120))}
              rows={3}
              placeholder="What's on your mind?"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-vouch-cyan/40"
            />
            <div className="flex justify-between gap-2">
              {hub.notes.some((note) => note.isSelf) && (
                <button
                  type="button"
                  onClick={() => void hub.clearNote().then(() => setShowNoteComposer(false))}
                  className="text-xs font-bold text-rose-300"
                >
                  Clear note
                </button>
              )}
              <button type="submit" className="ml-auto rounded-full bg-vouch-emerald px-4 py-2 text-xs font-bold text-obsidian-900">
                Share note
              </button>
            </div>
          </form>
        </div>
      )}

      {showStoryComposer && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void hub.publishStory({ body: storyDraft, background: '#0f172a' }).then(() => {
                setShowStoryComposer(false);
                setStoryDraft('');
              });
            }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Add a story</h3>
              <button type="button" onClick={() => setShowStoryComposer(false)} className="text-white/45 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={storyDraft}
              onChange={(event) => setStoryDraft(event.target.value.slice(0, 280))}
              rows={5}
              placeholder="Share a quick update with your followers…"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-vouch-cyan/40"
            />
            <button type="submit" className="rounded-full bg-vouch-cyan px-4 py-2 text-xs font-bold text-obsidian-900">
              Post story
            </button>
          </form>
        </div>
      )}

      {storyPerson && (
        <StoryViewer
          person={storyPerson}
          onClose={() => setStoryPerson(null)}
          onViewed={(storyId) => void hub.markStoryViewed(storyId)}
        />
      )}

      {hub.error && (
        <p className="text-sm text-rose-300">{hub.error}</p>
      )}
    </div>
  );
}
