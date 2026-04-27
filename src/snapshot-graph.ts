import { Snapshot } from './storage';

export interface GraphNode {
  name: string;
  tags: string[];
  keyCount: number;
  createdAt: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  sharedKeys: number;
  similarity: number;
}

export interface SnapshotGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildSnapshotGraph(snapshots: Record<string, Snapshot>): SnapshotGraph {
  const nodes: GraphNode[] = Object.entries(snapshots).map(([name, snap]) => ({
    name,
    tags: snap.tags ?? [],
    keyCount: Object.keys(snap.env).length,
    createdAt: snap.createdAt,
  }));

  const edges: GraphEdge[] = [];
  const names = Object.keys(snapshots);

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = snapshots[names[i]];
      const b = snapshots[names[j]];
      const keysA = new Set(Object.keys(a.env));
      const keysB = new Set(Object.keys(b.env));
      const shared = [...keysA].filter(k => keysB.has(k)).length;
      const union = new Set([...keysA, ...keysB]).size;
      if (shared === 0) continue;
      const similarity = union > 0 ? shared / union : 0;
      edges.push({ from: names[i], to: names[j], sharedKeys: shared, similarity });
    }
  }

  return { nodes, edges };
}

export function findRelated(graph: SnapshotGraph, name: string, threshold = 0.3): string[] {
  return graph.edges
    .filter(e => (e.from === name || e.to === name) && e.similarity >= threshold)
    .map(e => (e.from === name ? e.to : e.from))
    .sort();
}

export function formatGraph(graph: SnapshotGraph): string {
  const lines: string[] = [];
  lines.push(`Nodes: ${graph.nodes.length}`);
  lines.push(`Edges: ${graph.edges.length}`);
  lines.push('');
  for (const edge of graph.edges.sort((a, b) => b.similarity - a.similarity)) {
    const pct = (edge.similarity * 100).toFixed(1);
    lines.push(`  ${edge.from} <-> ${edge.to}  shared=${edge.sharedKeys}  similarity=${pct}%`);
  }
  return lines.join('\n');
}
