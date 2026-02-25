import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
