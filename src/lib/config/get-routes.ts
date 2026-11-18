import fs from "node:fs";
import path from "node:path";

/**
 * Routes exposed to Access Management, parsed out of the `routes.d.ts` that
 * Next.js generates for `typedRoutes: true`.
 *
 * WHY A RUNTIME READ AND NOT A STATIC IMPORT: unlike
 * `get-permissions.ts` (which imports `.igrpstudio/permissions.json` statically
 * so the bundler traces it), this file does not exist until Next has finished
 * generating types for the very build that would bundle it. It has to be read
 * at runtime. `.next/types/` IS included in `output: "standalone"`, so the
 * container has it.
 *
 * WHAT CAN STILL GO WRONG: the shape of `routes.d.ts` is a Next.js internal with
 * no stability guarantee. If a Next upgrade changes it, the regexes below stop
 * matching. That used to degrade silently — `appRoutes: []` flowed into
 * `apiManagementConfig` and the resource/route sync registered nothing, with a
 * single `console.warn` as the only trace. Now the failure is loud and names its
 * consequence, and the miss is cached so a broken parse logs once instead of
 * re-reading the file on every render.
 */
type ParsedRoutes = { appRoutes: string[]; paramMapBody: string };

// `undefined` = not attempted yet. A resolved entry — success OR failure — is
// cached: the previous version only cached the success path, so every render
// after a failure paid another synchronous `readFileSync` and logged again.
let cached: { value: ParsedRoutes | undefined } | undefined;

function parseRoutes(): ParsedRoutes | undefined {
  const file = path.join(process.cwd(), ".next/types/routes.d.ts");

  let content: string;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch (error) {
    console.error(
      `[get-routes] could not read ${file} — Access Management will receive ZERO ` +
        "app routes, so resource/route sync registers nothing. Expected when " +
        "typedRoutes is off or before the first build completes.",
      error,
    );
    return undefined;
  }

  const appRoutesMatch = content.match(
    /type AppRoutes\s*=\s*([\s\S]*?)\n(?=type|interface)/,
  );
  const paramMapMatch = content.match(/interface ParamMap\s*{([\s\S]*?)^}/m);

  if (!appRoutesMatch || !paramMapMatch) {
    console.error(
      "[get-routes] routes.d.ts parsed to nothing — its format changed (this is " +
        "a Next.js internal with no stability guarantee). Access Management will " +
        "receive ZERO app routes, so resource/route sync registers nothing. " +
        `Missing: ${!appRoutesMatch ? "AppRoutes " : ""}${!paramMapMatch ? "ParamMap" : ""}`.trim(),
    );
    return undefined;
  }

  const appRoutes = appRoutesMatch[1]
    .split("|")
    .map((r) => r.trim().replace(/"/g, ""))
    .filter((r) => r.length > 0 && !r.startsWith("type"));

  // A guard that can pass while checking nothing is not a guard: the regexes
  // above can match a renamed-but-still-present block and yield an empty list.
  // Assert the parse actually produced work.
  if (appRoutes.length === 0) {
    console.error(
      "[get-routes] matched AppRoutes but extracted 0 routes — the declaration " +
        "shape changed. Access Management will receive ZERO app routes.",
    );
    return undefined;
  }

  return { appRoutes, paramMapBody: paramMapMatch[1] };
}

export function getRoutes(): ParsedRoutes | undefined {
  cached ??= { value: parseRoutes() };
  return cached.value;
}
