import Link from "next/link";
import { PageHeader } from "@/components/ui/misc";
import { CRITERIA } from "@/lib/criteria";
import { LEVEL_TIERS, XP_RULES } from "@/lib/levels";

export const metadata = { title: "Como usar" };

const STEPS = [
  { t: "Entre numa roda", d: "Em Rodas, crie a sua ou cole o código de 8 letras que um amigo mandou. Cada roda tem ranking e histórico próprios.", href: "/rodas" },
  { t: "Registre o bolado", d: "Toque no + dourado. Marque o que tem dentro (tabaco, flor, prensado, dry, haxixe, ice, rosin…): o tipo (tabaco, beck, mesclado ou cumbaibeck) se define sozinho. Depois quem bolou, dia e hora, seda, tamanho, piteira e fotos.", href: "/bolados/novo" },
  { t: "A roda avalia", d: "Cada pessoa abre o bolado e toca em Avaliar. Primeiro o pré-crema (antes de acender), depois o pós-crema.", href: "/inicio" },
  { t: "A calculadora soma", d: "Cada critério tem peso. A nota do avaliador é a média ponderada; a nota final do bolado é a média dos avaliadores.", href: "/ranking" },
  { t: "Suba no ranking", d: "A Nota Ouro ordena o ranking. Tudo rende XP e Brasas para gastar na loja.", href: "/loja" },
];

export default function ComoUsarPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <PageHeader eyebrow="Guia" title="Como usar o Avalie Bolados" subtitle="Em cinco passos, do bolado ao pódio." />

      <ol className="space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.t}>
            <Link href={s.href} className="card flex gap-4 p-5 transition hover:border-line-strong">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foil font-mono font-bold text-accent-fg">{i + 1}</span>
              <div>
                <p className="font-semibold">{s.t}</p>
                <p className="text-sm text-muted">{s.d}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <section className="card p-6">
        <h2 className="font-display text-[22px] font-bold">Os critérios</h2>
        <div className="mt-4 divide-y divide-line">
          {CRITERIA.map((c) => (
            <div key={c.key} className="py-4">
              <p className="font-semibold">
                {c.label} <span className="ml-1 font-mono text-xs text-accent">peso {c.weight.toLocaleString("pt-BR")}</span>
                <span className="ml-2 text-xs text-faint">{c.phase === "pre" ? "pré-crema" : "pós-crema"}{c.optional ? " · opcional" : ""}</span>
              </p>
              <p className="text-sm text-muted">{c.description}</p>
              <p className="mt-1 text-xs text-faint">Checklist: {c.checklist.join(" · ")}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-line bg-bg-2 p-4 text-sm text-muted">
          <p className="font-medium text-fg">Exemplo de conta</p>
          <p className="mt-1 font-mono text-xs leading-relaxed">
            Estética 9 ×1 + Construção 8 ×1,5 + Crema 10 ×1,5 + Sabor 9 ×1 + Experiência 9 ×1
            <br />= (9 + 12 + 15 + 9 + 9) ÷ (1 + 1,5 + 1,5 + 1 + 1) = 54 ÷ 6 = <strong className="text-accent">9,00</strong>
          </p>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-[20px] font-bold">XP e Brasas</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {XP_RULES.map((r) => (
              <li key={r.action} className="flex justify-between gap-3">
                <span className="text-muted">{r.action}</span>
                <span className="shrink-0 font-mono text-xs">{r.xp ? `+${r.xp} XP · ` : ""}+{r.brasas} 🔥</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-[20px] font-bold">Níveis</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {LEVEL_TIERS.map((t) => (
              <li key={t.level} className="flex justify-between">
                <span className="text-muted">{t.title}</span>
                <span className="font-mono text-xs">Nv. {t.level}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-[20px] font-bold">Regras do jogo</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>Ninguém avalia o próprio bolado.</li>
          <li>Cada pessoa avalia um bolado uma vez e pode editar nas primeiras 24 horas.</li>
          <li>O critério Bolar é opcional: se você não viu o bolamento, pule e ele sai da conta.</li>
          <li>Donos e admins podem mudar o peso de cada critério da roda.</li>
          <li>Seu rascunho de avaliação fica salvo no aparelho se você sair no meio.</li>
          <li>Instale como app: no celular, use “Adicionar à tela inicial” no menu do navegador.</li>
        </ul>
      </section>
    </div>
  );
}
