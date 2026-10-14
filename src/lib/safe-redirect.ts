/** Only allow destinations inside the authenticated app. Never trust a return URL from a form. */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== "string" || /[\\\s%?#]/.test(value)) return "/dashboard";
  return /^\/(dashboard|wizard|paths|bookmarks|profile)(\/[a-zA-Z0-9_-]+)*$/.test(value) ? value : "/dashboard";
}
