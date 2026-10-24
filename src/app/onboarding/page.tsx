import { OnboardingFlow } from "./flow";
import { getMyRodas, requireViewer } from "@/lib/data";
import { IS_DEMO } from "@/lib/env";

export const metadata = { title: "Bem-vindo" };

export default async function OnboardingPage() {
  const [viewer, rodas] = await Promise.all([requireViewer(), getMyRodas()]);
  return (
    <div className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-10">
      <OnboardingFlow profile={viewer.profile} hasRoda={rodas.length > 0} demo={IS_DEMO} />
    </div>
  );
}
