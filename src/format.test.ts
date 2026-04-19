import { detectFormat, formatExtension, buildExportFilename, parseFormatFlag } from './format';

describe('detectFormat', () => {
  it('detects json from .json extension', () => {
    expect(detectFormat('snapshot.json')).toBe('json');
  });

  it('detects shell from .sh extension', () => {
    expect(detectFormat('export.sh')).toBe('shell');
  });

  it('defaults to dotenv for .env', () => {
    expect(detectFormat('myproject.env')).toBe('dotenv');
  });

  it('defaults to dotenv for unknown extensions', () => {
    expect(detectFormat('snapshot.txt')).toBe('dotenv');
  });
});

describe('formatExtension', () => {
  it('returns .json for json', () => {
    expect(formatExtension('json')).toBe('.json');
  });

  it('returns .sh for shell', () => {
    expect(formatExtension('shell')).toBe('.sh');
  });

  it('returns .env for dotenv', () => {
    expect(formatExtension('dotenv')).toBe('.env');
  });
});

describe('buildExportFilename', () => {
  it('builds a safe filename', () => {
    expect(buildExportFilename('my-snapshot', 'dotenv')).toBe('my-snapshot.env');
  });

  it('sanitizes special characters', () => {
    expect(buildExportFilename('snap shot!', 'json')).toBe('snap_shot_.json');
  });
});

describe('parseFormatFlag', () => {
  it('parses valid formats', () => {
    expect(parseFormatFlag('json')).toBe('json');
    expect(parseFormatFlag('shell')).toBe('shell');
    expect(parseFormatFlag('dotenv')).toBe('dotenv');
  });

  it('defaults to dotenv when undefined', () => {
    expect(parseFormatFlag(undefined)).toBe('dotenv');
  });

  it('throws on invalid format', () => {
    expect(() => parseFormatFlag('yaml')).toThrow();
  });
});
