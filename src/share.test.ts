import {
  createShareToken,
  isTokenExpired,
  buildSharedPayload,
  encodeSharePayload,
  decodeSharePayload,
  formatShareSummary,
} from "./share";
import { Snapshot } from "./storage";

const mockSnapshot: Snapshot = {
  name: "test",
  createdAt: "2024-01-01T00:00:00.000Z",
  env: { API_KEY: "secret", PORT: "3000", DEBUG: "true" },
};

test("createShareToken sets fields correctly", () => {
  const token = createShareToken("test", 3600, ["API_KEY"]);
  expect(token.snapshotName).toBe("test");
  expect(token.redactKeys).toContain("API_KEY");
  expect(token.expiresAt).not.toBeNull();
  expect(token.id).toHaveLength(24);
});

test("createShareToken with no TTL sets expiresAt to null", () => {
  const token = createShareToken("test");
  expect(token.expiresAt).toBeNull();
});

test("isTokenExpired returns false for non-expiring token", () => {
  const token = createShareToken("test", null);
  expect(isTokenExpired(token)).toBe(false);
});

test("isTokenExpired returns true for past expiry", () => {
  const token = createShareToken("test", -10);
  expect(isTokenExpired(token)).toBe(true);
});

test("buildSharedPayload redacts specified keys", () => {
  const token = createShareToken("test", null, ["API_KEY"]);
  const payload = buildSharedPayload(token, mockSnapshot);
  expect(payload.env["API_KEY"]).toBe("[REDACTED]");
  expect(payload.env["PORT"]).toBe("3000");
});

test("encodeSharePayload and decodeSharePayload round-trip", () => {
  const token = createShareToken("test", null, []);
  const payload = buildSharedPayload(token, mockSnapshot);
  const encoded = encodeSharePayload(payload);
  const decoded = decodeSharePayload(encoded);
  expect(decoded.token.id).toBe(token.id);
  expect(decoded.env).toEqual(mockSnapshot.env);
});

test("formatShareSummary includes all fields", () => {
  const token = createShareToken("mysnap", 60, ["SECRET"]);
  const summary = formatShareSummary(token);
  expect(summary).toContain("mysnap");
  expect(summary).toContain("SECRET");
  expect(summary).toContain("Expires");
});

test("formatShareSummary shows never when no expiry", () => {
  const token = createShareToken("mysnap");
  const summary = formatShareSummary(token);
  expect(summary).toContain("never");
});
