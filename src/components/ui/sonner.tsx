"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

// The app has no dark mode (no .dark class is ever applied), so this
// skips next-themes entirely and always renders the one terminal-styled
// toast — matching the boot-sequence/completion-banner aesthetic
// (globals.css, boot-sequence.tsx) rather than shadcn's default light card.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group flex items-center gap-3 w-full rounded-card border-2 border-brand-pink bg-brand-dark px-4 py-3 font-mono text-[13px] text-white/90 shadow-[3px_3px_0_#ff3d8a]",
          title: "font-mono text-white",
          description: "text-white/60",
          actionButton: "!bg-brand-pink !text-white !rounded-control !px-2.5 !py-1 !text-xs !font-semibold",
          cancelButton: "!bg-white/10 !text-white/80 !rounded-control !px-2.5 !py-1 !text-xs",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
