import { Snapshot } from './storage';

export interface PinEntry {
  name: string;
  pinnedAt: string;
  note?: string;
}

export type PinMap = Record<string, PinEntry>;

export function pinSnapshot(pins: PinMap, name: string, note?: string): PinMap {
  return {
    ...pins,
    [name]: { name, pinnedAt: new Date().toISOString(), note },
  };
}

export function unpinSnapshot(pins: PinMap, name: string): PinMap {
  const updated = { ...pins };
  delete updated[name];
  return updated;
}

export function isPinned(pins: PinMap, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(pins, name);
}

export function listPins(pins: PinMap): PinEntry[] {
  return Object.values(pins).sort((a, b) =>
    a.pinnedAt.localeCompare(b.pinnedAt)
  );
}

export function formatPins(pins: PinMap): string {
  const entries = listPins(pins);
  if (entries.length === 0) return 'No pinned snapshots.';
  return entries
    .map((e) => {
      const note = e.note ? `  # ${e.note}` : '';
      return `  ${e.name}  (pinned ${e.pinnedAt})${note}`;
    })
    .join('\n');
}
