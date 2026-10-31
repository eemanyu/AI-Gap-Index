import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import worker, { type Env } from "../worker";

const token = "worker-test-token";
const context = { waitUntil() {} };

class TestStatement {
  private values: unknown[] = [];

  constructor(private db: Database, private sql: string) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async first<T>() {
    return this.db.query(this.sql).get(...this.values) as T | null;
  }

  async all<T>() {
    return { results: this.db.query(this.sql).all(...this.values) as T[] };
  }

  async run() {
    const result = this.runSync();
    return result;
  }

  runSync() {
    const result = this.db.query(this.sql).run(...this.values);
    return { meta: { changes: result.changes } };
  }
}

class TestD1 {
  constructor(private db: Database) {}

  prepare(sql: string) {
    return new TestStatement(this.db, sql);
  }

  async batch(statements: TestStatement[]) {
    return this.db.transaction(() => statements.map((statement) => statement.runSync()))();
  }
}

function createEnv(): Env {
  const db = new Database(":memory:");
  db.exec(readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8"));
  return {
    DB: new TestD1(db),
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    INGEST_TOKEN: token
  } as unknown as Env;
}

function ingest(env: Env, source: string, delta: number, extra: Record<string, unknown> = {}) {
  return worker.fetch(new Request("https://gap.test/api/signals", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ providerId: "anthropic", source, delta, ...extra })
  }), env, context);
}

async function stateFor(env: Env) {
  const response = await worker.fetch(new Request("https://gap.test/api/state.json"), env, context);
  const result = await response.json() as { providers: Array<Record<string, unknown>> };
  return result.providers.find((provider) => provider.id === "anthropic")!;
}

describe("Cloudflare Worker routes", () => {
  test("keeps concurrent source deltas when updating provider state", async () => {
    const env = createEnv();
    const responses = await Promise.all([
      ingest(env, "tweets", 2),
      ingest(env, "news", 3)
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    const state = await stateFor(env);
    expect(state.tweetDelta).toBe(2);
    expect(state.newsDelta).toBe(3);
  });

  test("rejects oversized streamed JSON without a Content-Length header", async () => {
    const env = createEnv();
    const payload = JSON.stringify({ providerId: "anthropic", source: "tweets", delta: 1, summary: "x".repeat(9000) });
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(payload));
        controller.close();
      }
    });
    const request = new Request("https://gap.test/api/signals", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: stream,
      duplex: "half"
    } as RequestInit);

    expect(request.headers.get("content-length")).toBeNull();
    expect((await worker.fetch(request, env, context)).status).toBe(413);
  });

  test("applies a deduplicated batch once", async () => {
    const env = createEnv();
    const extra = {
      items: [{ title: "New release", url: "https://example.com/release", publishedAt: "2026-10-31" }],
      dedupe: true
    };
    const first = await ingest(env, "blog", 2, extra);
    const duplicate = await ingest(env, "blog", -5, extra);

    expect((await first.json() as { applied: boolean }).applied).toBe(true);
    expect((await duplicate.json() as { applied: boolean }).applied).toBe(false);
    expect((await stateFor(env)).blogDelta).toBe(2);
  });
});