import Link from "next/link";
import { ChevronRight, Flame, Lock, Trophy, Users } from "lucide-react";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { CRITERIA } from "@/lib/criteria";
import { IS_DEMO } from "@/lib/env";

const STEPS = [
  { icon: Users, tone: "bg-[#0a84ff]", title: "Monte sua roda", text: "Crie um grupo e chame a galera com um código." },
  { icon: Flame, tone: "bg-ember", title: "Bole e avalie", text: "Registre com foto. Cada um avalia antes e depois de acender." },
  { icon: Trophy, tone: "bg-accent", title: "Suba no ranking", text: "As notas viram ranking, XP e Brasas para quem bola bem." },
];

export default function Landing() {
  const phases = [
    { title: "Pré-crema", sub: "Antes de acender", items: CRITERIA.filter((c) => c.phase === "pre") },
    { title: "Pós-crema", sub: "Depois de acender", items: CRITERIA.filter((c) => c.phase === "pos") },
  ];

  return (
    <div className="relative z-10">
      <header className="glass sticky top-0 z-20 border-b-[0.5px] border-line">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Wordmark size="sm" />
          <nav className="flex items-center gap-1">
            {IS_DEMO ? (
              <Button asChild variant="gold" size="sm">
                <Link href="/inicio">Ver o app</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/entrar">Entrar</Link>
                </Button>
                <Button asChild variant="gold" size="sm">
                  <Link href="/cadastro">Criar conta</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
        <div className="animate-rise flex h-28 w-28 items-center justify-center rounded-[26px] bg-surface p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] sm:h-32 sm:w-32 sm:rounded-[30px]">
          <LogoMark animated className="h-full w-full" />
        </div>
        <h1 className="mt-10 animate-rise font-display text-[44px] font-bold leading-[1.05] [animation-delay:60ms] sm:text-[64px]">
          O troféu é de <span className="text-accent">quem bola.</span>
        </h1>
        <p className="mt-5 max-w-xl animate-rise text-[17px] leading-relaxed text-muted [animation-delay:120ms] sm:text-[19px]">
          Sua roda avalia cada bolado num checklist de verdade. As notas viram ranking, e cada bolado fica guardado com foto, dia e
          hora.
        </p>
        <div className="mt-9 flex w-full animate-rise flex-col items-center gap-3 [animation-delay:180ms] sm:w-auto sm:flex-row">
          <Button asChild variant="gold" size="lg" className="w-full sm:w-auto">
            <Link href={IS_DEMO ? "/inicio" : "/cadastro"}>{IS_DEMO ? "Abrir demonstração" : "Começar agora"}</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
            <a href="#como-funciona">
              Como funciona <ChevronRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <p className="mt-6 text-[13px] text-faint">Só para maiores de 18 anos. Seus dados ficam só com a sua roda.</p>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="mx-auto max-w-2xl scroll-mt-20 px-4 py-12 sm:px-6">
        <h2 className="px-1 font-display text-[28px] font-bold">Como funciona</h2>
        <div className="list-group mt-4">
          {STEPS.map((s) => (
            <div key={s.title} className="flex items-start gap-4 px-4 py-4">
              <span className={`mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-white ${s.tone}`}>
                <s.icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-[17px] font-semibold">{s.title}</p>
                <p className="mt-0.5 text-[15px] leading-snug text-muted">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Critérios */}
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h2 className="px-1 font-display text-[28px] font-bold">O checklist</h2>
        <p className="mt-1 px-1 text-[15px] text-muted">Seis critérios, nota de 0 a 10. Cada um tem peso, e a média ponderada vira a nota.</p>
        {phases.map((phase) => (
          <div key={phase.title} className="mt-7">
            <p className="mb-2 px-4 text-[13px] uppercase text-muted">
              {phase.title} · {phase.sub}
            </p>
            <ul className="list-group">
              {phase.items.map((c) => (
                <li key={c.key} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px]">
                      {c.label} {c.optional && <span className="text-[13px] text-faint">opcional</span>}
                    </p>
                    <p className="text-[13px] leading-snug text-muted">{c.description}</p>
                  </div>
                  <span className="font-mono text-[15px] font-semibold text-accent">×{c.weight.toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Gamificação + privacidade */}
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="list-group">
          <div className="px-5 py-5">
            <p className="flex items-center gap-2 text-[17px] font-semibold">
              <Flame className="h-5 w-5 text-ember" /> XP, níveis e Brasas
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
              Cada bolado e cada avaliação rendem XP. Suba de Aprendiz de Seda até Lenda do Cone e troque Brasas por temas, molduras e
              títulos na loja.
            </p>
          </div>
          <div className="px-5 py-5">
            <p className="flex items-center gap-2 text-[17px] font-semibold">
              <Lock className="h-5 w-5 text-accent" /> Privado por padrão
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
              Seu perfil aparece só para a sua roda e as fotos ficam em armazenamento privado. Você exporta ou apaga tudo quando quiser,
              como manda a LGPD.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-2xl px-4 pb-14 pt-6 text-[13px] text-faint sm:px-6">
        <div className="flex flex-col gap-4 border-t-[0.5px] border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark size="sm" />
          <nav className="flex gap-5">
            <Link href="/termos" className="hover:text-fg">Termos de uso</Link>
            <Link href="/privacidade" className="hover:text-fg">Privacidade</Link>
          </nav>
        </div>
        <p className="mt-6 leading-relaxed">
          Aplicativo para maiores de 18 anos. O Avalie Bolados não vende, não incentiva e não facilita o consumo de nenhuma substância.
          Fumar faz mal à saúde. Respeite a legislação do seu país.
        </p>
      </footer>
    </div>
  );
}
