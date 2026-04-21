import {
  lockSnapshot,
  unlockSnapshot,
  isLocked,
  listLocks,
  formatLocks,
  LockMap,
} from "./lock";

const empty: LockMap = {};

describe("lockSnapshot", () => {
  it("adds a lock entry", () => {
    const result = lockSnapshot(empty, "prod");
    expect(result["prod"]).toBeDefined();
    expect(result["prod"].name).toBe("prod");
    expect(result["prod"].reason).toBeUndefined();
  });

  it("stores optional reason", () => {
    const result = lockSnapshot(empty, "prod", "do not modify");
    expect(result["prod"].reason).toBe("do not modify");
  });

  it("throws if already locked", () => {
    const locked = lockSnapshot(empty, "prod");
    expect(() => lockSnapshot(locked, "prod")).toThrow(/already locked/);
  });
});

describe("unlockSnapshot", () => {
  it("removes the lock entry", () => {
    const locked = lockSnapshot(empty, "prod");
    const result = unlockSnapshot(locked, "prod");
    expect(result["prod"]).toBeUndefined();
  });

  it("throws if not locked", () => {
    expect(() => unlockSnapshot(empty, "prod")).toThrow(/not locked/);
  });
});

describe("isLocked", () => {
  it("returns true when locked", () => {
    const locked = lockSnapshot(empty, "staging");
    expect(isLocked(locked, "staging")).toBe(true);
  });

  it("returns false when not locked", () => {
    expect(isLocked(empty, "staging")).toBe(false);
  });
});

describe("listLocks", () => {
  it("returns sorted list of locked snapshots", () => {
    let locks = lockSnapshot(empty, "a");
    locks = lockSnapshot(locks, "b");
    const list = listLocks(locks);
    expect(list.map((l) => l.name)).toEqual(["a", "b"]);
  });

  it("returns empty array when no locks", () => {
    expect(listLocks(empty)).toEqual([]);
  });
});

describe("formatLocks", () => {
  it("returns message when no locks", () => {
    expect(formatLocks(empty)).toBe("No locked snapshots.");
  });

  it("formats lock entries", () => {
    const locks = lockSnapshot(empty, "prod", "stable release");
    const output = formatLocks(locks);
    expect(output).toContain("prod");
    expect(output).toContain("stable release");
    expect(output).toContain("🔒");
  });
});
