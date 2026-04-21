import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { lockSnapshot, unlockSnapshot, isLocked, listLocks, formatLocks } from './lock';
import { loadSnapshots } from './storage';

export function getLockPath(storageDir: string): string {
  return path.join(storageDir, 'locks.json');
}

export function loadLocks(storageDir: string): Record<string, boolean> {
  const lockPath = getLockPath(storageDir);
  if (!fs.existsSync(lockPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveLocks(storageDir: string, locks: Record<string, boolean>): void {
  fs.writeFileSync(getLockPath(storageDir), JSON.stringify(locks, null, 2));
}

export function registerLockCommands(program: Command, storageDir: string): void {
  const lockCmd = program.command('lock').description('Manage snapshot locks');

  lockCmd
    .command('add <name>')
    .description('Lock a snapshot to prevent modification or deletion')
    .action((name: string) => {
      const snapshots = loadSnapshots(storageDir);
      const locks = loadLocks(storageDir);
      const updated = lockSnapshot(snapshots, locks, name);
      saveLocks(storageDir, updated);
      console.log(`Snapshot "${name}" is now locked.`);
    });

  lockCmd
    .command('remove <name>')
    .description('Unlock a snapshot')
    .action((name: string) => {
      const locks = loadLocks(storageDir);
      const updated = unlockSnapshot(locks, name);
      saveLocks(storageDir, updated);
      console.log(`Snapshot "${name}" is now unlocked.`);
    });

  lockCmd
    .command('status <name>')
    .description('Check if a snapshot is locked')
    .action((name: string) => {
      const locks = loadLocks(storageDir);
      const locked = isLocked(locks, name);
      console.log(`Snapshot "${name}" is ${locked ? 'locked' : 'unlocked'}.`);
    });

  lockCmd
    .command('list')
    .description('List all locked snapshots')
    .action(() => {
      const locks = loadLocks(storageDir);
      const pins = listLocks(locks);
      console.log(formatLocks(pins));
    });
}
