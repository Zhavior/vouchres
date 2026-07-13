import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';
import ConversationList from './ConversationList';
import DirectMessageThread from './DirectMessageThread';
import { useStartConversation } from '../../hooks/queries/useMessaging';
import type { ConversationSummary } from '../../lib/messagingTypes';
import { Z8_LABEL, Z8_PAGE, Z8_PAGE_GAP, Z8_PAGE_PAD_X, Z8_PAGE_PAD_Y, Z8_PANEL_PREMIUM } from '../../theme/z8Tokens';

interface Props {
  /** Set when arriving from a "Message" action on someone's profile; resolved into a conversation on mount. */
  pendingRecipientUserId?: string | null;
}

export default function MessagesPage({ pendingRecipientUserId = null }: Props) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<ConversationSummary | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const startConversation = useStartConversation();
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingRecipientUserId || !user || startedFor.current === pendingRecipientUserId) return;
    startedFor.current = pendingRecipientUserId;
    startConversation.mutate(pendingRecipientUserId, {
      onSuccess: (data) => {
        setSelected(data.conversation);
        setMobileShowThread(true);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRecipientUserId, user]);

  if (!user) {
    return (
      <main className={`${Z8_PAGE} min-h-0 bg-ve-obsidian text-ve-flash ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}>
        <div className="mx-auto max-w-md py-16 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-white/25" />
          <p className="mt-3 text-sm text-white/50">Sign in to view your messages.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${Z8_PAGE} min-h-0 bg-ve-obsidian text-ve-flash ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y}`}>
      <div className={`mx-auto flex max-w-[1120px] flex-col ${Z8_PAGE_GAP}`}>
        <header>
          <p className={`${Z8_LABEL} text-vouch-cyan`}>Direct Messages</p>
          <h1 className="mt-1 text-2xl font-black text-white">Messages</h1>
        </header>

        <section className={`${Z8_PANEL_PREMIUM} grid min-h-[70vh] overflow-hidden rounded-2xl md:grid-cols-[300px_1fr]`}>
          <div className={`min-h-0 overflow-y-auto border-white/10 ${mobileShowThread ? 'hidden md:block' : ''} md:border-r`}>
            <ConversationList
              activeConversationId={selected?.id ?? null}
              onSelect={(conversation) => {
                setSelected(conversation);
                setMobileShowThread(true);
              }}
            />
          </div>
          <div className={`min-h-0 ${mobileShowThread ? '' : 'hidden md:flex'} md:flex`}>
            {selected ? (
              <DirectMessageThread
                conversation={selected}
                currentUserId={user.id}
                onBack={() => setMobileShowThread(false)}
              />
            ) : (
              <div className="hidden w-full items-center justify-center text-center md:flex">
                <div>
                  <MessageCircle className="mx-auto h-8 w-8 text-white/20" />
                  <p className="mt-3 text-sm text-white/40">
                    {startConversation.isPending ? 'Opening conversation…' : 'Select a conversation to start reading.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
