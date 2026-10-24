import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { getViewer } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

// No iPhone/Mac vale a SF do sistema; Inter cobre Android e Windows.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Avalie Bolados", template: "%s · Avalie Bolados" },
  description: "Checklist, notas e ranking para a sua roda avaliar bolados: tabaco, beck, mesclado, cumbaibeck e o que mais for pra seda. O troféu é de quem bola.",
  applicationName: "Avalie Bolados",
  appleWebApp: { capable: true, title: "Avalie Bolados", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
  openGraph: { type: "website", locale: "pt_BR", siteName: "Avalie Bolados" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  const theme = viewer?.profile.active_theme ?? "ouro";
  return (
    <html lang="pt-BR" data-theme={theme} className={`${inter.variable} h-full antialiased`}>
      <body className="relative min-h-full">
        {children}
        <Toaster
          position="top-center"
          theme={theme === "neblina" ? "light" : "dark"}
          toastOptions={{
            style: {
              background: "color-mix(in oklab, var(--surface-2) 85%, transparent)",
              backdropFilter: "saturate(180%) blur(24px)",
              border: "0.5px solid var(--line)",
              borderRadius: 18,
              color: "var(--fg)",
            },
          }}
        />
      </body>
    </html>
  );
}
