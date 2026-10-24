"use client";

import * as RSwitch from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/** Switch do iOS: 51×31, bolinha branca que desliza com mola. */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <RSwitch.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300 disabled:opacity-40",
        checked ? "bg-success" : "bg-fill-strong",
      )}
    >
      <RSwitch.Thumb
        className={cn(
          "block h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,.15),0_3px_1px_rgba(0,0,0,.06)] transition-transform duration-500 [transition-timing-function:var(--ease-spring)]",
          checked ? "translate-x-[22px]" : "translate-x-[2px]",
        )}
      />
    </RSwitch.Root>
  );
}
