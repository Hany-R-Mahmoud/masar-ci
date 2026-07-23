export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!raw) return undefined;
  return `${raw.startsWith("http") ? raw : `https://${raw}`}`.replace(/\/$/, "");
}
