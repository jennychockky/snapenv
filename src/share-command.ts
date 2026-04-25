import { Command } from "commander";
import {
  createShareToken,
  buildSharedPayload,
  encodeSharePayload,
  decodeSharePayload,
  isTokenExpired,
  formatShareSummary,
} from "./share";
import { getSnapshot } from "./storage";

export function registerShareCommands(program: Command): void {
  const share = program.command("share").description("Share snapshots via portable tokens");

  share
    .command("create <snapshot>")
    .description("Create a shareable encoded token for a snapshot")
    .option("-t, --ttl <seconds>", "Token TTL in seconds")
    .option("-r, --redact <keys>", "Comma-separated keys to redact", "")
    .action(async (snapshotName: string, opts: { ttl?: string; redact: string }) => {
      const snapshot = await getSnapshot(snapshotName);
      if (!snapshot) {
        console.error(`Snapshot "${snapshotName}" not found.`);
        process.exit(1);
      }
      const ttl = opts.ttl ? parseInt(opts.ttl, 10) : null;
      const redactKeys = opts.redact ? opts.redact.split(",").map((k) => k.trim()) : [];
      const token = createShareToken(snapshotName, ttl, redactKeys);
      const payload = buildSharedPayload(token, snapshot);
      const encoded = encodeSharePayload(payload);
      console.log(formatShareSummary(token));
      console.log("");
      console.log("Encoded token:");
      console.log(encoded);
    });

  share
    .command("inspect <token>")
    .description("Decode and inspect a share token without importing")
    .action((encoded: string) => {
      let payload;
      try {
        payload = decodeSharePayload(encoded);
      } catch {
        console.error("Invalid token: could not decode.");
        process.exit(1);
      }
      if (isTokenExpired(payload.token)) {
        console.warn("Warning: this token has expired.");
      }
      console.log(formatShareSummary(payload.token));
      console.log("");
      console.log("Variables:");
      for (const [key, value] of Object.entries(payload.env)) {
        console.log(`  ${key}=${value}`);
      }
    });

  share
    .command("import <token> <name>")
    .description("Import a shared token as a new snapshot")
    .action(async (encoded: string, name: string) => {
      let payload;
      try {
        payload = decodeSharePayload(encoded);
      } catch {
        console.error("Invalid token: could not decode.");
        process.exit(1);
      }
      if (isTokenExpired(payload.token)) {
        console.error("Token has expired and cannot be imported.");
        process.exit(1);
      }
      const { saveSnapshot } = await import("./storage");
      await saveSnapshot({ name, createdAt: new Date().toISOString(), env: payload.env });
      console.log(`Snapshot "${name}" imported from share token (${Object.keys(payload.env).length} variables).`);
    });
}
