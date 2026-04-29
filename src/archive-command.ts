import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { loadSnapshots, saveSnapshots } from './storage';
import {
  archiveSnapshot,
  unarchiveSnapshot,
  listArchived,
  formatArchiveList,
  exportArchive,
  importArchive,
  ArchiveStore,
} from './snapshot-archive';

const ARCHIVE_FILE = path.join(
  process.env.SNAPENV_DIR || path.join(process.env.HOME || '.', '.snapenv'),
  'archive.json'
);

function loadArchive(): ArchiveStore {
  if (!fs.existsSync(ARCHIVE_FILE)) return { entries: [] };
  return JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf8')) as ArchiveStore;
}

function saveArchive(store: ArchiveStore): void {
  fs.mkdirSync(path.dirname(ARCHIVE_FILE), { recursive: true });
  fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export function registerArchiveCommands(program: Command): void {
  const archive = program.command('archive').description('Manage archived snapshots');

  archive
    .command('add <name>')
    .description('Archive a snapshot by name')
    .option('-r, --reason <reason>', 'Reason for archiving')
    .action((name: string, opts: { reason?: string }) => {
      const snapshots = loadSnapshots();
      const snap = snapshots[name];
      if (!snap) { console.error(`Snapshot '${name}' not found.`); process.exit(1); }
      const store = archiveSnapshot(loadArchive(), snap, opts.reason);
      saveArchive(store);
      delete snapshots[name];
      saveSnapshots(snapshots);
      console.log(`Archived '${name}'.`);
    });

  archive
    .command('restore <name>')
    .description('Restore a snapshot from the archive')
    .action((name: string) => {
      const { store, snapshot } = unarchiveSnapshot(loadArchive(), name);
      if (!snapshot) { console.error(`No archived snapshot named '${name}'.`); process.exit(1); }
      saveArchive(store);
      const snapshots = loadSnapshots();
      snapshots[name] = snapshot;
      saveSnapshots(snapshots);
      console.log(`Restored '${name}' from archive.`);
    });

  archive
    .command('list')
    .description('List all archived snapshots')
    .action(() => {
      const store = loadArchive();
      console.log(formatArchiveList(listArchived(store)));
    });

  archive
    .command('export <file>')
    .description('Export archive to a gzipped file')
    .action((file: string) => {
      const buf = exportArchive(loadArchive());
      fs.writeFileSync(file, buf);
      console.log(`Archive exported to ${file}.`);
    });

  archive
    .command('import <file>')
    .description('Import archive from a gzipped file')
    .action((file: string) => {
      const buf = fs.readFileSync(file);
      const store = importArchive(buf);
      saveArchive(store);
      console.log(`Imported ${store.entries.length} archived snapshot(s).`);
    });
}
