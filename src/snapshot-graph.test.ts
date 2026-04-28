import { buildSnapshotGraph, findRelated, formatGraph } from './snapshot-graph';

function makeSnapshot(name: string, overrides: Record<string, unknown> = {}) {
  return {
    name,
    createdAt: new Date().toISOString(),
    env: { KEY: 'value' },
    tags: [] as string[],
    ...overrides,
  };
}

describe('buildSnapshotGraph', () => {
  it('builds a graph with nodes for each snapshot', () => {
    const snapshots = [
      makeSnapshot('alpha'),
      makeSnapshot('beta'),
      makeSnapshot('gamma'),
    ];
    const graph = buildSnapshotGraph(snapshots);
    expect(graph.nodes).toHaveLength(3);
    expect(graph.nodes.map((n) => n.name)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('links snapshots that share tags', () => {
    const snapshots = [
      makeSnapshot('alpha', { tags: ['prod'] }),
      makeSnapshot('beta', { tags: ['prod'] }),
      makeSnapshot('gamma', { tags: ['dev'] }),
    ];
    const graph = buildSnapshotGraph(snapshots);
    const alphaEdges = graph.edges.filter(
      (e) => e.from === 'alpha' || e.to === 'alpha'
    );
    expect(alphaEdges.length).toBeGreaterThan(0);
    const betaLinked = alphaEdges.some(
      (e) => e.from === 'beta' || e.to === 'beta'
    );
    expect(betaLinked).toBe(true);
  });

  it('links snapshots that share env keys', () => {
    const snapshots = [
      makeSnapshot('alpha', { env: { DB_URL: 'postgres://a', PORT: '3000' } }),
      makeSnapshot('beta', { env: { DB_URL: 'postgres://b', HOST: 'localhost' } }),
      makeSnapshot('gamma', { env: { HOST: 'example.com' } }),
    ];
    const graph = buildSnapshotGraph(snapshots);
    const alphaEdges = graph.edges.filter(
      (e) => e.from === 'alpha' || e.to === 'alpha'
    );
    expect(alphaEdges.some((e) => e.from === 'beta' || e.to === 'beta')).toBe(true);
  });

  it('returns empty edges for a single snapshot', () => {
    const snapshots = [makeSnapshot('solo')];
    const graph = buildSnapshotGraph(snapshots);
    expect(graph.edges).toHaveLength(0);
  });
});

describe('findRelated', () => {
  it('returns snapshots related to a given snapshot by tag', () => {
    const snapshots = [
      makeSnapshot('alpha', { tags: ['prod'] }),
      makeSnapshot('beta', { tags: ['prod'] }),
      makeSnapshot('gamma', { tags: ['dev'] }),
    ];
    const graph = buildSnapshotGraph(snapshots);
    const related = findRelated('alpha', graph);
    expect(related).toContain('beta');
    expect(related).not.toContain('gamma');
  });

  it('returns empty array for unknown snapshot', () => {
    const snapshots = [makeSnapshot('alpha')];
    const graph = buildSnapshotGraph(snapshots);
    const related = findRelated('nonexistent', graph);
    expect(related).toEqual([]);
  });
});

describe('formatGraph', () => {
  it('formats a graph as a human-readable string', () => {
    const snapshots = [
      makeSnapshot('alpha', { tags: ['prod'] }),
      makeSnapshot('beta', { tags: ['prod'] }),
    ];
    const graph = buildSnapshotGraph(snapshots);
    const output = formatGraph(graph);
    expect(output).toContain('alpha');
    expect(output).toContain('beta');
  });

  it('indicates isolated nodes', () => {
    const snapshots = [makeSnapshot('solo')];
    const graph = buildSnapshotGraph(snapshots);
    const output = formatGraph(graph);
    expect(output).toContain('solo');
  });
});
