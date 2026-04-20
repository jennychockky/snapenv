import { restoreSnapshot, formatRestoreResult } from './restore';
import * as storage from './storage';
import * as snapshot from './snapshot';
import * as alias from './alias';
import * as expire from './expire';

jest.mock('./storage');
jest.mock('./snapshot');
jest.mock('./alias');
jest.mock('./expire');
jest.mock('./encrypt-storage');

const mockGetSnapshot = storage.getSnapshot as jest.Mock;
const mockApplySnapshot = snapshot.applySnapshot as jest.Mock;
const mockResolveAlias = alias.resolveAlias as jest.Mock;
const mockIsExpired = expire.isExpired as jest.Mock;

const baseSnapshot = { name: 'dev', env: { FOO: 'bar', BAZ: 'qux' }, encrypted: false };

beforeEach(() => {
  jest.clearAllMocks();
  mockResolveAlias.mockReturnValue(null);
  mockIsExpired.mockReturnValue(false);
  mockGetSnapshot.mockReturnValue(baseSnapshot);
  mockApplySnapshot.mockReturnValue({ FOO: 'bar', BAZ: 'qux' });
  delete process.env.FOO;
  delete process.env.BAZ;
});

test('restores env vars from snapshot', async () => {
  const result = await restoreSnapshot('dev');
  expect(result.applied).toEqual({ FOO: 'bar', BAZ: 'qux' });
  expect(process.env.FOO).toBe('bar');
  expect(process.env.BAZ).toBe('qux');
});

test('resolves alias before restoring', async () => {
  mockResolveAlias.mockReturnValue('development');
  mockGetSnapshot.mockReturnValue({ ...baseSnapshot, name: 'development' });
  await restoreSnapshot('dev');
  expect(mockGetSnapshot).toHaveBeenCalledWith('development');
});

test('throws if snapshot not found', async () => {
  mockGetSnapshot.mockReturnValue(undefined);
  await expect(restoreSnapshot('missing')).rejects.toThrow('not found');
});

test('throws if snapshot is expired without force', async () => {
  mockIsExpired.mockReturnValue(true);
  await expect(restoreSnapshot('dev')).rejects.toThrow('expired');
});

test('restores expired snapshot with force and adds warning', async () => {
  mockIsExpired.mockReturnValue(true);
  const result = await restoreSnapshot('dev', { force: true });
  expect(result.warnings).toContain(expect.stringContaining('expired'));
  expect(result.applied).toEqual({ FOO: 'bar', BAZ: 'qux' });
});

test('dry run does not mutate process.env', async () => {
  await restoreSnapshot('dev', { dryRun: true });
  expect(process.env.FOO).toBeUndefined();
});

test('formatRestoreResult returns correct summary', () => {
  const result = { applied: { A: '1', B: '2' }, skipped: [], warnings: [] };
  expect(formatRestoreResult(result)).toContain('2 variables');
});

test('formatRestoreResult includes warnings and skipped', () => {
  const result = { applied: { A: '1' }, skipped: ['B'], warnings: ['expired'] };
  const output = formatRestoreResult(result);
  expect(output).toContain('expired');
  expect(output).toContain('Skipped: B');
});
