import { Slot } from "./slot";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "gold" | "solid" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

// Estilos de botão do iOS: preenchido (gold), cinza (solid), simples (ghost),
// tingido (outline) e destrutivo (danger).
const variants: Record<Variant, string> = {
  gold: "bg-accent text-accent-fg font-semibold",
  solid: "bg-fill text-fg hover:bg-fill-strong",
  ghost: "text-accent hover:bg-fill",
  outline: "bg-accent/15 text-accent font-semibold hover:bg-accent/20",
  danger: "bg-danger/15 text-danger font-semibold hover:bg-danger/20",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[15px] rounded-full gap-1.5",
  md: "h-[50px] px-5 text-[17px] rounded-[14px] gap-2",
  lg: "h-[54px] px-7 text-[17px] rounded-[16px] gap-2.5",
  icon: "h-10 w-10 rounded-full",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  loading?: boolean;
};

export function Button({ variant = "solid", size = "md", asChild, loading, className, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "press inline-flex select-none items-center justify-center font-medium whitespace-nowrap disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}
