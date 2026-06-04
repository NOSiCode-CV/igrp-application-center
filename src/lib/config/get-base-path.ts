export function getBasePath(bp: string) {
  if (!bp) return "/api/auth";

  const normalized = bp.startsWith("/") ? bp : `/${bp}`;
  const cleanPath = normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
  return `${cleanPath}/api/auth`;
}
