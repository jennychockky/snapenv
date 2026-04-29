import { describe, it, expect } from 'vitest';
import { maskValue, previewSnapshot, formatPreview } from './snapshot-preview';
import { Snapshot } from './storage';

function makeSnapshot(env: Record<string, string>): Snapshot {
  return {
    name: 'test-snap',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
    env,
  };
}

describe('maskValue', () => {
  it('masks secret keys', () => {
    expect(maskValue('API_KEY', 'abc123', [/api_?key/i])).toBe('****');
    expect(maskValue('DB_PASSWORD', 'hunter2', [/password/i])).toBe('****');
  });

  it('does not mask non-secret keys', () => {
    expect(maskValue('APP_ENV', 'production', [/password/i])).toBe('production');
  });
});

describe('previewSnapshot', () => {
  it('includes snapshot metadata', () => {
    const snap = makeSnapshot({ FOO: 'bar' });
    const lines = previewSnapshot(snap);
    expect(lines[0]).toContain('test-snap');
    expect(lines[2]).toContain('1');
  });

  it('masks secrets by default', () => {
    const snap = makeSnapshot({ SECRET_TOKEN: 'abc', APP_NAME: 'myapp' });
    const lines = previewSnapshot(snap);
    const joined = lines.join('\n');
    expect(joined).toContain('SECRET_TOKEN=****');
    expect(joined).toContain('APP_NAME=myapp');
  });

  it('shows plain values when maskSecrets is false', () => {
    const snap = makeSnapshot({ SECRET_TOKEN: 'abc' });
    const lines = previewSnapshot(snap, { maskSecrets: false });
    expect(lines.join('\n')).toContain('SECRET_TOKEN=abc');
  });

  it('truncates when maxKeys exceeded', () => {
    const env: Record<string, string> = {};
    for (let i = 0; i < 25; i++) env[`KEY_${i}`] = `val_${i}`;
    const lines = previewSnapshot(snap(env), { maxKeys: 10 });
    expect(lines.join('\n')).toContain('15 more key(s)');
  });

  function snap(env: Record<string, string>) {
    return makeSnapshot(env);
  }
});

describe('formatPreview', () => {
  it('joins lines with newline', () => {
    expect(formatPreview(['a', 'b', 'c'])).toBe('a\nb\nc');
  });
});
