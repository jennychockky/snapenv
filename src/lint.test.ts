import { lintEnvMap, formatLintResults, builtinRules } from './lint';

describe('lintEnvMap', () => {
  it('returns empty array for clean env', () => {
    const env = { API_KEY: 'abc123', BASE_URL: 'https://example.com' };
    expect(lintEnvMap(env)).toEqual([]);
  });

  it('detects empty values', () => {
    const results = lintEnvMap({ EMPTY_VAR: '' });
    expect(results.some((r) => r.rule === 'no-empty-value')).toBe(true);
  });

  it('detects whitespace in keys', () => {
    const results = lintEnvMap({ 'BAD KEY': 'value' });
    expect(results.some((r) => r.rule === 'no-whitespace-key')).toBe(true);
  });

  it('detects non-uppercase keys', () => {
    const results = lintEnvMap({ myKey: 'value' });
    expect(results.some((r) => r.rule === 'uppercase-key')).toBe(true);
  });

  it('detects quoted values', () => {
    const results = lintEnvMap({ API_KEY: '"quoted"' });
    expect(results.some((r) => r.rule === 'no-quotes-in-value')).toBe(true);
  });

  it('supports custom rules', () => {
    const rule = {
      name: 'no-localhost',
      check: (k: string, v: string) =>
        v.includes('localhost') ? `${k} references localhost` : null,
    };
    const results = lintEnvMap({ DB_URL: 'localhost:5432' }, [rule]);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('no-localhost');
  });
});

describe('formatLintResults', () => {
  it('returns no issues message for empty results', () => {
    expect(formatLintResults([])).toBe('No lint issues found.');
  });

  it('formats results with rule and message', () => {
    const results = [{ key: 'X', rule: 'uppercase-key', message: 'Key "X" is not uppercase' }];
    const output = formatLintResults(results);
    expect(output).toContain('[uppercase-key]');
    expect(output).toContain('Key "X" is not uppercase');
  });
});
