import { Command } from "commander";
import { loadSnapshots, saveSnapshots } from "./storage";
import {
  parseNamespacedKey,
  buildNamespacedKey,
  listNamespaces,
  filterByNamespace,
  stripNamespace,
} from "./namespace";

/**
 * Registers namespace-related subcommands onto the given Commander program.
 *
 * Commands:
 *   namespace list <snapshot>          — list all namespaces present in a snapshot
 *   namespace filter <snapshot> <ns>   — print keys belonging to a namespace
 *   namespace strip <snapshot> <ns>    — remove namespace prefix from matching keys (in-place)
 *   namespace move <snapshot> <from> <to> — rename a namespace prefix across all keys
 */
export function registerNamespaceCommands(program: Command): void {
  const ns = program
    .command("namespace")
    .description("Manage namespaced keys within snapshots");

  // ── list ──────────────────────────────────────────────────────────────────
  ns
    .command("list <snapshot>")
    .description("List all namespaces present in a snapshot")
    .action((snapshotName: string) => {
      const snapshots = loadSnapshots();
      const snap = snapshots[snapshotName];
      if (!snap) {
        console.error(`Snapshot "${snapshotName}" not found.`);
        process.exit(1);
      }
      const namespaces = listNamespaces(snap.env);
      if (namespaces.length === 0) {
        console.log("No namespaces found (no keys contain '::' separator).");
      } else {
        console.log(`Namespaces in "${snapshotName}":`);
        namespaces.forEach((n) => console.log(`  ${n}`));
      }
    });

  // ── filter ────────────────────────────────────────────────────────────────
  ns
    .command("filter <snapshot> <namespace>")
    .description("Show only keys belonging to the given namespace")
    .option("--strip", "Strip the namespace prefix from output keys")
    .action((snapshotName: string, namespace: string, opts: { strip?: boolean }) => {
      const snapshots = loadSnapshots();
      const snap = snapshots[snapshotName];
      if (!snap) {
        console.error(`Snapshot "${snapshotName}" not found.`);
        process.exit(1);
      }
      const filtered = filterByNamespace(snap.env, namespace);
      const entries = Object.entries(filtered);
      if (entries.length === 0) {
        console.log(`No keys found under namespace "${namespace}".`);
        return;
      }
      entries.forEach(([key, value]) => {
        const displayKey = opts.strip ? stripNamespace(key) : key;
        console.log(`${displayKey}=${value}`);
      });
    });

  // ── strip ─────────────────────────────────────────────────────────────────
  ns
    .command("strip <snapshot> <namespace>")
    .description(
      "Remove namespace prefix from all matching keys in the snapshot (modifies in place)"
    )
    .option("-y, --yes", "Skip confirmation prompt")
    .action((snapshotName: string, namespace: string, opts: { yes?: boolean }) => {
      const snapshots = loadSnapshots();
      const snap = snapshots[snapshotName];
      if (!snap) {
        console.error(`Snapshot "${snapshotName}" not found.`);
        process.exit(1);
      }
      const filtered = filterByNamespace(snap.env, namespace);
      const count = Object.keys(filtered).length;
      if (count === 0) {
        console.log(`No keys found under namespace "${namespace}". Nothing to strip.`);
        return;
      }
      if (!opts.yes) {
        console.log(
          `This will strip the "${namespace}::" prefix from ${count} key(s) in "${snapshotName}".`
        );
        console.log("Re-run with --yes to confirm.");
        return;
      }
      const newEnv: Record<string, string> = {};
      for (const [key, value] of Object.entries(snap.env)) {
        const parsed = parseNamespacedKey(key);
        if (parsed.namespace === namespace) {
          newEnv[parsed.key] = value;
        } else {
          newEnv[key] = value;
        }
      }
      snapshots[snapshotName] = { ...snap, env: newEnv };
      saveSnapshots(snapshots);
      console.log(`Stripped namespace "${namespace}" from ${count} key(s) in "${snapshotName}".`);
    });

  // ── move ──────────────────────────────────────────────────────────────────
  ns
    .command("move <snapshot> <from> <to>")
    .description("Rename a namespace prefix across all matching keys")
    .option("-y, --yes", "Skip confirmation prompt")
    .action(
      (snapshotName: string, fromNs: string, toNs: string, opts: { yes?: boolean }) => {
        const snapshots = loadSnapshots();
        const snap = snapshots[snapshotName];
        if (!snap) {
          console.error(`Snapshot "${snapshotName}" not found.`);
          process.exit(1);
        }
        const filtered = filterByNamespace(snap.env, fromNs);
        const count = Object.keys(filtered).length;
        if (count === 0) {
          console.log(`No keys found under namespace "${fromNs}". Nothing to move.`);
          return;
        }
        if (!opts.yes) {
          console.log(
            `This will rename namespace "${fromNs}" → "${toNs}" for ${count} key(s) in "${snapshotName}".`
          );
          console.log("Re-run with --yes to confirm.");
          return;
        }
        const newEnv: Record<string, string> = {};
        for (const [key, value] of Object.entries(snap.env)) {
          const parsed = parseNamespacedKey(key);
          if (parsed.namespace === fromNs) {
            newEnv[buildNamespacedKey(toNs, parsed.key)] = value;
          } else {
            newEnv[key] = value;
          }
        }
        snapshots[snapshotName] = { ...snap, env: newEnv };
        saveSnapshots(snapshots);
        console.log(
          `Moved ${count} key(s) from namespace "${fromNs}" to "${toNs}" in "${snapshotName}".`
        );
      }
    );
}
