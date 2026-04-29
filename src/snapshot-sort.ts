import { Snapshot } from './storage';

export type SortField = 'name' | 'created' | 'updated' | 'size' | 'keyCount';
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

export function parseSort(raw: string): SortOptions {
  const parts = raw.split(':');
  const field = (parts[0] as SortField) || 'name';
  const order = (parts[1] === 'desc' ? 'desc' : 'asc') as SortOrder;
  const validFields: SortField[] = ['name', 'created', 'updated', 'size', 'keyCount'];
  if (!validFields.includes(field)) {
    throw new Error(`Invalid sort field: ${field}. Valid fields: ${validFields.join(', ')}`);
  }
  return { field, order };
}

function getFieldValue(snapshot: Snapshot, field: SortField): string | number {
  switch (field) {
    case 'name':
      return snapshot.name.toLowerCase();
    case 'created':
      return snapshot.createdAt ? new Date(snapshot.createdAt).getTime() : 0;
    case 'updated':
      return snapshot.updatedAt ? new Date(snapshot.updatedAt).getTime() : 0;
    case 'size': {
      const serialized = JSON.stringify(snapshot.env ?? {});
      return serialized.length;
    }
    case 'keyCount':
      return Object.keys(snapshot.env ?? {}).length;
    default:
      return snapshot.name.toLowerCase();
  }
}

export function sortSnapshots(
  snapshots: Snapshot[],
  options: SortOptions
): Snapshot[] {
  const { field, order } = options;
  return [...snapshots].sort((a, b) => {
    const av = getFieldValue(a, field);
    const bv = getFieldValue(b, field);
    let cmp = 0;
    if (typeof av === 'string' && typeof bv === 'string') {
      cmp = av.localeCompare(bv);
    } else {
      cmp = (av as number) - (bv as number);
    }
    return order === 'desc' ? -cmp : cmp;
  });
}

export function formatSortLabel(options: SortOptions): string {
  return `${options.field}:${options.order}`;
}
