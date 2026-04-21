export interface Profile {
  name: string;
  description?: string;
  snapshots: string[];
  activeSnapshot?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProfileMap = Record<string, Profile>;

export function createProfile(
  name: string,
  description?: string
): Profile {
  const now = new Date().toISOString();
  return { name, description, snapshots: [], createdAt: now, updatedAt: now };
}

export function addSnapshotToProfile(
  profile: Profile,
  snapshotName: string
): Profile {
  if (profile.snapshots.includes(snapshotName)) return profile;
  return {
    ...profile,
    snapshots: [...profile.snapshots, snapshotName],
    updatedAt: new Date().toISOString(),
  };
}

export function removeSnapshotFromProfile(
  profile: Profile,
  snapshotName: string
): Profile {
  return {
    ...profile,
    snapshots: profile.snapshots.filter((s) => s !== snapshotName),
    activeSnapshot:
      profile.activeSnapshot === snapshotName
        ? undefined
        : profile.activeSnapshot,
    updatedAt: new Date().toISOString(),
  };
}

export function setActiveSnapshot(
  profile: Profile,
  snapshotName: string
): Profile {
  if (!profile.snapshots.includes(snapshotName)) {
    throw new Error(
      `Snapshot "${snapshotName}" is not part of profile "${profile.name}"`
    );
  }
  return { ...profile, activeSnapshot: snapshotName, updatedAt: new Date().toISOString() };
}

export function formatProfile(profile: Profile): string {
  const lines: string[] = [
    `Profile: ${profile.name}`,
    profile.description ? `  Description: ${profile.description}` : "",
    `  Snapshots (${profile.snapshots.length}): ${profile.snapshots.join(", ") || "none"}`,
    `  Active: ${profile.activeSnapshot ?? "none"}`,
    `  Created: ${profile.createdAt}`,
    `  Updated: ${profile.updatedAt}`,
  ];
  return lines.filter(Boolean).join("\n");
}
