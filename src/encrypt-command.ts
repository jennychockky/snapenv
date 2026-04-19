import { Command } from 'commander';
import * as readline from 'readline';
import { loadSnapshots, saveSnapshots } from './storage';
import { encryptSnapshot, decryptSnapshot } from './encrypt-storage';

function promptPassphrase(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerEncryptCommands(program: Command): void {
  program
    .command('encrypt <name>')
    .description('Encrypt a stored snapshot')
    .action(async (name: string) => {
      const snapshots = await loadSnapshots();
      const snapshot = snapshots[name];
      if (!snapshot) return console.error(`Snapshot "${name}" not found.`);
      if (snapshot.encrypted) return console.log(`Snapshot "${name}" is already encrypted.`);
      const passphrase = await promptPassphrase('Enter passphrase: ');
      snapshots[name] = encryptSnapshot(snapshot, passphrase);
      await saveSnapshots(snapshots);
      console.log(`Snapshot "${name}" encrypted.`);
    });

  program
    .command('decrypt <name>')
    .description('Decrypt a stored snapshot')
    .action(async (name: string) => {
      const snapshots = await loadSnapshots();
      const snapshot = snapshots[name];
      if (!snapshot) return console.error(`Snapshot "${name}" not found.`);
      if (!snapshot.encrypted) return console.log(`Snapshot "${name}" is not encrypted.`);
      const passphrase = await promptPassphrase('Enter passphrase: ');
      try {
        snapshots[name] = decryptSnapshot(snapshot, passphrase);
        await saveSnapshots(snapshots);
        console.log(`Snapshot "${name}" decrypted.`);
      } catch {
        console.error('Decryption failed: wrong passphrase or corrupted data.');
      }
    });
}
