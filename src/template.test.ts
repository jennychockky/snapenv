import { describe, it, expect } from "vitest";
import {
  createTemplate,
  applyTemplate,
  listTemplateVariables,
} from "./template";

describe("createTemplate", () => {
  it("creates a template from an env map", () => {
    const tmpl = createTemplate("base", { NODE_ENV: "development", PORT: "3000" });
    expect(tmpl.name).toBe("base");
    expect(tmpl.variables).toHaveLength(2);
    expect(tmpl.variables[0].name).toBe("NODE_ENV");
    expect(tmpl.variables[0].defaultValue).toBe("development");
    expect(tmpl.variables[0].required).toBe(true);
  });

  it("stores description and createdAt", () => {
    const tmpl = createTemplate("base", {}, "A base template");
    expect(tmpl.description).toBe("A base template");
    expect(tmpl.createdAt).toBeTruthy();
  });
});

describe("applyTemplate", () => {
  it("uses default values when no overrides given", () => {
    const tmpl = createTemplate("base", { PORT: "3000", HOST: "localhost" });
    const result = applyTemplate(tmpl);
    expect(result).toEqual({ PORT: "3000", HOST: "localhost" });
  });

  it("applies overrides over defaults", () => {
    const tmpl = createTemplate("base", { PORT: "3000" });
    const result = applyTemplate(tmpl, { PORT: "8080" });
    expect(result.PORT).toBe("8080");
  });

  it("throws on missing required variable with no default", () => {
    const tmpl = createTemplate("base", { SECRET: "" });
    tmpl.variables[0].defaultValue = undefined;
    expect(() => applyTemplate(tmpl, {})).toThrow("Missing required variable: SECRET");
  });
});

describe("listTemplateVariables", () => {
  it("formats variable list", () => {
    const tmpl = createTemplate("base", { PORT: "3000", SECRET: "" });
    tmpl.variables[1].defaultValue = undefined;
    const output = listTemplateVariables(tmpl);
    expect(output).toContain("PORT");
    expect(output).toContain("[default: 3000]");
    expect(output).toContain("SECRET");
    expect(output).not.toContain("[default:");
  });
});
