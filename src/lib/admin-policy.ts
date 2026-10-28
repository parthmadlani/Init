// Admin eligibility is separate from the report recipient. Change only at the owner's request.
export const OWNER_ADMIN_EMAIL = "parthmadlani@gmail.com";
export function isOwnerAdmin(user: { email: string; role: string } | null | undefined): boolean {
  return user?.role === "ADMIN" && user.email === OWNER_ADMIN_EMAIL;
}
