export interface TemplateVariable {
  name: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
}

export interface EnvTemplate {
  name: string;
  description?: string;
  variables: TemplateVariable[];
  createdAt: string;
}

export type TemplateMap = Record<string, EnvTemplate>;

export function createTemplate(
  name: string,
  envMap: Record<string, string>,
  description?: string
): EnvTemplate {
  const variables: TemplateVariable[] = Object.entries(envMap).map(
    ([key, value]) => ({
      name: key,
      required: true,
      defaultValue: value || undefined,
    })
  );
  return {
    name,
    description,
    variables,
    createdAt: new Date().toISOString(),
  };
}

export function applyTemplate(
  template: EnvTemplate,
  overrides: Record<string, string> = {}
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const variable of template.variables) {
    const value =
      overrides[variable.name] ??
      variable.defaultValue ??
      (variable.required ? undefined : "");
    if (value === undefined) {
      throw new Error(
        `Missing required variable: ${variable.name}`
      );
    }
    result[variable.name] = value;
  }
  return result;
}

export function listTemplateVariables(template: EnvTemplate): string {
  return template.variables
    .map((v) => {
      const req = v.required ? "(required)" : "(optional)";
      const def = v.defaultValue ? ` [default: ${v.defaultValue}]` : "";
      return `  ${v.name} ${req}${def}`;
    })
    .join("\n");
}
