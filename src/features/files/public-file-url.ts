/**
 * Address of a stored file under the MinIO base. String join, not
 * `new URL(path, base)`: that throws on an empty base and drops a bucket path
 * written without a trailing slash.
 */
export function publicFileUrl(path: string, base: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
