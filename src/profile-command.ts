import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import {
  ProfileMap,
  createProfile,
  addSnapshotToProfile,
  removeSnapshotFromProfile,
  setActiveSnapshot,
  formatProfile,
} from "./profile";
import { ensureStorageDir } from "./storage";

export function getProfilePath(): string {
  return path.join(ensureStorageDir(), "profiles.json");
}

export function loadProfiles(): ProfileMap {
  const p = getProfilePath();
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf-8")) as ProfileMap;
}

export function saveProfiles(profiles: ProfileMap): void {
  fs.writeFileSync(getProfilePath(), JSON.stringify(profiles, null, 2));
}

export function registerProfileCommands(program: Command): void {
  const prof = program.command("profile").description("Manage snapshot profiles");

  prof
    .command("create <name>")
    .description("Create a new profile")
    .option("-d, --description <desc>", "Profile description")
    .action((name: string, opts: { description?: string }) => {
      const profiles = loadProfiles();
      if (profiles[name]) { console.error(`Profile "${name}" already exists`); process.exit(1); }
      profiles[name] = createProfile(name, opts.description);
      saveProfiles(profiles);
      console.log(`Created profile "${name}"`);
    });

  prof
    .command("add <profile> <snapshot>")
    .description("Add a snapshot to a profile")
    .action((profileName: string, snapshotName: string) => {
      const profiles = loadProfiles();
      if (!profiles[profileName]) { console.error(`Profile "${profileName}" not found`); process.exit(1); }
      profiles[profileName] = addSnapshotToProfile(profiles[profileName], snapshotName);
      saveProfiles(profiles);
      console.log(`Added "${snapshotName}" to profile "${profileName}"`);
    });

  prof
    .command("remove <profile> <snapshot>")
    .description("Remove a snapshot from a profile")
    .action((profileName: string, snapshotName: string) => {
      const profiles = loadProfiles();
      if (!profiles[profileName]) { console.error(`Profile "${profileName}" not found`); process.exit(1); }
      profiles[profileName] = removeSnapshotFromProfile(profiles[profileName], snapshotName);
      saveProfiles(profiles);
      console.log(`Removed "${snapshotName}" from profile "${profileName}"`);
    });

  prof
    .command("use <profile> <snapshot>")
    .description("Set the active snapshot for a profile")
    .action((profileName: string, snapshotName: string) => {
      const profiles = loadProfiles();
      if (!profiles[profileName]) { console.error(`Profile "${profileName}" not found`); process.exit(1); }
      try {
        profiles[profileName] = setActiveSnapshot(profiles[profileName], snapshotName);
        saveProfiles(profiles);
        console.log(`Active snapshot for "${profileName}" set to "${snapshotName}"`);
      } catch (e: any) { console.error(e.message); process.exit(1); }
    });

  prof
    .command("list")
    .description("List all profiles")
    .action(() => {
      const profiles = loadProfiles();
      const names = Object.keys(profiles);
      if (names.length === 0) { console.log("No profiles found."); return; }
      names.forEach((n) => console.log(formatProfile(profiles[n]) + "\n"));
    });

  prof
    .command("delete <name>")
    .description("Delete a profile")
    .action((name: string) => {
      const profiles = loadProfiles();
      if (!profiles[name]) { console.error(`Profile "${name}" not found`); process.exit(1); }
      delete profiles[name];
      saveProfiles(profiles);
      console.log(`Deleted profile "${name}"`);
    });
}
