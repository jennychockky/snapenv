import {
  createLabel,
  setLabel,
  removeLabel,
  getLabels,
  findByLabel,
  formatLabels,
  LabelStore,
} from './snapshot-label';

describe('createLabel', () => {
  it('creates a valid label', () => {
    expect(createLabel('env', 'production')).toEqual({ key: 'env', value: 'production' });
  });

  it('throws on invalid key', () => {
    expect(() => createLabel('bad key!', 'val')).toThrow('Invalid label key');
  });
});

describe('setLabel', () => {
  it('adds a new label', () => {
    const store = setLabel({}, 'snap1', 'env', 'dev');
    expect(store['snap1']).toEqual([{ key: 'env', value: 'dev' }]);
  });

  it('updates an existing label', () => {
    let store: LabelStore = {};
    store = setLabel(store, 'snap1', 'env', 'dev');
    store = setLabel(store, 'snap1', 'env', 'prod');
    expect(store['snap1']).toHaveLength(1);
    expect(store['snap1'][0].value).toBe('prod');
  });

  it('adds multiple labels', () => {
    let store: LabelStore = {};
    store = setLabel(store, 'snap1', 'env', 'dev');
    store = setLabel(store, 'snap1', 'team', 'backend');
    expect(store['snap1']).toHaveLength(2);
  });
});

describe('removeLabel', () => {
  it('removes an existing label', () => {
    let store = setLabel({}, 'snap1', 'env', 'dev');
    store = removeLabel(store, 'snap1', 'env');
    expect(store['snap1']).toHaveLength(0);
  });

  it('is a no-op for missing label', () => {
    const store = removeLabel({}, 'snap1', 'env');
    expect(store['snap1']).toEqual([]);
  });
});

describe('findByLabel', () => {
  it('finds snapshots by key only', () => {
    let store: LabelStore = {};
    store = setLabel(store, 'snap1', 'env', 'dev');
    store = setLabel(store, 'snap2', 'env', 'prod');
    expect(findByLabel(store, 'env')).toEqual(expect.arrayContaining(['snap1', 'snap2']));
  });

  it('finds snapshots by key and value', () => {
    let store: LabelStore = {};
    store = setLabel(store, 'snap1', 'env', 'dev');
    store = setLabel(store, 'snap2', 'env', 'prod');
    expect(findByLabel(store, 'env', 'dev')).toEqual(['snap1']);
  });
});

describe('formatLabels', () => {
  it('formats labels', () => {
    expect(formatLabels([{ key: 'env', value: 'dev' }])).toBe('env=dev');
  });

  it('returns placeholder when empty', () => {
    expect(formatLabels([])).toBe('(no labels)');
  });
});

describe('getLabels', () => {
  it('returns empty array for unknown snapshot', () => {
    expect(getLabels({}, 'missing')).toEqual([]);
  });
});
