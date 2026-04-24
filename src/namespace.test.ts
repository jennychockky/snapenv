import {
  parseNamespacedKey,
  buildNamespacedKey,
  listNamespaces,
  filterByNamespace,
  stripNamespace,
} from './namespace';

describe('parseNamespacedKey', () => {
  it('parses a namespaced key', () => {
    expect(parseNamespacedKey('myproject/prod')).toEqual({
      namespace: 'myproject',
      name: 'prod',
    });
  });

  it('defaults to "default" namespace when no slash', () => {
    expect(parseNamespacedKey('prod')).toEqual({
      namespace: 'default',
      name: 'prod',
    });
  });

  it('throws on empty namespace segment', () => {
    expect(() => parseNamespacedKey('/name')).toThrow();
  });

  it('throws on empty name segment', () => {
    expect(() => parseNamespacedKey('ns/')).toThrow();
  });
});

describe('buildNamespacedKey', () => {
  it('builds a namespaced key', () => {
    expect(buildNamespacedKey('myproject', 'staging')).toBe('myproject/staging');
  });

  it('throws when namespace is empty', () => {
    expect(() => buildNamespacedKey('', 'staging')).toThrow();
  });

  it('throws when name is empty', () => {
    expect(() => buildNamespacedKey('ns', '')).toThrow();
  });
});

describe('listNamespaces', () => {
  it('returns unique sorted namespaces', () => {
    const keys = ['alpha/prod', 'beta/dev', 'alpha/staging', 'plain'];
    expect(listNamespaces(keys)).toEqual(['alpha', 'beta', 'default']);
  });

  it('returns empty array for no keys', () => {
    expect(listNamespaces([])).toEqual([]);
  });
});

describe('filterByNamespace', () => {
  const keys = ['alpha/prod', 'alpha/staging', 'beta/dev', 'plain'];

  it('filters keys by namespace', () => {
    expect(filterByNamespace(keys, 'alpha')).toEqual(['alpha/prod', 'alpha/staging']);
  });

  it('returns plain keys under "default" namespace', () => {
    expect(filterByNamespace(keys, 'default')).toEqual(['plain']);
  });

  it('returns empty when namespace not found', () => {
    expect(filterByNamespace(keys, 'gamma')).toEqual([]);
  });
});

describe('stripNamespace', () => {
  it('strips the namespace prefix', () => {
    expect(stripNamespace('myproject/prod')).toBe('prod');
  });

  it('returns the key itself when no namespace', () => {
    expect(stripNamespace('prod')).toBe('prod');
  });
});
