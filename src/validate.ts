import { EnvMap } from './env';

export interface ValidationRule {
  key: string;
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
}

export interface ValidationResult {
  key: string;
  valid: boolean;
  errors: string[];
}

export interface ValidationReport {
  valid: boolean;
  results: ValidationResult[];
}

export function validateEnvMap(
  env: EnvMap,
  rules: ValidationRule[]
): ValidationReport {
  const results: ValidationResult[] = [];

  for (const rule of rules) {
    const errors: string[] = [];
    const value = env[rule.key];

    if (rule.required && (value === undefined || value === '')) {
      errors.push(`Key "${rule.key}" is required but missing or empty`);
    }

    if (value !== undefined && value !== '') {
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`Key "${rule.key}" does not match required pattern ${rule.pattern}`);
      }
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push(`Key "${rule.key}" is shorter than minimum length ${rule.minLength}`);
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push(`Key "${rule.key}" exceeds maximum length ${rule.maxLength}`);
      }
      if (rule.allowedValues && !rule.allowedValues.includes(value)) {
        errors.push(
          `Key "${rule.key}" value "${value}" is not in allowed values: ${rule.allowedValues.join(', ')}`
        );
      }
    }

    results.push({ key: rule.key, valid: errors.length === 0, errors });
  }

  return {
    valid: results.every((r) => r.valid),
    results: results.filter((r) => !r.valid || rules.find((ru) => ru.key === r.key)?.required),
  };
}

export function formatValidationReport(report: ValidationReport): string {
  if (report.valid) return '✔ All validation rules passed.';

  const lines: string[] = ['✖ Validation failed:'];
  for (const result of report.results) {
    if (!result.valid) {
      for (const err of result.errors) {
        lines.push(`  - ${err}`);
      }
    }
  }
  return lines.join('\n');
}

export function parseRulesFile(json: string): ValidationRule[] {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('Rules file must be a JSON array');
  return parsed.map((r: Record<string, unknown>) => ({
    ...r,
    pattern: r.pattern ? new RegExp(r.pattern as string) : undefined,
  })) as ValidationRule[];
}
