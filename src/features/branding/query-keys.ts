export const brandingKeys = {
  all: ["branding"] as const,
  config: () => [...brandingKeys.all, "config"] as const,
};
