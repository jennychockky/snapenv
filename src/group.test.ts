import {
  createGroup,
  addSnapshotToGroup,
  removeSnapshotFromGroup,
  deleteGroup,
  listGroups,
  formatGroup,
  GroupMap,
} from "./group";

function makeGroups(): GroupMap {
  return {
    staging: createGroup("staging", "Staging env vars"),
    production: createGroup("production"),
  };
}

test("createGroup sets defaults", () => {
  const g = createGroup("dev", "Development");
  expect(g.name).toBe("dev");
  expect(g.description).toBe("Development");
  expect(g.snapshots).toEqual([]);
  expect(g.createdAt).toBeTruthy();
});

test("addSnapshotToGroup adds snapshot", () => {
  const groups = makeGroups();
  const updated = addSnapshotToGroup(groups, "staging", "snap-1");
  expect(updated["staging"].snapshots).toContain("snap-1");
});

test("addSnapshotToGroup is idempotent", () => {
  const groups = makeGroups();
  const once = addSnapshotToGroup(groups, "staging", "snap-1");
  const twice = addSnapshotToGroup(once, "staging", "snap-1");
  expect(twice["staging"].snapshots.length).toBe(1);
});

test("addSnapshotToGroup throws on missing group", () => {
  expect(() => addSnapshotToGroup(makeGroups(), "missing", "snap-1")).toThrow();
});

test("removeSnapshotFromGroup removes snapshot", () => {
  let groups = makeGroups();
  groups = addSnapshotToGroup(groups, "staging", "snap-1");
  groups = removeSnapshotFromGroup(groups, "staging", "snap-1");
  expect(groups["staging"].snapshots).not.toContain("snap-1");
});

test("deleteGroup removes the group", () => {
  const groups = deleteGroup(makeGroups(), "staging");
  expect(groups["staging"]).toBeUndefined();
  expect(groups["production"]).toBeDefined();
});

test("deleteGroup throws on missing group", () => {
  expect(() => deleteGroup(makeGroups(), "nope")).toThrow();
});

test("listGroups returns sorted list", () => {
  const result = listGroups(makeGroups());
  expect(result[0].name).toBe("production");
  expect(result[1].name).toBe("staging");
});

test("formatGroup formats with snapshots", () => {
  let groups = makeGroups();
  groups = addSnapshotToGroup(groups, "staging", "snap-1");
  const out = formatGroup(groups["staging"]);
  expect(out).toContain("[staging]");
  expect(out).toContain("snap-1");
  expect(out).toContain("Staging env vars");
});

test("formatGroup shows empty message", () => {
  const out = formatGroup(makeGroups()["production"]);
  expect(out).toContain("(no snapshots)");
});
