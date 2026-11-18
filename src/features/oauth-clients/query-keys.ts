export const oauthClientKeys = {
  all: ["oauth-clients"] as const,
  list: () => ["oauth-clients", "list"] as const,
  detail: (id: string) => ["oauth-clients", "detail", id] as const,
};
