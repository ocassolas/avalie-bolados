"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

/** Controle segmentado do iOS que troca um parâmetro da URL. O destaque desliza até a opção ativa. */
export function PillTabs({
  options,
  active,
  basePath,
  param,
  extra,
}: {
  options: { value: string; label: string }[];
  active: string;
  basePath: string;
  param: string;
  extra?: Record<string, string | undefined>;
}) {
  const id = useId();
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <div className="inline-flex min-w-full gap-0.5 rounded-[10px] bg-fill p-[2px] sm:min-w-0">
        {options.map((o) => {
          const qs = new URLSearchParams();
          Object.entries({ ...extra, [param]: o.value }).forEach(([k, v]) => v && qs.set(k, v));
          const on = active === o.value;
          return (
            <Link
              key={o.value}
              href={`${basePath}?${qs}`}
              scroll={false}
              aria-current={on ? "true" : undefined}
              className={cn(
                "relative flex h-8 flex-1 shrink-0 items-center justify-center whitespace-nowrap rounded-[8px] px-3.5 text-[13px] transition-colors duration-200",
                on ? "font-semibold text-fg" : "font-medium text-muted hover:text-fg",
              )}
            >
              {on && (
                <motion.span
                  layoutId={`seg-${id}`}
                  className="segment-thumb absolute inset-0 rounded-[8px]"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative">{o.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
