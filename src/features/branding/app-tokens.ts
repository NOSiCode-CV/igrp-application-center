/** Tokens only the Application Center uses (spec §6.2). Defaults live in app-center.css. */
export type AppTokenGroup = "subtle" | "tiles" | "appOther";

const GROUPS: Record<AppTokenGroup, string[]> = {
  subtle: [
    "--primary-subtle",
    "--primary-subtle-foreground",
    "--success-subtle",
    "--success-subtle-foreground",
    "--warning-subtle",
    "--warning-subtle-foreground",
    "--info-subtle",
    "--info-subtle-foreground",
    "--destructive-subtle",
    "--destructive-subtle-foreground",
  ],
  tiles: [1, 2, 3, 4, 5].flatMap((n) => [
    `--app-tile-${n}`,
    `--app-tile-${n}-foreground`,
  ]),
  appOther: ["--favorite", "--scrollbar-thumb", "--scrollbar-thumb-hover"],
};

export const APP_BRANDING_TOKENS = Object.entries(GROUPS).flatMap(
  ([group, names]) =>
    names.map((name) => ({ name, group: group as AppTokenGroup })),
);
