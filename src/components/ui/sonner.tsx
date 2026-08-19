"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

// The app has no dark mode (no .dark class is ever applied), so this
// skips next-themes entirely. Styled as a white card with the same
// hard-shadow border as the alert-dialog and hero card — not a dark
// terminal block, so it reads as one consistent surface with whatever
// just happened (e.g. the delete confirmation) instead of a jarring,
// unrelated-looking dark box.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group flex items-center gap-3 w-full rounded-card border-2 border-brand-dark bg-white px-4 py-3 font-mono text-[13px] text-brand-dark shadow-[3px_3px_0_#111827]",
          title: "font-mono font-semibold text-brand-dark",
          description: "text-black/60",
          actionButton: "!bg-brand-pink !text-white !rounded-control !px-2.5 !py-1 !text-xs !font-semibold",
          cancelButton: "!bg-black/5 !text-black/70 !rounded-control !px-2.5 !py-1 !text-xs",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
