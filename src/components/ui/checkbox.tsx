"use client";

import * as RCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onChange,
  children,
  error,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  error?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <RCheckbox.Root
          id={id}
          checked={checked}
          onCheckedChange={(v) => onChange(v === true)}
          aria-invalid={!!error}
          className={cn(
            "mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-300 [transition-timing-function:var(--ease-spring)] active:scale-90",
            checked ? "border-accent bg-accent text-accent-fg" : "border-faint",
            error && !checked && "border-danger",
          )}
        >
          <RCheckbox.Indicator>
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </RCheckbox.Indicator>
        </RCheckbox.Root>
        <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-fg/85">
          {children}
        </label>
      </div>
      {error && !checked && <p className="mt-1 pl-8 text-xs text-danger">{error}</p>}
    </div>
  );
}
