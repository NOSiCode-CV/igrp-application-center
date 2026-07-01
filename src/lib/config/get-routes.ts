import fs from "node:fs";
import path from "node:path";

let cached: { appRoutes: string[]; paramMapBody: string } | undefined;

export function getRoutes() {
  if (cached) return cached;
  try {
    const file = path.join(process.cwd(), ".next/types/routes.d.ts");
    const content = fs.readFileSync(file, "utf8");

    const appRoutesMatch = content.match(
      /type AppRoutes\s*=\s*([\s\S]*?)\n(?=type|interface)/,
    );
    if (!appRoutesMatch) {
      throw new Error("Could not find AppRoutes in routes.d.ts");
    }
    const appRoutes = appRoutesMatch[1]
      .split("|")
      .map((r) => r.trim().replace(/"/g, ""))
      .filter((r) => r.length > 0 && !r.startsWith("type"));

    const paramMapMatch = content.match(/interface ParamMap\s*{([\s\S]*?)^}/m);
    if (!paramMapMatch) {
      throw new Error("Could not find ParamMap in routes.d.ts");
    }
    const paramMapBody = paramMapMatch[1];

    cached = { appRoutes, paramMapBody };
    return cached;
  } catch (error) {
    console.warn("Could not read routes file:", error);
  }
}
