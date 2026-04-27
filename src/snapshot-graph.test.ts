import { buildSnapshotGraph, findRelated, formatGraph } from './snapshot-graph';
import { Snapshot } from './storage';

function makeSnapshot(env: Record<string, string>): Snapshot {
  return { env, createdAt: new Date().toISOString(), tags: [] };
}

const snapshots = {
  alpha: makeSnapshot({ A: '1', B: '2', C: '3' }),
  beta: makeSnapshot({ A: '1', B: '2', D: '4' }),
  gamma: makeSnapshot({ X: '9', Y: '8' }),
  delta: makeSnapshot({ A: '1', C: '3', E: '5' }),
};

describe('buildSnapshotGraph', () => {
  it('creates a node per snapshot', () => {
    const graph = buildSnapshotGraph(snapshots);
    expect(graph.nodes).toHaveLength(4);
    const names = graph.nodes.map(n => n.name);
    expect(names).toContain('alpha');
    expect(names).toContain('gamma');
  });

  it('creates edges only for snapshots with shared keys', () => {
    const graph = buildSnapshotGraph(snapshots);
    const involvedNames = new Set(graph.edges.flatMap(e => [e.from, e.to]));
    expect(involvedNames).not.toContain('gamma');
  });

  it('computes similarity correctly', () => {
    const graph = buildSnapshotGraph(snapshots);
    const edge = graph.edges.find(
      e => (e.from === 'alpha' && e.to === 'beta') || (e.from === 'beta' && e.to === 'alpha')
    );
    expect(edge).toBeDefined();
    // shared: A, B = 2; union: A, B, C, D = 4; similarity = 0.5
    expect(edge!.sharedKeys).toBe(2);
    expect(edge!.similarity).toBeCloseTo(0.5);
  });

  it('populates keyCount on nodes', () => {
    const graph = buildSnapshotGraph(snapshots);
    const alphaNode = graph.nodes.find(n => n.name === 'alpha');
    expect(alphaNode?.keyCount).toBe(3);
  });
});

describe('findRelated', () => {
  it('returns related snapshots above threshold', () => {
    const graph = buildSnapshotGraph(snapshots);
    const related = findRelated(graph, 'alpha', 0.3);
    expect(related).toContain('beta');
    expect(related).toContain('delta');
    expect(related).not.toContain('gamma');
  });

  it('returns empty array when no related snapshots', () => {
    const graph = buildSnapshotGraph(snapshots);
    const related = findRelated(graph, 'gamma', 0.1);
    expect(related).toHaveLength(0);
  });
});

describe('formatGraph', () => {
  it('includes node and edge counts', () => {
    const graph = buildSnapshotGraph(snapshots);
    const output = formatGraph(graph);
    expect(output).toMatch(/Nodes: 4/);
    expect(output).toMatch(/Edges:/);
  });

  it('includes similarity percentages', () => {
    const graph = buildSnapshotGraph(snapshots);
    const output = formatGraph(graph);
    expect(output).toMatch(/similarity=\d+\.\d+%/);
  });
});
