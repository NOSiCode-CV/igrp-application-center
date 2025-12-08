import fs from "fs";
import path from "path";

export function getRoutes() {
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

    return { appRoutes, paramMapBody };
  } catch (error) {
    console.warn("Could not read routes file:", error);
  }
}
