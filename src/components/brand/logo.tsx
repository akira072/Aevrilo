import Link from "next/link";
import { cn } from "@/lib/utils";

interface AevriloLogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

/**
 * Distinct text + geometric mark logo for Aevrilo.
 * Designed as an isolated component so the SVG mark can be swapped anytime.
 */
export function AevriloLogo({
  href = "/",
  size = "md",
  showTagline = false,
  className,
}: AevriloLogoProps) {
  const iconDims = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const textClass =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";

  const content = (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-lg bg-slate-950 text-white shadow-xs",
          iconDims
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-4/6 w-4/6" fill="none">
          <path
            d="M12 3.5L4.5 20.5H8.1L9.7 16.5H14.3L15.9 20.5H19.5L12 3.5ZM10.8 13.4L12 10.1L13.2 13.4H10.8Z"
            fill="currentColor"
          />
          <circle cx="18.5" cy="5.5" r="2" fill="#14b8a6" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("font-semibold tracking-tight text-slate-950", textClass)}>
          Aevrilo
        </span>
        {showTagline ? (
          <span className="mt-0.5 text-[11px] font-medium tracking-wide text-slate-500">
            Ideas meet talent
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center focus-visible:rounded-md">
      {content}
    </Link>
  );
}
