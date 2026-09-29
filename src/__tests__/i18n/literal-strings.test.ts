// FE-8 (FR-37, OQ-4): literal-string guard for migrated folders.
//
// Biome has no equivalent of eslint-plugin-i18next/no-literal-string, so this
// test parses every .tsx file under MIGRATED_FOLDERS and fails on:
//   - JSX text containing letters (`<p>Olá</p>`);
//   - string / template literals rendered as JSX children (`{"Olá"}`);
//   - string literals in user-facing props (placeholder, title, label,
//     aria-label, description, …).
//
// When a feature is migrated to messages (plan §3.7 step 5), add its folder
// here. Text without letters (symbols, numbers, punctuation) is allowed.

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/** Folders (relative to the app root) whose UI text must come from messages. */
const MIGRATED_FOLDERS = [
  "src/i18n/components",
  "src/features/users",
  "src/app/(invite)",
];

const USER_FACING_PROPS = new Set([
  "placeholder",
  "title",
  "label",
  "aria-label",
  "aria-description",
  "description",
  "alt",
  "helperText",
  "errorText",
  "searchText",
  "selectLabel",
]);

const HAS_LETTER = /\p{L}/u;

const APP_ROOT = path.resolve(__dirname, "../../..");

function listTsxFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return listTsxFiles(full);
    return name.endsWith(".tsx") && !/\.test\.tsx$/.test(name) ? [full] : [];
  });
}

function literalText(node: ts.Node | undefined): string | undefined {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isTemplateExpression(node)) {
    return [
      node.head.text,
      ...node.templateSpans.map((s) => s.literal.text),
    ].join(" ");
  }
  if (ts.isParenthesizedExpression(node)) return literalText(node.expression);
  return undefined;
}

/** Returns `line: snippet` for every hardcoded user-facing string. */
function findLiteralStrings(source: string, fileName = "x.tsx"): string[] {
  const sf = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const hits: string[] = [];
  const report = (node: ts.Node, text: string) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    hits.push(`${line + 1}: ${text.trim().slice(0, 60)}`);
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && HAS_LETTER.test(node.text)) {
      report(node, node.text);
    } else if (
      ts.isJsxExpression(node) &&
      node.parent &&
      (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
    ) {
      const text = literalText(node.expression);
      if (text && HAS_LETTER.test(text)) report(node, text);
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sf);
      if (USER_FACING_PROPS.has(name) && node.initializer) {
        const init = node.initializer;
        const text = ts.isJsxExpression(init)
          ? literalText(init.expression)
          : literalText(init);
        if (text && HAS_LETTER.test(text)) report(node, `${name}="${text}"`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

describe("literal-string guard", () => {
  it("detects the patterns it guards against (self-check)", () => {
    const hits = findLiteralStrings(`
      export const A = () => (
        <div title="Título" aria-label={"Fechar"}>
          Olá mundo
          {"Texto"}
          {\`Modelo \${1}\`}
          <input placeholder='Pesquisar' />
          <span>{t("ok")} · 42 ×</span>
          <b className="text-sm" data-x="abc">{count}</b>
        </div>
      );
    `);
    expect(hits).toHaveLength(6);
  });

  it.each(
    MIGRATED_FOLDERS,
  )("%s has no hardcoded user-facing strings", (folder) => {
    const files = listTsxFiles(path.join(APP_ROOT, folder));
    expect(files.length).toBeGreaterThan(0);
    const offenders = files.flatMap((file) =>
      findLiteralStrings(readFileSync(file, "utf8"), file).map(
        (hit) => `${path.relative(APP_ROOT, file)}:${hit}`,
      ),
    );
    expect(offenders).toEqual([]);
  });
});
