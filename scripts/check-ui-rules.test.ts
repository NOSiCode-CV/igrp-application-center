import { describe, expect, it } from "vitest";
import { scanContent } from "./check-ui-rules.mjs";

describe("scanContent", () => {
  it("flags space-x/space-y as strict", () => {
    const v = scanContent('<div className="space-y-4">');
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ ruleId: "no-space-xy", level: "strict", line: 1 });
  });

  it("does not flag flex gap utilities", () => {
    expect(scanContent('<div className="flex flex-col gap-4">')).toHaveLength(0);
  });

  it("flags equal w-N h-N pairs as advisory", () => {
    const v = scanContent('<Avatar className="w-10 h-10" />');
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ ruleId: "use-size", level: "advisory" });
  });

  it("ignores non-equal w/h pairs", () => {
    expect(scanContent('<div className="w-full h-2" />')).toHaveLength(0);
  });

  it("ignores size-N", () => {
    expect(scanContent('<Avatar className="size-10" />')).toHaveLength(0);
  });

  it("flags raw color literals as strict", () => {
    const v = scanContent('<div className="bg-emerald-600" />');
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ ruleId: "no-raw-color", level: "strict" });
  });

  it("flags raw colors inside variant selectors", () => {
    const v = scanContent('className="data-[state=checked]:bg-emerald-500"');
    expect(v.some((x) => x.ruleId === "no-raw-color")).toBe(true);
  });

  it("does not flag semantic tokens", () => {
    expect(scanContent('<div className="bg-primary text-muted-foreground" />')).toHaveLength(0);
  });

  it("flags animate-pulse as strict", () => {
    const v = scanContent('<div className="animate-pulse" />');
    expect(v[0]).toMatchObject({ ruleId: "no-animate-pulse", level: "strict" });
  });

  it("flags dark: color overrides as strict", () => {
    const v = scanContent('<h2 className="text-slate-900 dark:text-white" />');
    expect(v.some((x) => x.ruleId === "no-dark-color")).toBe(true);
  });

  it("flags <hr> as strict", () => {
    const v = scanContent("<hr />");
    expect(v[0]).toMatchObject({ ruleId: "use-separator", level: "strict" });
  });

  it("flags border-t divider but not border-t-2", () => {
    expect(scanContent('<div className="border-t" />')).toHaveLength(1);
    expect(scanContent('<div className="border-t-2" />')).toHaveLength(0);
  });

  it("reports correct 1-based line numbers", () => {
    const v = scanContent('line1\nline2\n<div className="space-y-2" />');
    expect(v[0].line).toBe(3);
  });
});
