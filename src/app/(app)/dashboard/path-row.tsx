"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PRIMARY_CTA_CLASS } from "@/lib/ui";

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 5.5h12" strokeLinecap="round" />
      <path d="M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 5.5 6.1 16a1 1 0 0 0 1 .95h5.8a1 1 0 0 0 1-.95l.6-10.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.3 8.5v5M11.7 8.5v5" strokeLinecap="round" />
    </svg>
  );
}

export function PathRow({
  pathId,
  subjectName,
  completed,
  total,
}: {
  pathId: string;
  subjectName: string;
  completed: number;
  total: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await fetch(`/api/v1/paths/${pathId}`, { method: "DELETE" });
      toast("Your path is deleted");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-card border border-black/10 bg-white p-4 transition duration-150 hover:-translate-y-0.5 hover:border-brand-cyan hover:shadow-md">
      <Link href={`/paths/${pathId}`} className="flex min-w-0 flex-1 items-center justify-between">
        <span className="font-semibold text-brand-dark">{subjectName}</span>
        <span className="text-sm text-black/65">
          {completed}/{total} topics
        </span>
      </Link>
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={isPending}
                className="shrink-0 rounded-control p-3.5 text-black/45 transition hover:text-brand-pink"
              >
                <TrashIcon />
              </button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Remove this path</TooltipContent>
        </Tooltip>
        <AlertDialogContent className="rounded-card border-2 border-brand-dark bg-white p-6 shadow-[4px_4px_0_#111827] sm:max-w-sm">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="font-serif text-heading font-bold text-brand-dark">
              Remove {subjectName}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-black/65">
              Its resources and topic order are gone. Progress you&apos;ve logged stays if you start it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!mx-0 !mb-0 !rounded-b-none !border-t-0 !bg-transparent !p-0 sm:flex-row sm:justify-end sm:gap-2">
            <AlertDialogCancel className="rounded-control border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-black/70 hover:bg-black/5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={`px-4 py-2 text-sm ${PRIMARY_CTA_CLASS}`}>
              Remove path
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
