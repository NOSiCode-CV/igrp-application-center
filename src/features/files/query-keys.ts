export const filesKeys = {
  all: ["files"] as const,
  byPath: (path: string) => ["files", path] as const,
};
