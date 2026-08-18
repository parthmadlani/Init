/**
 * The one signature interactive style in the whole system — hard offset
 * shadow, 2px border, press-down active state. Reserved for true primary
 * actions only (sign in, create account, wizard next/build, the dashboard
 * CTA): one per screen, doing the thing the screen exists for. Icon-scale
 * controls (status toggle, thumbs, sign out) deliberately don't get it —
 * applying a 3px offset shadow to a 32px circle reads as heavy, not bold.
 * Previously copy-pasted independently in five places; now one source so
 * the five can't drift out of sync with each other.
 */
export const PRIMARY_CTA_CLASS =
  "rounded-control border-2 border-brand-dark bg-brand-pink text-white font-extrabold shadow-[3px_3px_0_#111827] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#111827] disabled:opacity-40";
