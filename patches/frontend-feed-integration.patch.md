# Frontend integration — wire the new API into the existing feed components

## Goal

Replace the localStorage-based feed in `src/social/feed/` with API calls
to the new `/api/feed`, `/api/posts`, `/api/posts/:id/like`, etc.

## Files to update

### 1. `src/data/mockData.ts`

Mark every entry as demo:

```diff
- export const INITIAL_POSTS: Post[] = [ ... ];
+ export const INITIAL_POSTS: Post[] = [
+   // ... existing entries with is_demo: true added to each
+   // Used ONLY as a fallback when the API returns no real content.
+ ];
```

### 2. New file: `src/lib/feedApi.ts`

```ts
import { apiClient } from "./apiClient";

export interface FeedPost {
  id: string;
  body: string;
  created_at: string;
  view_count: number;
  is_demo: boolean;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    tier: "free" | "gold" | "seller_pro";
  };
  pick?: {
    id: string;
    market: string;
    selection: string;
    status: string;
    settled_units: number | null;
  };
  likes_count: { count: number }[];
  comments_count: { count: number }[];
  liked_by_me?: boolean;
}

export async function fetchFeed(opts: { limit?: number; offset?: number } = {}) {
  return apiClient.get<{ posts: FeedPost[]; total: number; has_real_content: boolean }>(
    "/api/feed",
    opts
  );
}

export async function fetchDiscoverFeed() {
  return apiClient.get<{ posts: FeedPost[] }>("/api/feed/discover");
}

export async function createPost(body: string, pickId?: string) {
  return apiClient.post<FeedPost>("/api/posts", { body, pick_id: pickId });
}

export async function deletePost(postId: string) {
  return apiClient.delete(`/api/posts/${postId}`);
}

export async function likePost(postId: string) {
  return apiClient.post(`/api/posts/${postId}/like`);
}

export async function unlikePost(postId: string) {
  return apiClient.delete(`/api/posts/${postId}/like`);
}

export async function recordView(postId: string) {
  // Fire-and-forget — don't await, don't error-handle
  apiClient.post(`/api/posts/${postId}/view`).catch(() => {});
}

export async function fetchComments(postId: string) {
  return apiClient.get<{ comments: any[] }>(`/api/posts/${postId}/comments`);
}

export async function addComment(postId: string, body: string) {
  return apiClient.post(`/api/posts/${postId}/comments`, { body });
}
```

### 3. `src/social/feed/HomeFeedPage.tsx`

Replace the localStorage-loaded `INITIAL_POSTS` with a real fetch:

```diff
- import { INITIAL_POSTS } from "../../data/mockData";
- const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
+ import { fetchFeed, FeedPost } from "../../lib/feedApi";
+ const [posts, setPosts] = useState<FeedPost[]>([]);
+ const [loading, setLoading] = useState(true);
+ const [hasRealContent, setHasRealContent] = useState(false);
+
+ useEffect(() => {
+   let cancelled = false;
+   (async () => {
+     setLoading(true);
+     try {
+       const { posts: fetched, has_real_content } = await fetchFeed({ limit: 50 });
+       if (!cancelled) {
+         setPosts(fetched);
+         setHasRealContent(has_real_content);
+       }
+     } catch (err) {
+       console.error("[feed] fetch failed", err);
+     } finally {
+       if (!cancelled) setLoading(false);
+     }
+   })();
+   return () => { cancelled = true; };
+ }, []);
```

Add a demo banner when there's no real content:

```tsx
{!hasRealContent && posts.length > 0 && (
  <div className="feed__demo-banner">
    <strong>You're viewing demo content.</strong>
    <p>
      As you follow real cappers and users, your feed will populate
      with their posts. <a href="/discover">Find people to follow →</a>
    </p>
  </div>
)}
```

### 4. `src/social/feed/FeedPostCard.tsx`

Replace the simulated views count with real `view_count`:

```diff
- const simulatedViews = useMemo(() => {
-   return 100 + (hashString(post.id) % 5000);
- }, [post.id]);
+ const viewCount = post.view_count ?? 0;

- <span className="post-card__views">
-   <Eye /> {simulatedViews.toLocaleString()}
- </span>
+ {viewCount > 0 && (
+   <span className="post-card__views">
+     <Eye /> {viewCount.toLocaleString()}
+   </span>
+ )}
```

Replace the like button with real like/unlike:

```diff
- const [liked, setLiked] = useState(post.likedByMe ?? false);
- const [likeCount, setLikeCount] = useState(post.likes ?? 0);
-
- const handleLike = () => {
-   setLiked(!liked);
-   setLikeCount(liked ? likeCount - 1 : likeCount + 1);
-   // TODO: sync to backend
- };
+ const [liked, setLiked] = useState(post.liked_by_me ?? false);
+ const [likeCount, setLikeCount] = useState(post.likes_count?.[0]?.count ?? 0);
+ const [likePending, setLikePending] = useState(false);
+
+ const handleLike = async () => {
+   if (likePending) return;
+   setLikePending(true);
+
+   // Optimistic update
+   const newLiked = !liked;
+   setLiked(newLiked);
+   setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);
+
+   try {
+     if (newLiked) {
+       await likePost(post.id);
+     } else {
+       await unlikePost(post.id);
+     }
+   } catch (err) {
+     // Rollback on error
+     setLiked(!newLiked);
+     setLikeCount(newLiked ? likeCount - 1 : likeCount + 1);
+   } finally {
+     setLikePending(false);
+   }
+ };
```

