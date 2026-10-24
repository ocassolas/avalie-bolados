"use client";

import * as RSlider from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export function ScoreSlider({ value, onChange, className, label }: { value: number | null; onChange: (v: number) => void; className?: string; label: string }) {
  return (
    <RSlider.Root
      className={cn("relative flex h-10 w-full touch-none select-none items-center", className)}
      min={0}
      max={10}
      step={0.5}
      value={[value ?? 5]}
      onValueChange={([v]) => onChange(v!)}
      aria-label={label}
    >
      <RSlider.Track className="relative h-1 grow overflow-hidden rounded-full bg-fill-strong">
        <RSlider.Range className={cn("absolute h-full rounded-full", value == null ? "bg-transparent" : "bg-accent")} />
      </RSlider.Track>
      <RSlider.Thumb
        className={cn(
          "block h-7 w-7 rounded-full bg-white shadow-[0_0.5px_4px_rgba(0,0,0,.12),0_6px_13px_rgba(0,0,0,.12)] transition-transform duration-300 [transition-timing-function:var(--ease-spring)] focus-visible:outline-none active:scale-110",
          value == null && "opacity-70",
        )}
      />
    </RSlider.Root>
  );
}
