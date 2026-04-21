import { describe, it, expect, beforeEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getAuditPath,
  loadAuditLog,
  saveAuditLog,
  appendAuditEntry,
  registerAuditCommands,
} from './audit-command';
import { createAuditEntry } from './audit';

function makeTmp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapenv-audit-'));
  return dir;
}

function makeProgram(storageDir: string) {
  const program = new Command();
  program.exitOverride();
  registerAuditCommands(program, storageDir);
  return program;
}

describe('loadAuditLog / saveAuditLog', () => {
  it('returns empty array when no file', () => {
    const dir = makeTmp();
    expect(loadAuditLog(dir)).toEqual([]);
  });

  it('round-trips entries', () => {
    const dir = makeTmp();
    const entry = createAuditEntry('save', 'prod');
    saveAuditLog(dir, [entry]);
    const loaded = loadAuditLog(dir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].snapshotName).toBe('prod');
  });
});

describe('appendAuditEntry', () => {
  it('appends to existing entries', () => {
    const dir = makeTmp();
    appendAuditEntry(dir, createAuditEntry('save', 'a'));
    appendAuditEntry(dir, createAuditEntry('restore', 'b'));
    expect(loadAuditLog(dir)).toHaveLength(2);
  });
});

describe('audit log command', () => {
  it('prints no entries message', () => {
    const dir = makeTmp();
    const program = makeProgram(dir);
    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => logs.push(msg);
    program.parse(['node', 'cli', 'audit', 'log']);
    console.log = orig;
    expect(logs.join('')).toContain('No audit entries found');
  });

  it('clears the log', () => {
    const dir = makeTmp();
    appendAuditEntry(dir, createAuditEntry('save', 'snap1'));
    const program = makeProgram(dir);
    program.parse(['node', 'cli', 'audit', 'clear']);
    expect(loadAuditLog(dir)).toHaveLength(0);
  });
});
