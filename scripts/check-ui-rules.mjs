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
 * @property {string[]} [exemptPathPrefixes] Path prefixes this rule does not
 *   apply to, forward-slashed. Keep this list short and justified — it is for
 *   vendored code we do not author, not for app code we would rather not fix.
 */

/** @type {Rule[]} */
export const RULES = [
  {
    id: "no-space-xy",
    level: "strict",
    message:
      "Use `flex gap-*` (or `flex-col gap-*`) instead of space-x-*/space-y-*.",
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
      new RegExp(
        `\\b(?:bg|text|border|fill|ring)-(?:${COLOR_NAMES})-\\d{2,3}\\b`,
        "g",
      ),
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
    pattern: () => /\bdark:(?:bg|text|border|fill|ring)-[^\s"']+/g,
    // `src/components/ui/` holds primitives emitted verbatim by the shadcn CLI
    // (`shadcn add`). Their few `dark:` classes are semantic tokens carrying a
    // dark-mode ALPHA delta (`bg-destructive/10` → `dark:bg-destructive/20`),
    // not raw palette overrides — a translucent tint needs more opacity on a
    // dark surface, and no token flip expresses that. Rewriting them would
    // drift from upstream and be undone by the next `shadcn add`.
    exemptPathPrefixes: ["src/components/ui/"],
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
 * @param {Rule} rule
 * @param {string} filePath
 * @returns {boolean}
 */
function isExempt(rule, filePath) {
  if (!rule.exemptPathPrefixes) return false;
  const normalized = filePath.replace(/\\/g, "/");
  return rule.exemptPathPrefixes.some((prefix) =>
    normalized.startsWith(prefix),
  );
}

/**
 * @param {string} content
 * @param {string} [filePath] Repo-relative path, used for per-rule exemptions.
 * @returns {Violation[]}
 */
export function scanContent(content, filePath = "") {
  /** @type {Violation[]} */
  const out = [];
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (isExempt(rule, filePath)) continue;
      const re = rule.pattern();
      let m = re.exec(line);
      while (m !== null) {
        out.push({
          ruleId: rule.id,
          level: rule.level,
          line: i + 1,
          match: m[0],
          message: rule.message,
        });
        m = re.exec(line);
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
function listSourceFiles(root = "src") {
  return /** @type {string[]} */ (
    readdirSync(root, { recursive: true }).filter(
      (p) => typeof p === "string" && (p.endsWith(".tsx") || p.endsWith(".ts")),
    )
  ).map((p) => join(root, p));
}

function main() {
  const files = listSourceFiles();
  let strictCount = 0;
  let advisoryCount = 0;
  for (const file of files) {
    const violations = scanContent(readFileSync(file, "utf8"), file);
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

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
