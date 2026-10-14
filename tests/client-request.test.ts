import test from "node:test";
import assert from "node:assert/strict";
import { requestJson } from "../src/lib/client-request";

test("writes reject failed HTTP responses, expired sessions, and disconnected networks", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('{"error":"private internal detail"}', { status: 500 });
    await assert.rejects(requestJson("/test"), /could not be saved/);
    globalThis.fetch = async () => new Response("", { status: 401 });
    await assert.rejects(requestJson("/test"), /session expired/);
    globalThis.fetch = async () => { throw new TypeError("Failed to fetch"); };
    await assert.rejects(requestJson("/test"));
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(await requestJson("/test"), null);
    globalThis.fetch = async () => Response.json({ bookmark: { id: "saved" } });
    assert.deepEqual(await requestJson("/test"), { bookmark: { id: "saved" } });
  } finally { globalThis.fetch = original; }
});
