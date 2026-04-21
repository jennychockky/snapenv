import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addAlias, removeAlias, resolveAlias, listAliases } from './alias';
import * as storage from './storage';

const mockData = () => ({
  snapshots: { prod: { NODE_ENV: 'production' }, dev: { NODE_ENV: 'development' } },
  aliases: {} as Record<string, string>,
});

describe('alias', () => {
  beforeEach(() => {
    vi.spyOn(storage, 'saveSnapshots').mockImplementation(() => {});
  });

  it('addAlias creates alias for existing snapshot', () => {
    const data = mockData();
    vi.spyOn(storage, 'loadSnapshots').mockReturnValue(data as any);
    addAlias('p', 'prod', '/tmp');
    expect(storage.saveSnapshots).toHaveBeenCalledWith('/tmp', expect.objectContaining({
      aliases: { p: 'prod' },
    }));
  });

  it('addAlias throws if snapshot does not exist', () => {
    vi.spyOn(storage, 'loadSnapshots').mockReturnValue(mockData() as any);
    expect(() => addAlias('x', 'missing', '/tmp')).toThrow("Snapshot 'missing' does not exist");
  });

  it('addAlias throws if alias already exists', () => {
    const data = { ...mockData(), aliases: { p: 'prod' } };
    vi.spyOn(storage, 'loadSnapshots').mockReturnValue(data as any);
    expect(() => addAlias('p', 'dev', '/tmp')).toThrow("Alias 'p' already exists");
  });

  it('removeAlias deletes existing alias', () => {
    const data = { ...mockData(), aliases: { p: 'prod' } };
    vi.spyOn(storage, 'loadSnapshots').mockReturnValue(data as any);
    removeAlias('p', '/tmp');
    expect(storage.saveSnapshots).toHaveBeenCalledWith('/tmp', expect.objectContaining({
      aliases: {},
    }));
  });

  it('removeAlias throws if alias does not exist', () => {
    vi.spyOn(storage, 'loadSnapshots').mockReturnValue(mockData() as any);
    expect(() => removeAlias('nope', '/tmp')).toThrow("Alias 'nope' does not exist");
  });

  it('resolveAlias returns snapshot name for known alias', () => {
    const data = { ...mockData(), aliases: { p: 'prod' } };
    vi.spyOn(storage, 'loadSnapshots').mockReturnValue(data as any);
    expect(resolveAlias('p', '/tmp')).toBe('prod');
  });

  it('resolveAlias returns input unchanged if not an alias', () => {
    vi.spyOn(storage, 'loadSnapshots').mockReturnValue(mockData() as any);
    expect(resolveAlias('prod', '/tmp')).toBe('prod');
  });

  it('listAliases returns all aliases', () => {
    const data = { ...mockData(), aliases: { p: 'prod', d: 'dev' } };
    vi.spyOn(storage, 'loadSnapshots').mockReturnValue(data as any);
    expect(listAliases('/tmp')).toEqual({ p: 'prod', d: 'dev' });
  });

  it('listAliases returns empty object when no aliases exist', () => {
    vi.spyOn(storage, 'loadSnapshots').mockReturnValue(mockData() as any);
    expect(listAliases('/tmp')).toEqual({});
  });
});
