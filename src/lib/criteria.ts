import type { Criterion, CriterionKey } from "./types";

/**
 * Espelho dos critérios do banco (supabase/migrations/*_seed_catalog.sql).
 * O banco é a fonte da verdade para a nota oficial; este espelho alimenta a
 * calculadora ao vivo e o modo demonstração.
 */
export const CRITERIA: Criterion[] = [
  {
    key: "bolar",
    phase: "pre",
    label: "Bolar",
    description: "Avaliação durante o bolamento: técnica, cuidado e capricho na hora de bolar.",
    weight: 0.5,
    optional: true,
    sort: 1,
    checklist: [
      "Preparou o material com cuidado",
      "Sem desperdício",
      "Técnica firme e confiante",
      "Tempo de bolamento razoável",
      "Deixou tudo limpo no final",
    ],
  },
  {
    key: "estetica",
    phase: "pre",
    label: "Estética",
    description: "Aparência do bolado antes de acender: formato, acabamento e capricho visual.",
    weight: 1,
    optional: false,
    sort: 2,
    checklist: [
      "Formato uniforme",
      "Papel liso, sem rasgos ou rugas",
      "Ponta bem fechada",
      "Piteira alinhada e centralizada",
      "Colagem limpa, sem excesso",
    ],
  },
  {
    key: "construcao",
    phase: "pre",
    label: "Construção",
    description: "O construto: firmeza, distribuição do material e encaixe da piteira.",
    weight: 1.5,
    optional: false,
    sort: 3,
    checklist: [
      "Firmeza certa: nem mole, nem socado",
      "Material bem distribuído",
      "Sem pontos ocos",
      "Piteira bem encaixada",
      "Proporção piteira e corpo equilibrada",
    ],
  },
  {
    key: "crema",
    phase: "pos",
    label: "Crema",
    description: "Consistência da crema e fluxo de ar depois de acender.",
    weight: 1.5,
    optional: false,
    sort: 4,
    checklist: ["Queima uniforme, sem canoa", "Cinza firme", "Não apagou sozinho", "Puxada no ponto", "Não esquentou demais"],
  },
  {
    key: "sabor",
    phase: "pos",
    label: "Sabor",
    description: "Gosto pessoal do avaliador.",
    weight: 1,
    optional: false,
    sort: 5,
    checklist: ["Sabor agradável", "Sem gosto de papel queimado", "Fumaça suave", "Aroma marcante"],
  },
  {
    key: "experiencia",
    phase: "pos",
    label: "Experiência",
    description: "Como foi para o avaliador o momento que o candidato proporcionou.",
    weight: 1,
    optional: false,
    sort: 6,
    checklist: ["Momento agradável", "Boa resenha e boa vibe", "Duração adequada", "Fumaria outro desse"],
  },
];

export const CRITERION_LABEL: Record<CriterionKey, string> = Object.fromEntries(
  CRITERIA.map((c) => [c.key, c.label]),
) as Record<CriterionKey, string>;

export const PHASE_LABEL = { pre: "Pré-crema", pos: "Pós-crema" } as const;
