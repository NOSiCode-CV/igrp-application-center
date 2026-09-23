export const serviceAccountKeys = {
  all: ["service-accounts"] as const,
  list: () => ["service-accounts", "list"] as const,
};
