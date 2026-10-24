import { ViewTransition } from "react";

// Templates remontam a cada navegação: a página nova entra subindo de leve,
// como no iOS. Fora de uma navegação (refresh, Suspense) não anima.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
