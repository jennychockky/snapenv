export interface SnapshotRating {
  snapshotName: string;
  rating: number; // 1-5
  note?: string;
  ratedAt: string;
}

export interface RatingStore {
  ratings: SnapshotRating[];
}

export function createRating(
  snapshotName: string,
  rating: number,
  note?: string
): SnapshotRating {
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new Error(`Rating must be an integer between 1 and 5, got ${rating}`);
  }
  return {
    snapshotName,
    rating,
    note,
    ratedAt: new Date().toISOString(),
  };
}

export function setRating(
  store: RatingStore,
  snapshotName: string,
  rating: number,
  note?: string
): RatingStore {
  const entry = createRating(snapshotName, rating, note);
  const filtered = store.ratings.filter((r) => r.snapshotName !== snapshotName);
  return { ratings: [...filtered, entry] };
}

export function removeRating(store: RatingStore, snapshotName: string): RatingStore {
  return { ratings: store.ratings.filter((r) => r.snapshotName !== snapshotName) };
}

export function getRating(store: RatingStore, snapshotName: string): SnapshotRating | undefined {
  return store.ratings.find((r) => r.snapshotName === snapshotName);
}

export function listRatings(store: RatingStore, minRating?: number): SnapshotRating[] {
  const all = [...store.ratings].sort((a, b) => b.rating - a.rating);
  return minRating !== undefined ? all.filter((r) => r.rating >= minRating) : all;
}

export function formatRatings(ratings: SnapshotRating[]): string {
  if (ratings.length === 0) return 'No ratings found.';
  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
  return ratings
    .map((r) => {
      const note = r.note ? `  "${r.note}"` : '';
      return `${r.snapshotName.padEnd(24)} ${stars(r.rating)} (${r.rating}/5)${note}`;
    })
    .join('\n');
}
