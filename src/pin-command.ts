import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { ensureStorageDir } from './storage';
import { pinSnapshot, unpinSnapshot, formatPins, isPinned, PinMap } from './pin';

function getPinPath(): string {
  return path.join(ensureStorageDir(), 'pins.json');
}

function loadPins(): PinMap {
  const p = getPinPath();
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as PinMap;
}

function savePins(pins: PinMap): void {
  fs.writeFileSync(getPinPath(), JSON.stringify(pins, null, 2));
}

export function registerPinCommands(program: Command): void {
  const pin = program.command('pin').description('Manage pinned snapshots');

  pin
    .command('add <name>')
    .description('Pin a snapshot')
    .option('-n, --note <note>', 'Optional note')
    .action((name: string, opts: { note?: string }) => {
      const pins = loadPins();
      savePins(pinSnapshot(pins, name, opts.note));
      console.log(`Pinned snapshot: ${name}`);
    });

  pin
    .command('remove <name>')
    .description('Unpin a snapshot')
    .action((name: string) => {
      const pins = loadPins();
      if (!isPinned(pins, name)) {
        console.error(`Snapshot '${name}' is not pinned.`);
        process.exit(1);
      }
      savePins(unpinSnapshot(pins, name));
      console.log(`Unpinned snapshot: ${name}`);
    });

  pin
    .command('list')
    .description('List all pinned snapshots')
    .action(() => {
      const pins = loadPins();
      console.log(formatPins(pins));
    });
}
