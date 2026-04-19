import { exportSnapshot, importSnapshot, ExportFormat } from './export';
import { EnvMap } from './env';

const sampleEnv: EnvMap = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgres://localhost/mydb',
  SECRET_KEY: 'hello world with spaces',
  PORT: '3000',
};

describe('exportSnapshot', () => {
  it('exports dotenv format', () => {
    const result = exportSnapshot(sampleEnv, 'dotenv');
    expect(result).toContain('NODE_ENV=development');
    expect(result).toContain('PORT=3000');
    expect(result).toContain('SECRET_KEY="hello world with spaces"');
  });

  it('exports json format', () => {
    const result = exportSnapshot(sampleEnv, 'json');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(sampleEnv);
  });

  it('exports shell format', () => {
    const result = exportSnapshot(sampleEnv, 'shell');
    expect(result).toContain('export NODE_ENV=development');
    expect(result).toContain('export PORT=3000');
  });

  it('throws on unknown format', () => {
    expect(() => exportSnapshot(sampleEnv, 'xml' as ExportFormat)).toThrow();
  });
});

describe('importSnapshot', () => {
  it('round-trips dotenv format', () => {
    const exported = exportSnapshot(sampleEnv, 'dotenv');
    const imported = importSnapshot(exported, 'dotenv');
    expect(imported).toEqual(sampleEnv);
  });

  it('round-trips json format', () => {
    const exported = exportSnapshot(sampleEnv, 'json');
    const imported = importSnapshot(exported, 'json');
    expect(imported).toEqual(sampleEnv);
  });

  it('round-trips shell format', () => {
    const exported = exportSnapshot(sampleEnv, 'shell');
    const imported = importSnapshot(exported, 'shell');
    expect(imported).toEqual(sampleEnv);
  });

  it('throws on invalid json', () => {
    expect(() => importSnapshot('[1,2,3]', 'json')).toThrow();
  });
});
