import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildWebhookPayload,
  signPayload,
  dispatchWebhook,
  formatWebhookConfig,
  WebhookConfig,
} from "./webhook";

const baseConfig: WebhookConfig = {
  url: "https://example.com/hook",
  secret: "mysecret",
  events: ["snapshot.created", "snapshot.deleted"],
  enabled: true,
};

describe("buildWebhookPayload", () => {
  it("includes event, name and timestamp", () => {
    const p = buildWebhookPayload("snapshot.created", "mysnap");
    expect(p.event).toBe("snapshot.created");
    expect(p.snapshotName).toBe("mysnap");
    expect(typeof p.timestamp).toBe("string");
  });

  it("attaches meta when provided", () => {
    const p = buildWebhookPayload("snapshot.deleted", "x", { reason: "prune" });
    expect(p.meta).toEqual({ reason: "prune" });
  });
});

describe("signPayload", () => {
  it("returns a hex string", () => {
    const sig = signPayload('{"event":"test"}', "secret");
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it("differs with different secrets", () => {
    const a = signPayload("data", "s1");
    const b = signPayload("data", "s2");
    expect(a).not.toBe(b);
  });
});

describe("dispatchWebhook", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  });

  it("returns ok false when disabled", async () => {
    const r = await dispatchWebhook(
      { ...baseConfig, enabled: false },
      buildWebhookPayload("snapshot.created", "s")
    );
    expect(r.ok).toBe(false);
    expect(r.error).toBe("webhook disabled");
  });

  it("returns ok false for unsubscribed event", async () => {
    const r = await dispatchWebhook(
      baseConfig,
      buildWebhookPayload("snapshot.restored", "s")
    );
    expect(r.ok).toBe(false);
  });

  it("calls fetch with signature header", async () => {
    await dispatchWebhook(baseConfig, buildWebhookPayload("snapshot.created", "s"));
    expect(fetch).toHaveBeenCalledOnce();
    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.headers["X-Snapenv-Signature"]).toBeDefined();
  });

  it("handles fetch error gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const r = await dispatchWebhook(
      baseConfig,
      buildWebhookPayload("snapshot.created", "s")
    );
    expect(r.ok).toBe(false);
    expect(r.error).toContain("timeout");
  });
});

describe("formatWebhookConfig", () => {
  it("shows url, status and events", () => {
    const out = formatWebhookConfig(baseConfig);
    expect(out).toContain("https://example.com/hook");
    expect(out).toContain("enabled");
    expect(out).toContain("snapshot.created");
  });
});
