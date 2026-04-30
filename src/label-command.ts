import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import {
  LabelStore,
  setLabel,
  removeLabel,
  getLabels,
  findByLabel,
  formatLabels,
} from './snapshot-label';

export function getLabelPath(dir: string): string {
  return path.join(dir, 'labels.json');
}

export function loadLabels(dir: string): LabelStore {
  const p = getLabelPath(dir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as LabelStore;
}

export function saveLabels(dir: string, store: LabelStore): void {
  fs.writeFileSync(getLabelPath(dir), JSON.stringify(store, null, 2));
}

export function registerLabelCommands(program: Command, storageDir: string): void {
  const label = program.command('label').description('Manage snapshot labels');

  label
    .command('set <snapshot> <key> <value>')
    .description('Set a label on a snapshot')
    .action((snapshot: string, key: string, value: string) => {
      const store = loadLabels(storageDir);
      const updated = setLabel(store, snapshot, key, value);
      saveLabels(storageDir, updated);
      console.log(`Label ${key}=${value} set on "${snapshot}"`);
    });

  label
    .command('remove <snapshot> <key>')
    .description('Remove a label from a snapshot')
    .action((snapshot: string, key: string) => {
      const store = loadLabels(storageDir);
      const updated = removeLabel(store, snapshot, key);
      saveLabels(storageDir, updated);
      console.log(`Label "${key}" removed from "${snapshot}"`);
    });

  label
    .command('list <snapshot>')
    .description('List labels for a snapshot')
    .action((snapshot: string) => {
      const store = loadLabels(storageDir);
      const labels = getLabels(store, snapshot);
      console.log(formatLabels(labels));
    });

  label
    .command('find <key> [value]')
    .description('Find snapshots by label key (and optional value)')
    .action((key: string, value?: string) => {
      const store = loadLabels(storageDir);
      const names = findByLabel(store, key, value);
      if (names.length === 0) {
        console.log('No snapshots found.');
      } else {
        names.forEach((n) => console.log(n));
      }
    });
}
