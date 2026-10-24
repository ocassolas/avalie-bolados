import { cloneElement, isValidElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Repassa props para o único filho (ex.: <Button asChild><Link/></Button>). */
export function Slot({ children, className, ...props }: HTMLAttributes<HTMLElement> & { children?: ReactNode }) {
  if (!isValidElement(children)) return null;
  const child = children as ReactElement<{ className?: string }>;
  return cloneElement(child, { ...props, className: cn(className, child.props.className) } as never);
}
