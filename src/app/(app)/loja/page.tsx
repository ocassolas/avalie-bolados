import { Flame } from "lucide-react";
import { ShopGrid } from "./shop-grid";
import { PageHeader } from "@/components/ui/misc";
import { getShop, requireViewer } from "@/lib/data";
import { IS_DEMO } from "@/lib/env";

export const metadata = { title: "Loja" };

export default async function LojaPage() {
  const [viewer, shop] = await Promise.all([requireViewer(), getShop()]);
  const p = viewer.profile;
  return (
    <div>
      <PageHeader
        eyebrow="Loja"
        title="Gaste suas Brasas"
        subtitle="Temas mudam o app inteiro. Molduras e títulos aparecem no ranking e no seu perfil."
        action={
          <div className="card flex items-center gap-3 px-5 py-3">
            <Flame className="h-6 w-6 text-ember" />
            <div>
              <p className="font-mono text-2xl font-semibold tabular">{p.brasas}</p>
              <p className="text-[11px] text-faint">Brasas</p>
            </div>
          </div>
        }
      />
      <ShopGrid
        items={shop.items}
        owned={shop.owned}
        brasas={p.brasas}
        level={p.level}
        active={{ theme: p.active_theme, frame: p.active_frame, title: p.active_title }}
        name={p.display_name}
        avatarUrl={p.avatar_url ?? null}
        demo={IS_DEMO}
      />
    </div>
  );
}
