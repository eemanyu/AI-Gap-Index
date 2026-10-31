export type SignalSource = "tweets" | "news" | "blog";

export type ProviderStateRow = {
  provider_id: string;
  tweet_delta: number;
  news_delta: number;
  blog_delta: number;
  summary: string;
  updated_at: string;
};

export type ProviderState = {
  tweetDelta: number;
  newsDelta: number;
  blogDelta: number;
  summary: string;
  updatedAt: string;
};

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function effectiveScore(base: number, state?: Pick<ProviderState, "tweetDelta" | "newsDelta" | "blogDelta"> | null): number {
  if (!state) return clampScore(base);
  return clampScore(base + state.tweetDelta + state.newsDelta + state.blogDelta);
}

export function deltasFromRow(row?: ProviderStateRow | null): ProviderState | null {
  if (!row) return null;
  return {
    tweetDelta: row.tweet_delta,
    newsDelta: row.news_delta,
    blogDelta: row.blog_delta,
    summary: row.summary,
    updatedAt: row.updated_at
  };
}

export const deltaField: Record<SignalSource, "tweetDelta" | "newsDelta" | "blogDelta"> = {
  tweets: "tweetDelta",
  news: "newsDelta",
  blog: "blogDelta"
};
