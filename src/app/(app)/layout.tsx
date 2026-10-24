import { BottomNav, Sidebar } from "@/components/shell/nav";
import { DemoBanner, TopBar } from "@/components/shell/topbar";
import { requireViewer } from "@/lib/data";
import { IS_DEMO } from "@/lib/env";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await requireViewer();
  return (
    <div className="relative z-10 min-h-dvh">
      <Sidebar profile={viewer.profile} />
      <div className="lg:pl-64">
        {IS_DEMO && <DemoBanner />}
        <TopBar profile={viewer.profile} />
        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:pb-16 lg:pt-10">{children}</main>
      </div>
      <BottomNav username={viewer.profile.username} />
    </div>
  );
}
