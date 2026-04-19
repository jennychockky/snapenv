import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { renameSnapshot, updateAliasesAfterRename } from './rename';
import { saveSnapshot, loadSnapshots } from './storage';
import { addAlias, listAliases } from './alias';

function makeTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'snapenv-rename-'));
}

describe('renameSnapshot', () => {
  let dir: string;
  beforeEach(() => { dir = makeTmp(); });

  it('renames an existing snapshot', () => {
    saveSnapshot(dir, { name: 'dev', vars: { FOO: 'bar' }, createdAt: new Date().toISOString(), tags: [] });
    renameSnapshot('dev', 'development', dir);
    const snaps = loadSnapshots(dir);
    expect(snaps['development']).toBeDefined();
    expect(snaps['development'].name).toBe('development');
    expect(snaps['dev']).toBeUndefined();
  });

  it('throws if source snapshot not found', () => {
    expect(() => renameSnapshot('missing', 'new', dir)).toThrow("Snapshot 'missing' not found");
  });

  it('throws if target name already exists', () => {
    saveSnapshot(dir, { name: 'dev', vars: {}, createdAt: new Date().toISOString(), tags: [] });
    saveSnapshot(dir, { name: 'prod', vars: {}, createdAt: new Date().toISOString(), tags: [] });
    expect(() => renameSnapshot('dev', 'prod', dir)).toThrow("Snapshot 'prod' already exists");
  });
});

describe('updateAliasesAfterRename', () => {
  let dir: string;
  beforeEach(() => { dir = makeTmp(); });

  it('updates aliases pointing to old name', () => {
    addAlias('d', 'dev', dir);
    addAlias('other', 'prod', dir);
    const updated = updateAliasesAfterRename('dev', 'development', dir);
    expect(updated).toContain('d');
    const aliases = listAliases(dir);
    expect(aliases['d']).toBe('development');
    expect(aliases['other']).toBe('prod');
  });

  it('returns empty array when no aliases match', () => {
    addAlias('p', 'prod', dir);
    const updated = updateAliasesAfterRename('dev', 'development', dir);
    expect(updated).toHaveLength(0);
  });
});