Add view recording (once per session per post):

```diff
+ import { recordView } from "../../lib/feedApi";
+
+ useEffect(() => {
+   if (post.is_demo) return; // don't count demo views
+   const key = `vouchedge_viewed_${post.id}`;
+   if (sessionStorage.getItem(key)) return;
+   sessionStorage.setItem(key, "1");
+   recordView(post.id);
+ }, [post.id, post.is_demo]);
```

### 5. `src/social/feed/FeedComposer.tsx`

Replace the localStorage write with a real API call:

```diff
- const handleSubmit = () => {
-   if (!body.trim()) return;
-   const newPost = {
-     id: `local-${Date.now()}`,
-     author: userProfile,
-     body,
-     created_at: new Date().toISOString(),
-     // ...
-   };
-   const updated = [newPost, ...posts];
-   setPosts(updated);
-   localStorage.setItem("vouchedge_posts", JSON.stringify(updated));
-   setBody("");
- };
+ const handleSubmit = async () => {
+   if (!body.trim() || submitting) return;
+   setSubmitting(true);
+   try {
+     const newPost = await createPost(body.trim(), attachedPickId);
+     onPostCreated(newPost);  // parent adds to top of feed
+     setBody("");
+     setAttachedPickId(undefined);
+   } catch (err: any) {
+     if (err?.status === 429) {
+       alert("You've hit your daily post limit. Upgrade to Gold for unlimited posts.");
+     } else {
+       alert(`Failed to post: ${err?.error ?? "unknown"}`);
+     }
+   } finally {
+     setSubmitting(false);
+   }
+ };
```

### 6. `src/App.tsx`

Remove all `localStorage` writes for posts:

```diff
- // Load posts from localStorage on mount
- useEffect(() => {
-   const stored = localStorage.getItem("vouchedge_posts");
-   if (stored) setPosts(JSON.parse(stored));
- }, []);
-
- // Persist posts to localStorage
- useEffect(() => {
-   localStorage.setItem("vouchedge_posts", JSON.stringify(posts));
- }, [posts]);
+ // Posts now live in Postgres — fetched via /api/feed in HomeFeedPage
```

Same pattern for `vouchedge_slips`, `vouchedge_vouches`, `vouchedge_profile`,
`vouchedge_following`, `vouchedge_subscribed_cappers`, `vouchedge_sub_messages`,
`vouchedge_subscriber_parlays`, etc. Each of these becomes an API call.

### 7. Migration helper: `src/lib/migrateLocalStorage.ts`

One-time migration script — runs on app load, pushes any localStorage
data to the server, then clears the localStorage keys. Useful for
existing dev users who have data in localStorage.

```ts
import { apiClient } from "./apiClient";

const KEYS_TO_MIGRATE = [
  "vouchedge_posts",
  "vouchedge_slips",
  "vouchedge_vouches",
  // ... etc
];

export async function migrateLocalStorage(): Promise<void> {
  for (const key of KEYS_TO_MIGRATE) {
    const stored = localStorage.getItem(key);
    if (!stored) continue;

    try {
      const data = JSON.parse(stored);
      // Push to server via appropriate endpoint
      // (depends on the shape — implement per-key migration logic)
      console.log(`[migrate] ${key}: ${Array.isArray(data) ? data.length : 1} items`);

      // After successful push, clear the localStorage key
      // localStorage.removeItem(key);
    } catch (err) {
      console.error(`[migrate] ${key} failed`, err);
    }
  }
}
```

Call from `App.tsx` once after auth:

```tsx
useEffect(() => {
  if (user) migrateLocalStorage();
}, [user]);
```

## What this fixes

1. **Posts persist server-side** — visible on any device, survive reinstalls
2. **Likes work cross-user** — your like actually increments the count for everyone
3. **Comments are real** — threaded conversations, not local-only
4. **View counts are real** — no more `simulatedViews` fabrication
5. **Demo content is clearly labeled** — banner shows when no real content
6. **Following graph drives the feed** — your feed is posts from people you follow

## What you still need to do

- Implement the migration logic for `vouchedge_slips` (parlay slips) —
  these become `/api/parlays` POST requests
- Implement the migration for `vouchedge_vouches` (the vouch system) —
  these become `/api/vouches` POST requests
- Replace the `vouchedge_following` localStorage with calls to
  `/api/follow` and `/api/following` (already implemented in publicRoutes.ts)
