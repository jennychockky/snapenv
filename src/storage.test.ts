import fs from 'fs';
import os from 'os';
import path from 'path';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

const mockDir = path.join(os.tmpdir(), 'snapenv-test-' + process.pid);
const mockFile = path.join(mockDir, 'snapshots.json');

vi.mock('os', async (importOriginal) => {
  const actual = await importOriginal<typeof os>();
  return { ...actual, default: { ...actual, homedir: () => mockDir } };
});

import {
  saveSnapshot,
  getSnapshot,
  deleteSnapshot,
  listSnapshots,
  loadSnapshots,
} from './storage';

const sampleSnapshot = {
  name: 'dev',
  project: 'my-app',
  createdAt: '2024-01-01T00:00:00.000Z',
  vars: { NODE_ENV: 'development', PORT: '3000' },
};

beforeEach(() => {
  if (fs.existsSync(mockDir)) fs.rmSync(mockDir, { recursive: true });
});

afterEach(() => {
  if (fs.existsSync(mockDir)) fs.rmSync(mockDir, { recursive: true });
});

describe('storage', () => {
  it('returns empty store when no file exists', () => {
    expect(loadSnapshots()).toEqual({});
  });

  it('saves and retrieves a snapshot', () => {
    saveSnapshot(sampleSnapshot);
    const result = getSnapshot('my-app', 'dev');
    expect(result).toEqual(sampleSnapshot);
  });

  it('returns undefined for missing snapshot', () => {
    expect(getSnapshot('my-app', 'nonexistent')).toBeUndefined();
  });

  it('lists snapshots filtered by project', () => {
    saveSnapshot(sampleSnapshot);
    saveSnapshot({ ...sampleSnapshot, name: 'prod', project: 'other-app' });
    const results = listSnapshots('my-app');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('dev');
  });

  it('lists all snapshots when no project filter', () => {
    saveSnapshot(sampleSnapshot);
    saveSnapshot({ ...sampleSnapshot, name: 'prod', project: 'other-app' });
    expect(listSnapshots()).toHaveLength(2);
  });

  it('deletes a snapshot and returns true', () => {
    saveSnapshot(sampleSnapshot);
    expect(deleteSnapshot('my-app', 'dev')).toBe(true);
    expect(getSnapshot('my-app', 'dev')).toBeUndefined();
  });

  it('returns false when deleting non-existent snapshot', () => {
    expect(deleteSnapshot('my-app', 'ghost')).toBe(false);
  });
});
