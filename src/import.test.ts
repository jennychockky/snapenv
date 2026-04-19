import { importDotenv, importJson, importShell, detectImportFormat } from './import';

describe('detectImportFormat', () => {
  it('detects json', () => expect(detectImportFormat('snap.json')).toBe('json'));
  it('detects shell', () => expect(detectImportFormat('snap.sh')).toBe('shell'));
  it('defaults to dotenv', () => expect(detectImportFormat('snap.env')).toBe('dotenv'));
  it('defaults to dotenv for .txt', () => expect(detectImportFormat('vars.txt')).toBe('dotenv'));
});

describe('importDotenv', () => {
  it('parses simple key=value', () => {
    const map = importDotenv('FOO=bar\nBAZ=qux');
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('qux');
  });

  it('strips quotes', () => {
    const map = importDotenv('FOO="hello world"');
    expect(map.get('FOO')).toBe('hello world');
  });
});

describe('importJson', () => {
  it('parses flat json object', () => {
    const map = importJson(JSON.stringify({ A: '1', B: '2' }));
    expect(map.get('A')).toBe('1');
    expect(map.get('B')).toBe('2');
  });

  it('throws on non-object', () => {
    expect(() => importJson('[]')).toThrow();
  });

  it('throws on non-string values', () => {
    expect(() => importJson(JSON.stringify({ A: 1 }))).toThrow();
  });
});

describe('importShell', () => {
  it('parses export statements', () => {
    const map = importShell('export FOO=bar\nexport BAZ="hello"');
    expect(map.get('FOO')).toBe('bar');
    expect(map.get('BAZ')).toBe('hello');
  });

  it('ignores non-export lines', () => {
    const map = importShell('# comment\nexport X=1\nY=2');
    expect(map.has('X')).toBe(true);
    expect(map.has('Y')).toBe(false);
  });
});
