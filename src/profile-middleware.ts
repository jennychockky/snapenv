/**
 * Profile middleware — automatically applies the active snapshot from the
 * active profile before executing a CLI command, and optionally captures
 * env changes back into the profile after the command completes.
 */

import { loadProfiles } from "./profile-command";
import { getSnapshot } from "./storage";
import { applySnapshot } from "./snapshot";
import type { Command } from "commander";

export interface ProfileContext {
  profileName: string;
  snapshotName: string;
  applied: Record<string, string>;
}

/**
 * Resolves the active profile and its active snapshot, returning context
 * that describes what was applied.  Returns `null` when no profile is
 * active or no active snapshot is set on the profile.
 */
export async function resolveActiveProfile(
  storageDir: string
): Promise<ProfileContext | null> {
  const profiles = await loadProfiles(storageDir);

  const active = profiles.find((p) => p.active);
  if (!active) return null;

  if (!active.activeSnapshot) return null;

  const snapshot = await getSnapshot(storageDir, active.activeSnapshot);
  if (!snapshot) return null;

  return {
    profileName: active.name,
    snapshotName: active.activeSnapshot,
    applied: snapshot.env,
  };
}

/**
 * Applies the active profile's snapshot to `process.env`.  Returns the
 * context object so callers can display what was applied, or `null` when
 * nothing needed to be applied.
 */
export async function applyActiveProfile(
  storageDir: string
): Promise<ProfileContext | null> {
  const ctx = await resolveActiveProfile(storageDir);
  if (!ctx) return null;

  // applySnapshot merges the snapshot env map into the supplied target map.
  applySnapshot(ctx.applied, process.env as Record<string, string>);

  return ctx;
}

/**
 * Commander hook factory.  Wraps a command's action so that the active
 * profile snapshot is applied to `process.env` before the real action
 * runs.  Usage:
 *
 *   program
 *     .command("run")
 *     .action(withProfileMiddleware(storageDir, async () => { ... }));
 */
export function withProfileMiddleware(
  storageDir: string,
  action: (...args: unknown[]) => Promise<void> | void
): (...args: unknown[]) => Promise<void> {
  return async (...args: unknown[]) => {
    const ctx = await applyActiveProfile(storageDir);
    if (ctx) {
      console.log(
        `[profile] applied snapshot "${ctx.snapshotName}" from profile "${ctx.profileName}"`
      );
    }
    await action(...args);
  };
}

/**
 * Registers a `--no-profile` flag on the root program so users can opt
 * out of automatic profile application for a single invocation.
 */
export function registerProfileMiddlewareFlag(program: Command): void {
  program.option(
    "--no-profile",
    "skip automatic application of the active profile snapshot"
  );
}

/**
 * Returns `true` when the parsed options indicate the user has NOT
 * disabled profile middleware (i.e. `--no-profile` was not passed).
 */
export function profileMiddlewareEnabled(
  opts: Record<string, unknown>
): boolean {
  // Commander stores `--no-profile` as `profile: false`
  return opts["profile"] !== false;
}
