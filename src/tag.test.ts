import { addTag, removeTag, listTags, findByTag } from './tag';
import * as storage from './storage';

const mockSnapshots: Record<string, any> = {
  dev: { env: { NODE_ENV: 'development' }, tags: ['local'] },
  prod: { env: { NODE_ENV: 'production' }, tags: [] },
};

beforeEach(() => {
  jest.spyOn(storage, 'loadSnapshots').mockReturnValue(structuredClone(mockSnapshots));
  jest.spyOn(storage, 'saveSnapshots').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('addTag', () => {
  it('adds a new tag to a snapshot', () => {
    addTag('dev', 'backend');
    expect(storage.saveSnapshots).toHaveBeenCalledWith(
      expect.objectContaining({
        dev: expect.objectContaining({ tags: expect.arrayContaining(['local', 'backend']) }),
      })
    );
  });

  it('does not duplicate existing tags', () => {
    addTag('dev', 'local');
    const saved = (storage.saveSnapshots as jest.Mock).mock.calls[0]?.[0];
    expect(saved?.dev.tags.filter((t: string) => t === 'local').length).toBe(1);
  });

  it('throws if snapshot not found', () => {
    expect(() => addTag('missing', 'x')).toThrow("Snapshot 'missing' not found");
  });
});

describe('removeTag', () => {
  it('removes an existing tag', () => {
    removeTag('dev', 'local');
    const saved = (storage.saveSnapshots as jest.Mock).mock.calls[0]?.[0];
    expect(saved?.dev.tags).not.toContain('local');
  });
});

describe('listTags', () => {
  it('returns tags for a snapshot', () => {
    expect(listTags('dev')).toEqual(['local']);
  });

  it('returns empty array when no tags', () => {
    expect(listTags('prod')).toEqual([]);
  });
});

describe('findByTag', () => {
  it('returns snapshot names matching a tag', () => {
    expect(findByTag('local')).toContain('dev');
    expect(findByTag('local')).not.toContain('prod');
  });

  it('returns empty array when no matches', () => {
    expect(findByTag('nonexistent')).toEqual([]);
  });
});
