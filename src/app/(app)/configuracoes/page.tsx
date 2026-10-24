import Link from "next/link";
import { AccountSection, AppearanceSection, DataSection, PrivacySection, ProfileSection } from "./sections";
import { PageHeader } from "@/components/ui/misc";
import { getMyConsents, getShop, requireViewer } from "@/lib/data";
import { IS_DEMO } from "@/lib/env";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const [viewer, consents, shop] = await Promise.all([requireViewer(), getMyConsents(), getShop()]);
  const themes = shop.items.filter((i) => i.kind === "theme" && (i.price === 0 || shop.owned.includes(i.key)));
  const styleItems = shop.items.filter((i) => i.kind === "frame" || i.kind === "title");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Configurações" title="Sua conta" />
      <div className="space-y-6">
        <ProfileSection profile={viewer.profile} styleItems={styleItems} owned={shop.owned} demo={IS_DEMO} />
        <AppearanceSection themes={themes} active={viewer.profile.active_theme} demo={IS_DEMO} />
        <PrivacySection isPublic={viewer.profile.is_public} demo={IS_DEMO} />
        <AccountSection email={viewer.email} demo={IS_DEMO} />
        <DataSection consents={consents} demo={IS_DEMO} />
        <p className="pb-4 text-center text-xs text-faint">
          Avalie Bolados · <Link href="/termos" className="hover:text-fg">Termos</Link> ·{" "}
          <Link href="/privacidade" className="hover:text-fg">Privacidade</Link> · <Link href="/como-usar" className="hover:text-fg">Como usar</Link>
        </p>
      </div>
    </div>
  );
}
