export interface LintRule {
  name: string;
  check: (key: string, value: string) => string | null;
}

export interface LintResult {
  key: string;
  rule: string;
  message: string;
}

export const builtinRules: LintRule[] = [
  {
    name: 'no-empty-value',
    check: (key, value) =>
      value.trim() === '' ? `Key "${key}" has an empty value` : null,
  },
  {
    name: 'no-whitespace-key',
    check: (key) =>
      /\s/.test(key) ? `Key "${key}" contains whitespace` : null,
  },
  {
    name: 'uppercase-key',
    check: (key) =>
      key !== key.toUpperCase() ? `Key "${key}" is not uppercase` : null,
  },
  {
    name: 'no-quotes-in-value',
    check: (key, value) =>
      /^["'].*["']$/.test(value)
        ? `Key "${key}" value appears to contain surrounding quotes`
        : null,
  },
];

export function lintEnvMap(
  env: Record<string, string>,
  rules: LintRule[] = builtinRules
): LintResult[] {
  const results: LintResult[] = [];
  for (const [key, value] of Object.entries(env)) {
    for (const rule of rules) {
      const message = rule.check(key, value);
      if (message) {
        results.push({ key, rule: rule.name, message });
      }
    }
  }
  return results;
}

export function formatLintResults(results: LintResult[]): string {
  if (results.length === 0) return 'No lint issues found.';
  return results.map((r) => `[${r.rule}] ${r.message}`).join('\n');
}
