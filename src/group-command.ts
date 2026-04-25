import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import {
  GroupMap,
  createGroup,
  addSnapshotToGroup,
  removeSnapshotFromGroup,
  deleteGroup,
  listGroups,
  formatGroup,
} from "./group";

export function getGroupPath(dir: string): string {
  return path.join(dir, "groups.json");
}

export function loadGroups(dir: string): GroupMap {
  const p = getGroupPath(dir);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function saveGroups(dir: string, groups: GroupMap): void {
  fs.writeFileSync(getGroupPath(dir), JSON.stringify(groups, null, 2));
}

export function registerGroupCommands(program: Command, storageDir: string): void {
  const grp = program.command("group").description("Manage snapshot groups");

  grp
    .command("create <name>")
    .description("Create a new group")
    .option("-d, --description <desc>", "Group description")
    .action((name: string, opts: { description?: string }) => {
      const groups = loadGroups(storageDir);
      if (groups[name]) {
        console.error(`Group "${name}" already exists`);
        process.exit(1);
      }
      saveGroups(storageDir, { ...groups, [name]: createGroup(name, opts.description) });
      console.log(`Created group "${name}"`);
    });

  grp
    .command("add <group> <snapshot>")
    .description("Add a snapshot to a group")
    .action((groupName: string, snapshotName: string) => {
      const groups = loadGroups(storageDir);
      saveGroups(storageDir, addSnapshotToGroup(groups, groupName, snapshotName));
      console.log(`Added "${snapshotName}" to group "${groupName}"`);
    });

  grp
    .command("remove <group> <snapshot>")
    .description("Remove a snapshot from a group")
    .action((groupName: string, snapshotName: string) => {
      const groups = loadGroups(storageDir);
      saveGroups(storageDir, removeSnapshotFromGroup(groups, groupName, snapshotName));
      console.log(`Removed "${snapshotName}" from group "${groupName}"`);
    });

  grp
    .command("delete <name>")
    .description("Delete a group")
    .action((name: string) => {
      const groups = loadGroups(storageDir);
      saveGroups(storageDir, deleteGroup(groups, name));
      console.log(`Deleted group "${name}"`);
    });

  grp
    .command("list")
    .description("List all groups")
    .action(() => {
      const groups = loadGroups(storageDir);
      const all = listGroups(groups);
      if (all.length === 0) { console.log("No groups defined."); return; }
      all.forEach((g) => console.log(formatGroup(g) + "\n"));
    });

  grp
    .command("show <name>")
    .description("Show details of a group")
    .action((name: string) => {
      const groups = loadGroups(storageDir);
      if (!groups[name]) { console.error(`Group "${name}" not found`); process.exit(1); }
      console.log(formatGroup(groups[name]));
    });
}
