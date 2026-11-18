/** `workspace.banner.greeting.*` key for the viewer's local time of day. */
export type GreetingKey = "morning" | "afternoon" | "evening";

export function getGreeting(now = new Date()): GreetingKey {
  const h = now.getHours();
  if (h < 12) return "morning";
  if (h < 19) return "afternoon";
  return "evening";
}
