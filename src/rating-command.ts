import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  RatingStore,
  setRating,
  removeRating,
  listRatings,
  getRating,
  formatRatings,
} from './snapshot-rating';

const RATING_FILE = path.join(
  process.env.SNAPENV_DIR || path.join(process.env.HOME || '~', '.snapenv'),
  'ratings.json'
);

export function loadRatings(): RatingStore {
  if (!fs.existsSync(RATING_FILE)) return { ratings: [] };
  return JSON.parse(fs.readFileSync(RATING_FILE, 'utf-8')) as RatingStore;
}

export function saveRatings(store: RatingStore): void {
  fs.mkdirSync(path.dirname(RATING_FILE), { recursive: true });
  fs.writeFileSync(RATING_FILE, JSON.stringify(store, null, 2));
}

export function registerRatingCommands(program: Command): void {
  const rating = program.command('rating').description('Manage snapshot ratings');

  rating
    .command('set <snapshot> <rating>')
    .description('Rate a snapshot (1-5)')
    .option('-n, --note <note>', 'Optional note')
    .action((snapshot: string, ratingStr: string, opts: { note?: string }) => {
      const n = parseInt(ratingStr, 10);
      const store = setRating(loadRatings(), snapshot, n, opts.note);
      saveRatings(store);
      console.log(`Rated "${snapshot}" with ${n}/5.`);
    });

  rating
    .command('remove <snapshot>')
    .description('Remove rating for a snapshot')
    .action((snapshot: string) => {
      const store = removeRating(loadRatings(), snapshot);
      saveRatings(store);
      console.log(`Rating removed for "${snapshot}".`);
    });

  rating
    .command('get <snapshot>')
    .description('Show rating for a snapshot')
    .action((snapshot: string) => {
      const r = getRating(loadRatings(), snapshot);
      if (!r) { console.log(`No rating for "${snapshot}".`); return; }
      console.log(formatRatings([r]));
    });

  rating
    .command('list')
    .description('List all ratings')
    .option('--min <n>', 'Minimum rating filter')
    .action((opts: { min?: string }) => {
      const min = opts.min !== undefined ? parseInt(opts.min, 10) : undefined;
      const results = listRatings(loadRatings(), min);
      console.log(formatRatings(results));
    });
}
