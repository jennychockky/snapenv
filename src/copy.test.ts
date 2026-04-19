import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { copySnapshot } from './copy';
import { saveSnapshot, loadSnapshots } from './storage';

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'snapenv-copy-'));
}

describe('copySnapshot', () => {
  it('copies a snapshot to a new name', () => {
    const dir = makeTmp();
    saveSnapshot(dir, { name: 'src', env: { FOO: 'bar' }, createdAt: '', tags: [] });
    const copy = copySnapshot(dir, 'src', 'dst');
    expect(copy.name).toBe('dst');
    expect(copy.env).toEqual({ FOO: 'bar' });
    const snapshots = loadSnapshots(dir);
    expect(snapshots['dst']).toBeDefined();
    expect(snapshots['src']).toBeDefined();
  });

  it('copies tags from source', () => {
    const dir = makeTmp();
    saveSnapshot(dir, { name: 'src', env: {}, createdAt: '', tags: ['prod'] });
    const copy = copySnapshot(dir, 'src', 'dst');
    expect(copy.tags).toEqual(['prod']);
  });

  it('throws if source does not exist', () => {
    const dir = makeTmp();
    expect(() => copySnapshot(dir, 'missing', 'dst')).toThrow("Snapshot 'missing' not found");
  });

  it('throws if dest exists and overwrite is false', () => {
    const dir = makeTmp();
    saveSnapshot(dir, { name: 'src', env: {}, createdAt: '', tags: [] });
    saveSnapshot(dir, { name: 'dst', env: {}, createdAt: '', tags: [] });
    expect(() => copySnapshot(dir, 'src', 'dst')).toThrow("already exists");
  });

  it('overwrites dest when overwrite is true', () => {
    const dir = makeTmp();
    saveSnapshot(dir, { name: 'src', env: { A: '1' }, createdAt: '', tags: [] });
    saveSnapshot(dir, { name: 'dst', env: { A: '2' }, createdAt: '', tags: [] });
    const copy = copySnapshot(dir, 'src', 'dst', true);
    expect(copy.env).toEqual({ A: '1' });
  });
});
