import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { recordHistory, filterHistory, formatHistory, HistoryEntry } from './history';
import { ensureStorageDir } from './storage';

const HISTORY_FILE = 'history.json';

function getHistoryPath(): string {
  return path.join(ensureStorageDir(), HISTORY_FILE);
}

export function loadHistory(): HistoryEntry[] {
  const p = getHistoryPath();
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export function saveHistory(history: HistoryEntry[]): void {
  fs.writeFileSync(getHistoryPath(), JSON.stringify(history, null, 2));
}

export function appendHistoryEntry(entry: Omit<HistoryEntry, 'timestamp'>): void {
  const history = loadHistory();
  const updated = recordHistory(history, entry);
  saveHistory(updated);
}

export function registerHistoryCommand(program: Command): void {
  const hist = program.command('history').description('View snapshot action history');

  hist
    .command('list')
    .description('List all history entries')
    .option('-n, --name <name>', 'Filter by snapshot name')
    .option('-a, --action <action>', 'Filter by action (save|restore|delete)')
    .action((opts) => {
      const history = loadHistory();
      const filtered = filterHistory(history, opts.name, opts.action);
      console.log(formatHistory(filtered));
    });

  hist
    .command('clear')
    .description('Clear all history')
    .action(() => {
      saveHistory([]);
      console.log('History cleared.');
    });
}
