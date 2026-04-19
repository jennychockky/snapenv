import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(__dirname, '../dist/cli.js');
const TMP_DIR = path.join(os.tmpdir(), 'snapenv-cli-test-' + Date.now());

function run(args: string, env?: NodeJS.ProcessEnv): string {
  return execSync(`node ${CLI} ${args}`, {
    env: { ...process.env, SNAPENV_DIR: TMP_DIR, ...env },
    encoding: 'utf8',
  }).trim();
}

beforeAll(() => fs.mkdirSync(TMP_DIR, { recursive: true }));
afterAll(() => fs.rmSync(TMP_DIR, { recursive: true, force: true }));

describe('cli save & list', () => {
  it('saves a snapshot and lists it', () => {
    const out = run('save mysnap', { MY_VAR: 'hello' });
    expect(out).toContain('Snapshot "mysnap" saved');

    const list = run('list');
    expect(list).toContain('mysnap');
  });
});

describe('cli restore', () => {
  it('prints export statements', () => {
    run('save restoresnap', { RESTORE_VAR: 'world' });
    const out = run('restore restoresnap');
    expect(out).toContain('export RESTORE_VAR');
    expect(out).toContain('world');
  });

  it('prints dotenv format', () => {
    run('save dotenvsnap', { DOT_VAR: 'val' });
    const out = run('restore dotenvsnap --format dotenv');
    expect(out).toContain('DOT_VAR=val');
  });
});

describe('cli delete', () => {
  it('deletes an existing snapshot', () => {
    run('save todelete');
    const out = run('delete todelete');
    expect(out).toContain('deleted');
  });

  it('exits with error for missing snapshot', () => {
    expect(() => run('delete nonexistent')).toThrow();
  });
});

describe('cli diff', () => {
  it('shows no differences when env matches snapshot', () => {
    run('save diffsnap', { DIFF_VAR: 'same' });
    const out = run('diff diffsnap', { DIFF_VAR: 'same' });
    expect(out).toContain('No differences');
  });
});
