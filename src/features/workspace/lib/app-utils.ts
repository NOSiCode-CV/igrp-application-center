type AppTileColor = { bg: string; text: string };

const TILE_COLORS: AppTileColor[] = [
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
];

export function getAppTileColor(code: string): AppTileColor {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) & 0xffff;
  }
  return TILE_COLORS[hash % TILE_COLORS.length];
}
