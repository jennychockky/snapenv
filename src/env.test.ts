import { parseEnvString, serializeEnvMap, captureProcessEnv, parseEnvFile } from './env';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('parseEnvString', () => {
  it('parses simple key=value pairs', () => {
    const result = parseEnvString('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores comments and blank lines', () => {
    const result = parseEnvString('# comment\n\nFOO=bar');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('strips double quotes from values', () => {
    const result = parseEnvString('FOO="hello world"');
    expect(result).toEqual({ FOO: 'hello world' });
  });

  it('strips single quotes from values', () => {
    const result = parseEnvString("FOO='hello'");
    expect(result).toEqual({ FOO: 'hello' });
  });

  it('handles values with equals signs', () => {
    const result = parseEnvString('FOO=a=b=c');
    expect(result).toEqual({ FOO: 'a=b=c' });
  });

  it('skips lines without equals sign', () => {
    const result = parseEnvString('INVALID\nFOO=bar');
    expect(result).toEqual({ FOO: 'bar' });
  });
});

describe('serializeEnvMap', () => {
  it('serialises a map to env format', () => {
    const output = serializeEnvMap({ FOO: 'bar', BAZ: 'qux' });
    expect(output).toContain('FOO=bar');
    expect(output).toContain('BAZ=qux');
  });

  it('quotes values containing whitespace', () => {
    const output = serializeEnvMap({ MSG: 'hello world' });
    expect(output).toBe('MSG="hello world"');
  });
});

describe('captureProcessEnv', () => {
  it('captures all env vars when no keys provided', () => {
    const result = captureProcessEnv();
    expect(typeof result).toBe('object');
  });

  it('filters to specified keys', () => {
    process.env.SNAP_TEST_KEY = 'testvalue';
    const result = captureProcessEnv(['SNAP_TEST_KEY']);
    expect(result).toEqual({ SNAP_TEST_KEY: 'testvalue' });
    delete process.env.SNAP_TEST_KEY;
  });

  it('omits keys not present in process.env', () => {
    const result = captureProcessEnv(['DEFINITELY_NOT_SET_XYZ']);
    expect(result).toEqual({});
  });
});

describe('parseEnvFile', () => {
  it('reads and parses a real file', () => {
    const tmpFile = path.join(os.tmpdir(), '.env.snapenv.test');
    fs.writeFileSync(tmpFile, 'FILE_KEY=file_value\n');
    const result = parseEnvFile(tmpFile);
    expect(result).toEqual({ FILE_KEY: 'file_value' });
    fs.unlinkSync(tmpFile);
  });

  it('throws if file does not exist', () => {
    expect(() => parseEnvFile('/nonexistent/.env')).toThrow('Env file not found');
  });
});
