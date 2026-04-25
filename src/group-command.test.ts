import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { registerGroupCommands, loadGroups, saveGroups } from "./group-command";
import { createGroup, addSnapshotToGroup } from "./group";

function makeTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "snapenv-group-"));
}

function makeProgram(dir: string): Command {
  const p = new Command();
  p.exitOverride();
  registerGroupCommands(p, dir);
  return p;
}

test("create adds a group", () => {
  const dir = makeTmp();
  const p = makeProgram(dir);
  p.parse(["node", "cli", "group", "create", "dev", "--description", "Dev group"]);
  const groups = loadGroups(dir);
  expect(groups["dev"]).toBeDefined();
  expect(groups["dev"].description).toBe("Dev group");
});

test("create fails if group exists", () => {
  const dir = makeTmp();
  const p = makeProgram(dir);
  p.parse(["node", "cli", "group", "create", "dev"]);
  expect(() =>
    p.parse(["node", "cli", "group", "create", "dev"])
  ).toThrow();
});

test("add puts snapshot in group", () => {
  const dir = makeTmp();
  saveGroups(dir, { dev: createGroup("dev") });
  const p = makeProgram(dir);
  p.parse(["node", "cli", "group", "add", "dev", "snap-1"]);
  const groups = loadGroups(dir);
  expect(groups["dev"].snapshots).toContain("snap-1");
});

test("remove takes snapshot out of group", () => {
  const dir = makeTmp();
  let groups = { dev: createGroup("dev") };
  groups = addSnapshotToGroup(groups, "dev", "snap-1") as typeof groups;
  saveGroups(dir, groups);
  const p = makeProgram(dir);
  p.parse(["node", "cli", "group", "remove", "dev", "snap-1"]);
  const loaded = loadGroups(dir);
  expect(loaded["dev"].snapshots).not.toContain("snap-1");
});

test("delete removes the group", () => {
  const dir = makeTmp();
  saveGroups(dir, { dev: createGroup("dev") });
  const p = makeProgram(dir);
  p.parse(["node", "cli", "group", "delete", "dev"]);
  const groups = loadGroups(dir);
  expect(groups["dev"]).toBeUndefined();
});

test("list prints nothing for empty", () => {
  const dir = makeTmp();
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  const p = makeProgram(dir);
  p.parse(["node", "cli", "group", "list"]);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining("No groups"));
  spy.mockRestore();
});

test("show prints group details", () => {
  const dir = makeTmp();
  saveGroups(dir, { prod: createGroup("prod", "Production") });
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});
  const p = makeProgram(dir);
  p.parse(["node", "cli", "group", "show", "prod"]);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining("prod"));
  spy.mockRestore();
});
