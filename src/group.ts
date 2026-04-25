export interface SnapshotGroup {
  name: string;
  description?: string;
  snapshots: string[];
  createdAt: string;
  updatedAt: string;
}

export type GroupMap = Record<string, SnapshotGroup>;

export function createGroup(
  name: string,
  description?: string
): SnapshotGroup {
  const now = new Date().toISOString();
  return { name, description, snapshots: [], createdAt: now, updatedAt: now };
}

export function addSnapshotToGroup(
  groups: GroupMap,
  groupName: string,
  snapshotName: string
): GroupMap {
  const group = groups[groupName];
  if (!group) throw new Error(`Group "${groupName}" not found`);
  if (group.snapshots.includes(snapshotName)) return groups;
  return {
    ...groups,
    [groupName]: {
      ...group,
      snapshots: [...group.snapshots, snapshotName],
      updatedAt: new Date().toISOString(),
    },
  };
}

export function removeSnapshotFromGroup(
  groups: GroupMap,
  groupName: string,
  snapshotName: string
): GroupMap {
  const group = groups[groupName];
  if (!group) throw new Error(`Group "${groupName}" not found`);
  return {
    ...groups,
    [groupName]: {
      ...group,
      snapshots: group.snapshots.filter((s) => s !== snapshotName),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function deleteGroup(groups: GroupMap, groupName: string): GroupMap {
  if (!groups[groupName]) throw new Error(`Group "${groupName}" not found`);
  const next = { ...groups };
  delete next[groupName];
  return next;
}

export function listGroups(groups: GroupMap): SnapshotGroup[] {
  return Object.values(groups).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function formatGroup(group: SnapshotGroup): string {
  const desc = group.description ? ` — ${group.description}` : "";
  const snaps =
    group.snapshots.length > 0
      ? group.snapshots.map((s) => `  • ${s}`).join("\n")
      : "  (no snapshots)";
  return `[${group.name}]${desc}\n${snaps}`;
}
