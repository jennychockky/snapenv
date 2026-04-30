export interface Label {
  key: string;
  value: string;
}

export interface LabelStore {
  [snapshotName: string]: Label[];
}

export function createLabel(key: string, value: string): Label {
  if (!key || !/^[a-zA-Z0-9_\-\.]+$/.test(key)) {
    throw new Error(`Invalid label key: "${key}". Use alphanumeric, dash, underscore, or dot.`);
  }
  return { key, value };
}

export function setLabel(store: LabelStore, name: string, key: string, value: string): LabelStore {
  const labels = store[name] ? [...store[name]] : [];
  const idx = labels.findIndex((l) => l.key === key);
  const label = createLabel(key, value);
  if (idx >= 0) {
    labels[idx] = label;
  } else {
    labels.push(label);
  }
  return { ...store, [name]: labels };
}

export function removeLabel(store: LabelStore, name: string, key: string): LabelStore {
  const labels = (store[name] ?? []).filter((l) => l.key !== key);
  return { ...store, [name]: labels };
}

export function getLabels(store: LabelStore, name: string): Label[] {
  return store[name] ?? [];
}

export function findByLabel(store: LabelStore, key: string, value?: string): string[] {
  return Object.entries(store)
    .filter(([, labels]) =>
      labels.some((l) => l.key === key && (value === undefined || l.value === value))
    )
    .map(([name]) => name);
}

export function formatLabels(labels: Label[]): string {
  if (labels.length === 0) return '(no labels)';
  return labels.map((l) => `${l.key}=${l.value}`).join('  ');
}
