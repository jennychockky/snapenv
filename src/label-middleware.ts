import { Command } from 'commander';
import { loadLabels, getLabelPath } from './label-command';
import { getLabels, formatLabels } from './snapshot-label';

/**
 * Registers a --show-labels flag on commands that accept a snapshot name.
 * When present, the labels for the snapshot are printed after the command output.
 */
export function registerLabelMiddleware(program: Command, storageDir: string): void {
  program.hook('postAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (!opts.showLabels) return;
    const args = thisCommand.args;
    const snapshotName = args[0];
    if (!snapshotName) return;
    const store = loadLabels(storageDir);
    const labels = getLabels(store, snapshotName);
    console.log(`Labels for "${snapshotName}": ${formatLabels(labels)}`);
  });
}

/**
 * Returns a hint string for the --show-labels flag, useful in command descriptions.
 */
export function labelHint(): string {
  return 'append --show-labels to display labels after command output';
}
