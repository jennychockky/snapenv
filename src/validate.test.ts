import { validateEnvMap, formatValidationReport, parseRulesFile } from './validate';

const sampleEnv = {
  NODE_ENV: 'production',
  PORT: '8080',
  API_KEY: 'abc123',
  LOG_LEVEL: 'info',
};

describe('validateEnvMap', () => {
  it('passes when all required keys are present', () => {
    const report = validateEnvMap(sampleEnv, [
      { key: 'NODE_ENV', required: true },
      { key: 'PORT', required: true },
    ]);
    expect(report.valid).toBe(true);
  });

  it('fails when a required key is missing', () => {
    const report = validateEnvMap({}, [{ key: 'DATABASE_URL', required: true }]);
    expect(report.valid).toBe(false);
    expect(report.results[0].errors[0]).toMatch(/required but missing/);
  });

  it('fails when value does not match pattern', () => {
    const report = validateEnvMap(
      { PORT: 'abc' },
      [{ key: 'PORT', pattern: /^\d+$/ }]
    );
    expect(report.valid).toBe(false);
    expect(report.results[0].errors[0]).toMatch(/does not match required pattern/);
  });

  it('fails when value is too short', () => {
    const report = validateEnvMap(
      { API_KEY: 'x' },
      [{ key: 'API_KEY', minLength: 5 }]
    );
    expect(report.valid).toBe(false);
    expect(report.results[0].errors[0]).toMatch(/shorter than minimum/);
  });

  it('fails when value is too long', () => {
    const report = validateEnvMap(
      { API_KEY: 'averylongsecretkey' },
      [{ key: 'API_KEY', maxLength: 10 }]
    );
    expect(report.valid).toBe(false);
  });

  it('fails when value is not in allowedValues', () => {
    const report = validateEnvMap(
      { LOG_LEVEL: 'verbose' },
      [{ key: 'LOG_LEVEL', allowedValues: ['info', 'warn', 'error'] }]
    );
    expect(report.valid).toBe(false);
    expect(report.results[0].errors[0]).toMatch(/not in allowed values/);
  });
});

describe('formatValidationReport', () => {
  it('returns success message when valid', () => {
    const msg = formatValidationReport({ valid: true, results: [] });
    expect(msg).toContain('passed');
  });

  it('lists errors when invalid', () => {
    const report = validateEnvMap({}, [{ key: 'SECRET', required: true }]);
    const msg = formatValidationReport(report);
    expect(msg).toContain('Validation failed');
    expect(msg).toContain('SECRET');
  });
});

describe('parseRulesFile', () => {
  it('parses a valid JSON rules array', () => {
    const json = JSON.stringify([{ key: 'FOO', required: true, pattern: '^\\w+$' }]);
    const rules = parseRulesFile(json);
    expect(rules).toHaveLength(1);
    expect(rules[0].key).toBe('FOO');
    expect(rules[0].pattern).toBeInstanceOf(RegExp);
  });

  it('throws on non-array input', () => {
    expect(() => parseRulesFile('{}')).toThrow('must be a JSON array');
  });
});
