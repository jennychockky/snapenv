import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { setExpiry, filterExpired, formatExpiry, SnapshotExpiry } from './expire';
import { ensureStorageDir } from './storage';

function getExpiryPath(): string {
  return path.join(ensureStorageDir(), 'expiries.json');
}

function loadExpiries(): SnapshotExpiry[] {
  const p = getExpiryPath();
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveExpiries(expiries: SnapshotExpiry[]): void {
  fs.writeFileSync(getExpiryPath(), JSON.stringify(expiries, null, 2));
}

export function registerExpireCommands(program: Command): void {
  const expire = program.command('expire').description('Manage snapshot expiry');

  expire
    .command('set <name>')
    .description('Set expiry on a snapshot')
    .option('--ttl <seconds>', 'TTL in seconds')
    .option('--at <iso>', 'Exact expiry ISO date')
    .action((name: string, opts: { ttl?: string; at?: string }) => {
      const policy = opts.ttl ? { ttlSeconds: parseInt(opts.ttl, 10) } : { expiresAt: opts.at };
      const entry = setExpiry(name, policy);
      const expiries = loadExpiries().filter(e => e.name !== name);
      expiries.push(entry);
      saveExpiries(expiries);
      console.log(`Set expiry for '${name}': ${entry.expiresAt}`);
    });

  expire
    .command('list')
    .description('List snapshot expiries')
    .action(() => {
      const expiries = loadExpiries();
      if (!expiries.length) { console.log('No expiries set.'); return; }
      expiries.forEach(e => console.log(formatExpiry(e)));
    });

  expire
    .command('purge')
    .description('Remove expired snapshots from expiry list')
    .action(() => {
      const expiries = loadExpiries();
      const { expired, active } = filterExpired(expiries);
      saveExpiries(active);
      if (expired.length) {
        console.log(`Purged ${expired.length} expired entries: ${expired.map(e => e.name).join(', ')}`);
      } else {
        console.log('No expired entries to purge.');
      }
    });
}
