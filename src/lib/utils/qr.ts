export function buildJoinUrl(storeId: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/join/${storeId}`;
}
