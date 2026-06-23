// Social API service
import { api } from "@/lib/api";

export interface FeedPost {
  id: string;
  user_id: string;
  username: string;
  author_trust_score: number;
  author_vouch_level: string;
  type: string;
  body: string;
  media_urls: string[] | null;
  linked_pick_id: string | null;
  linked_parlay_id: string | null;
  posted_before_game: boolean;
  pick_result: string | null;
  likes_count: number;
  comments_count: number;
  vouches_count: number;
  rank_score?: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  author_trust_score: number;
  author_vouch_level: string;
  body: string;
  created_at: string;
}

export interface TrendingPick {
  pick_id: string;
  player_id: number;
  market: string;
  line: number;
  author_id: string;
  author_username: string;
  author_trust_score: number;
  author_vouch_level: string;
  post_id: string;
  post_body: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  vouches_count: number;
  posted_before_game: boolean;
  pick_result: string | null;
  trending_score: number;
}

export const socialApi = {
  feed: async (params?: { sort?: string; limit?: number }): Promise<{ data: FeedPost[]; meta: any }> => {
    const r = await api.get("/feed", { params });
    return r.data;
  },

  trending: async (params?: { period?: string; limit?: number }): Promise<{ data: TrendingPick[]; meta: any }> => {
    const r = await api.get("/trending", { params });
    return r.data;
  },

  createPost: async (req: {
    type: string;
    body: string;
    media_urls?: string[];
    linked_pick_id?: string;
    linked_parlay_id?: string;
  }): Promise<FeedPost> => {
    const r = await api.post("/posts", req);
    return r.data;
  },

  getPost: async (postId: string): Promise<{ data: FeedPost; meta: any }> => {
    const r = await api.get(`/posts/${postId}`);
    return r.data;
  },

  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}`);
  },

  comments: async (postId: string): Promise<{ data: Comment[]; meta: any }> => {
    const r = await api.get(`/posts/${postId}/comments`);
    return r.data;
  },

  createComment: async (postId: string, body: string): Promise<Comment> => {
    const r = await api.post("/comments", { post_id: postId, body });
    return r.data;
  },

  vouch: async (voucheeId: string, pickId?: string): Promise<any> => {
    const r = await api.post("/vouches", { vouchee_id: voucheeId, pick_id: pickId });
    return r.data;
  },

  follow: async (followeeId: string): Promise<any> => {
    const r = await api.post("/follow", { followee_id: followeeId });
    return r.data;
  },

  unfollow: async (followeeId: string): Promise<any> => {
    const r = await api.delete(`/follow/${followeeId}`);
    return r.data;
  },

  report: async (targetType: string, targetId: string, reason: string): Promise<any> => {
    const r = await api.post("/reports", { target_type: targetType, target_id: targetId, reason });
    return r.data;
  },
};
