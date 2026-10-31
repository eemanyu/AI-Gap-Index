import { afterAll, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";

const dbPath = `/tmp/gap-audit-test-${process.pid}.sqlite`;
process.env.DB_PATH = dbPath;
process.env.SITE_URL = "https://example.test";

// Keep the import-time news refresh off the network so tests stay deterministic.
const realFetch = globalThis.fetch;
globalThis.fetch = (() => Promise.reject(new Error("network disabled in tests"))) as unknown as typeof fetch;
const { default: server } = await import("../server");
globalThis.fetch = realFetch;

type ServerArg = Parameters<typeof server.fetch>[1];
const client = (address: string) => ({ requestIP: () => ({ address }) }) as ServerArg;

function get(path: string): Promise<Response> {
  return server.fetch(new Request(`http://localhost${path}`));
}

function post(path: string, contentType: string, body: unknown, address: string): Promise<Response> {
  return server.fetch(new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": contentType },
    body: JSON.stringify(body)
  }), client(address));
}

afterAll(() => {
  for (const suffix of ["", "-wal", "-shm"]) rmSync(`${dbPath}${suffix}`, { force: true });
});

describe("HTTP server", () => {
  test("healthz reports ok", async () => {
    const response = await get("/healthz");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
  });

  test("index JSON contains providers", async () => {
    const response = await get("/api/index.json");
    expect(response.status).toBe(200);
    const body = await response.json() as { providers: unknown[] };
    expect(Array.isArray(body.providers)).toBe(true);
    expect(body.providers.length).toBe(10);
  });

  test("every HTML route renders without template tokens", async () => {
    for (const path of ["/", "/index.html", "/about", "/about/", "/privacy", "/privacy/", "/unsubscribe", "/unsubscribe/"]) {
      const response = await get(path);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");
      expect(await response.text()).not.toMatch(/__[A-Z_]+__/);
    }
  });

  test("malformed percent-encoding returns 404 instead of 500", async () => {
    const response = await get("/api/%");
    expect(response.status).toBe(404);
  });

  test("encoded path traversal returns 404", async () => {
    const response = await get("/%2e%2e/server.ts");
    expect(response.status).toBe(404);
  });

  test("static assets are still served from public", async () => {
    const response = await get("/styles.css");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/css");
  });

  test("subscribe rejects simple content types", async () => {
    const response = await post("/api/subscribe", "text/plain", { email: "plain@example.test", consent: true }, "198.51.100.10");
    expect(response.status).toBe(415);
    expect(await response.json()).toMatchObject({ ok: false });
  });

  test("subscribe requires consent", async () => {
    const response = await post("/api/subscribe", "application/json", { email: "noconsent@example.test" }, "198.51.100.11");
    expect(response.status).toBe(400);
  });

  test("subscribe then unsubscribe with JSON", async () => {
    const subscribed = await post("/api/subscribe", "application/json; charset=utf-8", { email: "reader@example.test", consent: true }, "198.51.100.12");
    expect(subscribed.status).toBe(200);
    expect(await subscribed.json()).toMatchObject({ ok: true });

    const unsubscribed = await post("/api/unsubscribe", "application/json", { email: "reader@example.test" }, "198.51.100.13");
    expect(unsubscribed.status).toBe(200);
    expect(await unsubscribed.json()).toMatchObject({ ok: true });
  });
});
