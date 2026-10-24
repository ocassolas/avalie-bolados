import { cn, initials } from "@/lib/utils";

const sizes = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
  "2xl": "h-32 w-32 text-3xl",
};

/** Avatar com moldura da loja (ouro, fogo, fumaça, coroa) e fallback de iniciais. */
export function Avatar({
  name,
  src,
  frame,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  frame?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 font-semibold text-fg",
        sizes[size],
        // Moldura e anel usam box-shadow: aplica um OU outro, nunca os dois
        frame ? `frame-${frame}` : "ring-1 ring-line",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--accent) 34%, var(--surface-2)), color-mix(in oklab, var(--accent) 18%, var(--surface-2)))",
          }}
          aria-hidden
        >
          {initials(name)}
        </span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}
