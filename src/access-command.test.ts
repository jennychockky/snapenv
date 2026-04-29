import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getAccessPath,
  loadAccessLog,
  saveAccessLog,
  appendAccessEntry,
  registerAccessCommands,
} from './access-command';
import { AccessLog } from './snapshot-access';

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'snapenv-access-'));
}

function makeProgram(dir: string): Command {
  const p = new Command();
  p.exitOverride();
  registerAccessCommands(p, dir);
  return p;
}

describe('loadAccessLog', () => {
  it('returns empty log when file missing', () => {
    const dir = makeTmp();
    expect(loadAccessLog(dir)).toEqual({ entries: [] });
  });

  it('loads saved log', () => {
    const dir = makeTmp();
    const log: AccessLog = {
      entries: [{ snapshotName: 'prod', action: 'read', accessedAt: '2024-01-01T00:00:00Z' }],
    };
    saveAccessLog(dir, log);
    expect(loadAccessLog(dir).entries).toHaveLength(1);
  });
});

describe('appendAccessEntry', () => {
  it('appends entry to log on disk', () => {
    const dir = makeTmp();
    appendAccessEntry(dir, 'dev', 'write', 'cli');
    appendAccessEntry(dir, 'dev', 'read');
    const log = loadAccessLog(dir);
    expect(log.entries).toHaveLength(2);
    expect(log.entries[0].action).toBe('write');
    expect(log.entries[1].action).toBe('read');
  });
});

describe('access log command', () => {
  it('prints no access records when empty', () => {
    const dir = makeTmp();
    const prog = makeProgram(dir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    prog.parse(['access', 'log'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/no access/i));
    spy.mockRestore();
  });

  it('prints top snapshots', () => {
    const dir = makeTmp();
    appendAccessEntry(dir, 'prod', 'read');
    appendAccessEntry(dir, 'prod', 'read');
    appendAccessEntry(dir, 'dev', 'read');
    const prog = makeProgram(dir);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    prog.parse(['access', 'top', '--limit', '2'], { from: 'user' });
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('prod: 2');
    spy.mockRestore();
  });
});
