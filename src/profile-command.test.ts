import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { registerProfileCommands, getProfilePath, loadProfiles, saveProfiles } from "./profile-command";

function makeTmp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "snapenv-profile-"));
  process.env.SNAPENV_DIR = dir;
  return dir;
}

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerProfileCommands(program);
  return program;
}

afterEach(() => { delete process.env.SNAPENV_DIR; });

describe("profile create", () => {
  it("creates a profile", () => {
    makeTmp();
    const program = makeProgram();
    program.parse(["node", "cli", "profile", "create", "dev", "-d", "Dev env"]);
    const profiles = loadProfiles();
    expect(profiles["dev"]).toBeDefined();
    expect(profiles["dev"].description).toBe("Dev env");
  });

  it("errors on duplicate profile", () => {
    makeTmp();
    const program = makeProgram();
    program.parse(["node", "cli", "profile", "create", "dev"]);
    expect(() =>
      program.parse(["node", "cli", "profile", "create", "dev"])
    ).toThrow();
  });
});

describe("profile add / remove", () => {
  it("adds and removes a snapshot", () => {
    makeTmp();
    const program = makeProgram();
    program.parse(["node", "cli", "profile", "create", "dev"]);
    program.parse(["node", "cli", "profile", "add", "dev", "snap1"]);
    expect(loadProfiles()["dev"].snapshots).toContain("snap1");
    program.parse(["node", "cli", "profile", "remove", "dev", "snap1"]);
    expect(loadProfiles()["dev"].snapshots).not.toContain("snap1");
  });
});

describe("profile use", () => {
  it("sets active snapshot", () => {
    makeTmp();
    const program = makeProgram();
    program.parse(["node", "cli", "profile", "create", "dev"]);
    program.parse(["node", "cli", "profile", "add", "dev", "snap1"]);
    program.parse(["node", "cli", "profile", "use", "dev", "snap1"]);
    expect(loadProfiles()["dev"].activeSnapshot).toBe("snap1");
  });
});

describe("profile delete", () => {
  it("deletes a profile", () => {
    makeTmp();
    const program = makeProgram();
    program.parse(["node", "cli", "profile", "create", "dev"]);
    program.parse(["node", "cli", "profile", "delete", "dev"]);
    expect(loadProfiles()["dev"]).toBeUndefined();
  });
});
