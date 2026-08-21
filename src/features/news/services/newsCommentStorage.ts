export interface NewsComment {
  id: string;
  articleId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  userRole?: string;
  verified?: boolean;
  content: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  parentId?: string | null;
  replies?: NewsComment[];
}

const STORAGE_KEY = 'vouchedge_news_comments_v1';

// Seed realistic analyst discussions for rich ESPN-level feel
const INITIAL_COMMENTS: Record<string, NewsComment[]> = {
  '1': [
    {
      id: 'c-seed-1',
      articleId: '1',
      userId: 'user-pro-1',
      username: 'statcast_quant',
      displayName: 'Marcus Vance',
      userRole: 'PRO_ANALYST',
      verified: true,
      content: 'The air density vector calculations here match what we saw at Wrigley yesterday. When wind hits 14+ mph out to right, barrel rates over 12% have an 88% HR conversion rate.',
      createdAt: new Date(Date.now() - 42 * 60000).toISOString(),
      likes: 19,
      likedByMe: true,
      replies: [
        {
          id: 'c-seed-1-1',
          articleId: '1',
          userId: 'user-pro-2',
          username: 'boydsantos',
          displayName: 'Boyd R. Santos',
          userRole: 'ARCHITECT',
          verified: true,
          content: 'Exactly Marcus. That is why our HRPI engine updates meteorological vectors 30 minutes before first pitch rather than relying on morning forecast models.',
          createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
          likes: 12,
          likedByMe: true,
          parentId: 'c-seed-1',
        },
      ],
    },
    {
      id: 'c-seed-2',
      articleId: '1',
      userId: 'user-pro-3',
      username: 'diamond_edge',
      displayName: 'Elena Rostova',
      userRole: 'QUANT',
      verified: true,
      content: 'Bookmakers still heavily overprice 3-game home run streaks while underpricing rolling 14-day barrel/PA gains. Massive structural edge here.',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      likes: 8,
      likedByMe: false,
    },
  ],
};

export function getStoredComments(): Record<string, NewsComment[]> {
  if (typeof window === 'undefined') return INITIAL_COMMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMMENTS));
      return INITIAL_COMMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_COMMENTS;
  }
}

export function getCommentsForArticle(articleId: string): NewsComment[] {
  const store = getStoredComments();
  return store[articleId] ?? [];
}

export function addCommentToArticle(
  articleId: string,
  comment: Omit<NewsComment, 'id' | 'createdAt' | 'likes' | 'replies'>
): NewsComment {
  const store = getStoredComments();
  const list = store[articleId] ? [...store[articleId]] : [];

  const newComment: NewsComment = {
    ...comment,
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedByMe: false,
    replies: [],
  };

  if (comment.parentId) {
    const parent = list.find((c) => c.id === comment.parentId);
    if (parent) {
      parent.replies = parent.replies ? [...parent.replies, newComment] : [newComment];
    } else {
      list.push(newComment);
    }
  } else {
    list.unshift(newComment);
  }

  store[articleId] = list;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}

  return newComment;
}

export function toggleCommentLike(articleId: string, commentId: string): boolean {
  const store = getStoredComments();
  const list = store[articleId] ?? [];
  let nextState = false;

  function updateInList(items: NewsComment[]): boolean {
    for (const item of items) {
      if (item.id === commentId) {
        item.likedByMe = !item.likedByMe;
        item.likes += item.likedByMe ? 1 : -1;
        nextState = item.likedByMe;
        return true;
      }
      if (item.replies && updateInList(item.replies)) {
        return true;
      }
    }
    return false;
  }

  updateInList(list);
  store[articleId] = list;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}

  return nextState;
}

export function countArticleComments(articleId: string): number {
  const list = getCommentsForArticle(articleId);
  let total = 0;
  function countRecursive(items: NewsComment[]) {
    for (const it of items) {
      total += 1;
      if (it.replies && it.replies.length > 0) countRecursive(it.replies);
    }
  }
  countRecursive(list);
  return total;
}
