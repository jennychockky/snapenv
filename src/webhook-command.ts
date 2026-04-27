import { Command } from "commander";
import fs from "fs";
import path from "path";
import os from "os";
import {
  WebhookConfig,
  WebhookEvent,
  formatWebhookConfig,
} from "./webhook";

const WEBHOOK_FILE = path.join(os.homedir(), ".snapenv", "webhooks.json");

export function loadWebhooks(): WebhookConfig[] {
  if (!fs.existsSync(WEBHOOK_FILE)) return [];
  return JSON.parse(fs.readFileSync(WEBHOOK_FILE, "utf8"));
}

export function saveWebhooks(hooks: WebhookConfig[]): void {
  fs.mkdirSync(path.dirname(WEBHOOK_FILE), { recursive: true });
  fs.writeFileSync(WEBHOOK_FILE, JSON.stringify(hooks, null, 2));
}

export function registerWebhookCommands(program: Command): void {
  const webhook = program.command("webhook").description("manage webhooks");

  webhook
    .command("add <url>")
    .description("register a new webhook")
    .option("-s, --secret <secret>", "HMAC signing secret")
    .option(
      "-e, --events <events>",
      "comma-separated events (default: all)",
      "snapshot.created,snapshot.deleted,snapshot.restored,snapshot.encrypted,snapshot.expired"
    )
    .action((url: string, opts: { secret?: string; events: string }) => {
      const hooks = loadWebhooks();
      const events = opts.events.split(",").map((e) => e.trim()) as WebhookEvent[];
      const config: WebhookConfig = {
        url,
        secret: opts.secret,
        events,
        enabled: true,
      };
      hooks.push(config);
      saveWebhooks(hooks);
      console.log(`Webhook registered: ${formatWebhookConfig(config)}`);
    });

  webhook
    .command("list")
    .description("list registered webhooks")
    .action(() => {
      const hooks = loadWebhooks();
      if (hooks.length === 0) {
        console.log("No webhooks registered.");
        return;
      }
      hooks.forEach((h, i) => console.log(`[${i}] ${formatWebhookConfig(h)}`));
    });

  webhook
    .command("remove <index>")
    .description("remove a webhook by index")
    .action((indexStr: string) => {
      const hooks = loadWebhooks();
      const idx = parseInt(indexStr, 10);
      if (isNaN(idx) || idx < 0 || idx >= hooks.length) {
        console.error("Invalid webhook index.");
        process.exit(1);
      }
      const [removed] = hooks.splice(idx, 1);
      saveWebhooks(hooks);
      console.log(`Removed webhook: ${removed.url}`);
    });

  webhook
    .command("toggle <index>")
    .description("enable or disable a webhook by index")
    .action((indexStr: string) => {
      const hooks = loadWebhooks();
      const idx = parseInt(indexStr, 10);
      if (isNaN(idx) || idx < 0 || idx >= hooks.length) {
        console.error("Invalid webhook index.");
        process.exit(1);
      }
      hooks[idx].enabled = !hooks[idx].enabled;
      saveWebhooks(hooks);
      const state = hooks[idx].enabled ? "enabled" : "disabled";
      console.log(`Webhook ${idx} ${state}.`);
    });
}
