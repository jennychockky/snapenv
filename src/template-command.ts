import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { loadSnapshots, saveSnapshots } from "./storage";
import { createTemplate, applyTemplate, listTemplateVariables, TemplateMap } from "./template";

const TEMPLATE_FILE = path.join(
  process.env.SNAPENV_DIR || path.join(process.env.HOME || "~", ".snapenv"),
  "templates.json"
);

function loadTemplates(): TemplateMap {
  if (!fs.existsSync(TEMPLATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(TEMPLATE_FILE, "utf-8"));
}

function saveTemplates(templates: TemplateMap): void {
  fs.mkdirSync(path.dirname(TEMPLATE_FILE), { recursive: true });
  fs.writeFileSync(TEMPLATE_FILE, JSON.stringify(templates, null, 2));
}

export function registerTemplateCommands(program: Command): void {
  const tmpl = program.command("template").description("Manage env templates");

  tmpl
    .command("create <templateName> <snapshotName>")
    .description("Create a template from an existing snapshot")
    .option("-d, --description <desc>", "Template description")
    .action((templateName: string, snapshotName: string, opts: { description?: string }) => {
      const snapshots = loadSnapshots();
      const snap = snapshots[snapshotName];
      if (!snap) {
        console.error(`Snapshot '${snapshotName}' not found.`);
        process.exit(1);
      }
      const templates = loadTemplates();
      templates[templateName] = createTemplate(templateName, snap.env, opts.description);
      saveTemplates(templates);
      console.log(`Template '${templateName}' created from snapshot '${snapshotName}'.`);
    });

  tmpl
    .command("apply <templateName> <newSnapshotName>")
    .description("Create a new snapshot from a template")
    .action((templateName: string, newSnapshotName: string) => {
      const templates = loadTemplates();
      const template = templates[templateName];
      if (!template) {
        console.error(`Template '${templateName}' not found.`);
        process.exit(1);
      }
      const env = applyTemplate(template);
      const snapshots = loadSnapshots();
      snapshots[newSnapshotName] = { name: newSnapshotName, env, createdAt: new Date().toISOString() };
      saveSnapshots(snapshots);
      console.log(`Snapshot '${newSnapshotName}' created from template '${templateName}'.`);
    });

  tmpl
    .command("list")
    .description("List all templates")
    .action(() => {
      const templates = loadTemplates();
      const names = Object.keys(templates);
      if (names.length === 0) {
        console.log("No templates found.");
        return;
      }
      names.forEach((name) => {
        const t = templates[name];
        console.log(`${name}${t.description ? ` — ${t.description}` : ""}`);
        console.log(listTemplateVariables(t));
      });
    });
}
