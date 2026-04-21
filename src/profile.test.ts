import {
  createProfile,
  addSnapshotToProfile,
  removeSnapshotFromProfile,
  setActiveSnapshot,
  formatProfile,
} from "./profile";

describe("createProfile", () => {
  it("creates a profile with defaults", () => {
    const p = createProfile("dev", "Development env");
    expect(p.name).toBe("dev");
    expect(p.description).toBe("Development env");
    expect(p.snapshots).toEqual([]);
    expect(p.activeSnapshot).toBeUndefined();
    expect(p.createdAt).toBeTruthy();
  });
});

describe("addSnapshotToProfile", () => {
  it("adds a snapshot", () => {
    const p = createProfile("dev");
    const updated = addSnapshotToProfile(p, "snap1");
    expect(updated.snapshots).toContain("snap1");
  });

  it("does not duplicate snapshots", () => {
    let p = createProfile("dev");
    p = addSnapshotToProfile(p, "snap1");
    p = addSnapshotToProfile(p, "snap1");
    expect(p.snapshots.length).toBe(1);
  });
});

describe("removeSnapshotFromProfile", () => {
  it("removes a snapshot", () => {
    let p = createProfile("dev");
    p = addSnapshotToProfile(p, "snap1");
    p = removeSnapshotFromProfile(p, "snap1");
    expect(p.snapshots).not.toContain("snap1");
  });

  it("clears activeSnapshot if removed", () => {
    let p = createProfile("dev");
    p = addSnapshotToProfile(p, "snap1");
    p = setActiveSnapshot(p, "snap1");
    p = removeSnapshotFromProfile(p, "snap1");
    expect(p.activeSnapshot).toBeUndefined();
  });
});

describe("setActiveSnapshot", () => {
  it("sets the active snapshot", () => {
    let p = createProfile("dev");
    p = addSnapshotToProfile(p, "snap1");
    p = setActiveSnapshot(p, "snap1");
    expect(p.activeSnapshot).toBe("snap1");
  });

  it("throws if snapshot not in profile", () => {
    const p = createProfile("dev");
    expect(() => setActiveSnapshot(p, "missing")).toThrow();
  });
});

describe("formatProfile", () => {
  it("returns a formatted string", () => {
    let p = createProfile("dev", "My dev profile");
    p = addSnapshotToProfile(p, "snap1");
    const out = formatProfile(p);
    expect(out).toContain("dev");
    expect(out).toContain("My dev profile");
    expect(out).toContain("snap1");
  });
});
