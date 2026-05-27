// @ts-check
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const COLOR_NAMES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

/**
 * @typedef {Object} Rule
 * @property {string} id
 * @property {"strict"|"advisory"} level
 * @property {string} message
 * @property {() => RegExp} pattern
 */

/** @type {Rule[]} */
export const RULES = [
  {
    id: "no-space-xy",
    level: "strict",
    message: "Use `flex gap-*` (or `flex-col gap-*`) instead of space-x-*/space-y-*.",
    pattern: () => /\bspace-[xy]-[\w./[\]-]+/g,
  },
  {
    id: "use-size",
    level: "advisory",
    message: "Equal width/height: prefer `size-N` over `w-N h-N`.",
    pattern: () => /\bw-(\d+)\s+h-\1\b/g,
  },
  {
    id: "no-raw-color",
    level: "strict",
    message:
      "Use Badge variants or semantic tokens (bg-primary, text-muted-foreground), not raw color literals.",
    pattern: () =>
      new RegExp(`\\b(?:bg|text|border|fill|ring)-(?:${COLOR_NAMES})-\\d{2,3}\\b`, "g"),
  },
  {
    id: "no-animate-pulse",
    level: "strict",
    message: "Use the `Skeleton` primitive instead of custom animate-pulse.",
    pattern: () => /\banimate-pulse\b/g,
  },
  {
    id: "no-dark-color",
    level: "strict",
    message:
      "Remove manual dark: color overrides — semantic tokens handle dark mode.",
    pattern: () => new RegExp(`\\bdark:(?:bg|text|border|fill|ring)-[^\\s"']+`, "g"),
  },
  {
    id: "use-separator",
    level: "strict",
    message:
      "Use the `Separator` component instead of <hr> or border-t dividers.",
    pattern: () => /<hr[\s/>]|\bborder-t(?![-\w])/g,
  },
];

/**
 * @typedef {Object} Violation
 * @property {string} ruleId
 * @property {"strict"|"advisory"} level
 * @property {number} line
 * @property {string} match
 * @property {string} message
 */

/**
 * @param {string} content
 * @returns {Violation[]}
 */
export function scanContent(content) {
  /** @type {Violation[]} */
  const out = [];
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      const re = rule.pattern();
      let m;
      while ((m = re.exec(line)) !== null) {
        out.push({
          ruleId: rule.id,
          level: rule.level,
          line: i + 1,
          match: m[0],
          message: rule.message,
        });
      }
    }
  });
  return out;
}

/**
 * @param {Violation[]} violations
 * @param {string} filePath
 * @returns {string}
 */
export function formatViolations(violations, filePath) {
  return violations
    .map(
      (v) =>
        `  ${filePath}:${v.line}  [${v.level}] ${v.ruleId} → "${v.match}"\n      ${v.message}`,
    )
    .join("\n");
}

/** @returns {string[]} */
function listTsxFiles(root = "src") {
  return readdirSync(root, { recursive: true })
    .filter((p) => typeof p === "string" && p.endsWith(".tsx"))
    .map((p) => join(root, p));
}

function main() {
  const files = listTsxFiles();
  let strictCount = 0;
  let advisoryCount = 0;
  for (const file of files) {
    const violations = scanContent(readFileSync(file, "utf8"));
    if (violations.length === 0) continue;
    console.log(formatViolations(violations, file));
    strictCount += violations.filter((v) => v.level === "strict").length;
    advisoryCount += violations.filter((v) => v.level === "advisory").length;
  }
  console.log(
    `\ncheck:ui — ${strictCount} strict, ${advisoryCount} advisory violation(s).`,
  );
  process.exitCode = strictCount > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
