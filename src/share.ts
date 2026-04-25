import * as crypto from "crypto";
import { Snapshot } from "./storage";

export interface ShareToken {
  id: string;
  snapshotName: string;
  createdAt: string;
  expiresAt: string | null;
  redactKeys: string[];
}

export interface SharedPayload {
  token: ShareToken;
  env: Record<string, string>;
}

export function generateShareId(): string {
  return crypto.randomBytes(12).toString("hex");
}

export function createShareToken(
  snapshotName: string,
  ttlSeconds: number | null = null,
  redactKeys: string[] = []
): ShareToken {
  return {
    id: generateShareId(),
    snapshotName,
    createdAt: new Date().toISOString(),
    expiresAt: ttlSeconds
      ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
      : null,
    redactKeys,
  };
}

export function isTokenExpired(token: ShareToken): boolean {
  if (!token.expiresAt) return false;
  return new Date(token.expiresAt) < new Date();
}

export function buildSharedPayload(
  token: ShareToken,
  snapshot: Snapshot
): SharedPayload {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(snapshot.env)) {
    env[key] = token.redactKeys.includes(key) ? "[REDACTED]" : value;
  }
  return { token, env };
}

export function encodeSharePayload(payload: SharedPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeSharePayload(encoded: string): SharedPayload {
  const json = Buffer.from(encoded, "base64url").toString("utf-8");
  return JSON.parse(json) as SharedPayload;
}

export function formatShareSummary(token: ShareToken): string {
  const lines: string[] = [
    `Share ID : ${token.id}`,
    `Snapshot : ${token.snapshotName}`,
    `Created  : ${token.createdAt}`,
    `Expires  : ${token.expiresAt ?? "never"}`,
  ];
  if (token.redactKeys.length > 0) {
    lines.push(`Redacted : ${token.redactKeys.join(", ")}`);
  }
  return lines.join("\n");
}
