export interface Bookmark {
  name: string;
  snapshotName: string;
  description?: string;
  createdAt: string;
}

export type BookmarkMap = Record<string, Bookmark>;

export function createBookmark(
  name: string,
  snapshotName: string,
  description?: string
): Bookmark {
  return {
    name,
    snapshotName,
    description,
    createdAt: new Date().toISOString(),
  };
}

export function addBookmark(bookmarks: BookmarkMap, bookmark: Bookmark): BookmarkMap {
  if (bookmarks[bookmark.name]) {
    throw new Error(`Bookmark "${bookmark.name}" already exists`);
  }
  return { ...bookmarks, [bookmark.name]: bookmark };
}

export function removeBookmark(bookmarks: BookmarkMap, name: string): BookmarkMap {
  if (!bookmarks[name]) {
    throw new Error(`Bookmark "${name}" not found`);
  }
  const updated = { ...bookmarks };
  delete updated[name];
  return updated;
}

export function resolveBookmark(bookmarks: BookmarkMap, name: string): string {
  const bookmark = bookmarks[name];
  if (!bookmark) {
    throw new Error(`Bookmark "${name}" not found`);
  }
  return bookmark.snapshotName;
}

export function listBookmarks(bookmarks: BookmarkMap): Bookmark[] {
  return Object.values(bookmarks).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function formatBookmarks(bookmarks: Bookmark[]): string {
  if (bookmarks.length === 0) return 'No bookmarks defined.';
  return bookmarks
    .map((b) => {
      const desc = b.description ? `  # ${b.description}` : '';
      return `${b.name} -> ${b.snapshotName}${desc}`;
    })
    .join('\n');
}
