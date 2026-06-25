# mockData.ts + FeedPostCard.tsx patches

## Problem 1: mockData.ts seed posts

`src/data/mockData.ts` exports `INITIAL_POSTS` — 200+ lines of fabricated
feed content from fake accounts ("VouchEdge AI Model", "SharpPropAnalyst",
"SlamDiegoFan", etc.) with fake engagement metrics. Every new user sees
the same fake feed on first load.

## Fix 1: Mark as demo, show banner

Don't delete the seed data — it's useful for development. But:

1. Add `is_demo: true` to every post in the seed array
2. When rendering the feed, show a banner above any demo content
3. Once the user has 5+ real posts from people they follow, hide demo content

### Apply this diff

```diff
@@ // src/data/mockData.ts
- export const INITIAL_POSTS: Post[] = [
-   {
-     id: 'p1',
-     author: { /* ... */ },
-     body: 'Taking Aaron Judge over 0.5 HR today...',
-     likes: 47,
-     comments: 12,
-     // ...
-   },
-   // ... 30 more
- ];
+ export const INITIAL_POSTS: Post[] = [
+   {
+     id: 'p1',
+     author: { /* ... */ },
+     body: 'Taking Aaron Judge over 0.5 HR today...',
+     likes: 47,
+     comments: 12,
+     is_demo: true, // <-- add this flag to every entry
+     // ...
+   },
+   // ... 30 more, all marked is_demo: true
+ ];
```

### Feed rendering

```tsx
// src/social/feed/HomeFeedPage.tsx
function FeedList({ posts }) {
  const hasRealPosts = posts.some(p => !p.is_demo);

  return (
    <div>
      {!hasRealPosts && (
        <div className="feed__demo-banner">
          <strong>You're viewing demo content.</strong>
          <p>
            These posts are sample entries to show what the feed looks like.
            As you follow real cappers and users, your feed will populate
            with their posts.
          </p>
          <Link to="/discover">Find cappers to follow →</Link>
        </div>
      )}
      {posts.map(post => (
        <FeedPostCard key={post.id} post={post} showDemoBadge={!hasRealPosts} />
      ))}
    </div>
  );
}
```

---

## Problem 2: FeedPostCard simulatedViews

`src/components/FeedPostCard.tsx` line 97-100 contains:

```tsx
const simulatedViews = useMemo(() => {
  // Deterministic fake view count from post ID
  return 100 + (hashString(post.id) % 5000);
}, [post.id]);
```

The UI labels this number as "Views" — fabricating engagement metrics.

## Fix 2: Use real view_count, hide when zero

```diff
@@ // src/components/FeedPostCard.tsx
- const simulatedViews = useMemo(() => {
-   return 100 + (hashString(post.id) % 5000);
- }, [post.id]);
+ // Use the real view_count from the database. If absent, show nothing.
+ const viewCount = post.view_count ?? null;

@@ // in JSX, replace the simulatedViews display
- <span className="post-card__views">
-   <Eye /> {simulatedViews.toLocaleString()}
- </span>
+ {viewCount !== null && viewCount > 0 && (
+   <span className="post-card__views">
+     <Eye /> {viewCount.toLocaleString()}
+   </span>
+ )}
```

### Backend: implement real view counting

Add a view counter (cheap upsert on every feed load):

```ts
// server/routes/coreRoutes.ts
coreRoutes.post("/posts/:id/view", async (req, res) => {
  const { id } = req.params;
  const { supabaseAdmin } = await import("../middleware/auth");
  // Simple increment — no auth required, dedupe by IP in a follow-up pass
  await supabaseAdmin.rpc("increment_post_view", { p_post_id: id });
  return res.json({ ok: true });
});
```

```sql
-- supabase/schema.sql additions
create or replace function public.increment_post_view(p_post_id uuid)
returns void as $$
begin
  update public.posts set view_count = view_count + 1 where id = p_post_id;
end;
$$ language plpgsql security definer;
```

Client fires this once per post per session (debounced):

```ts
// src/components/FeedPostCard.tsx
useEffect(() => {
  if (post.is_demo) return; // don't count demo views
  const seenKey = `vouchedge_viewed_${post.id}`;
  if (sessionStorage.getItem(seenKey)) return;
  sessionStorage.setItem(seenKey, '1');
  apiClient.post(`/posts/${post.id}/view`).catch(() => {});
}, [post.id, post.is_demo]);
```
