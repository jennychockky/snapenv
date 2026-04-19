#!/usr/bin/env node
import { Command } from 'commander';
import { saveSnapshot, getSnapshot, listSnapshots, deleteSnapshot } from './storage';
import { captureProcessEnv, parseEnvFile, serializeEnvMap } from './env';
import { applySnapshot, diffSnapshot } from './snapshot';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('snapenv')
  .description('Snapshot and restore local environment variable sets')
  .version('0.1.0');

program
  .command('save <name>')
  .description('Save current environment or .env file as a snapshot')
  .option('-f, --file <path>', 'Path to .env file to snapshot')
  .action((name: string, opts: { file?: string }) => {
    const env = opts.file
      ? parseEnvFile(path.resolve(opts.file))
      : captureProcessEnv();
    saveSnapshot(name, env);
    console.log(`Snapshot "${name}" saved (${Object.keys(env).length} vars).`);
  });

program
  .command('restore <name>')
  .description('Print export commands to restore a snapshot')
  .option('--format <fmt>', 'Output format: export | dotenv', 'export')
  .action((name: string, opts: { format: string }) => {
    const snap = getSnapshot(name);
    if (!snap) { console.error(`Snapshot "${name}" not found.`); process.exit(1); }
    if (opts.format === 'dotenv') {
      process.stdout.write(serializeEnvMap(snap.env));
    } else {
      for (const [k, v] of Object.entries(snap.env)) {
        console.log(`export ${k}=${JSON.stringify(v)}`);
      }
    }
  });

program
  .command('list')
  .description('List all saved snapshots')
  .action(() => {
    const snaps = listSnapshots();
    if (snaps.length === 0) { console.log('No snapshots found.'); return; }
    snaps.forEach(s => console.log(`  ${s.name}  (${new Date(s.createdAt).toLocaleString()}, ${Object.keys(s.env).length} vars)`));
  });

program
  .command('delete <name>')
  .description('Delete a snapshot by name')
  .action((name: string) => {
    const ok = deleteSnapshot(name);
    if (!ok) { console.error(`Snapshot "${name}" not found.`); process.exit(1); }
    console.log(`Snapshot "${name}" deleted.`);
  });

program
  .command('diff <name>')
  .description('Diff a snapshot against the current environment')
  .action((name: string) => {
    const snap = getSnapshot(name);
    if (!snap) { console.error(`Snapshot "${name}" not found.`); process.exit(1); }
    const current = captureProcessEnv();
    const result = diffSnapshot(snap.env, current);
    if (result.added.length) console.log('Added:\n' + result.added.map(k => `  + ${k}`).join('\n'));
    if (result.removed.length) console.log('Removed:\n' + result.removed.map(k => `  - ${k}`).join('\n'));
    if (result.changed.length) console.log('Changed:\n' + result.changed.map(k => `  ~ ${k}`).join('\n'));
    if (!result.added.length && !result.removed.length && !result.changed.length) console.log('No differences.');
  });

program.parse(process.argv);
