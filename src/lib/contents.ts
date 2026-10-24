import type { BoladoType } from "./types";

/**
 * Catálogo do que pode ir dentro da seda. Espelhado no banco
 * (supabase/migrations/*_contents.sql): a constraint de chaves válidas e a
 * função derive_bolado_type usam as mesmas chaves e grupos.
 */
export type ContentGroup = "tabaco" | "cannabis" | "ervas" | "aditivo";

export type ContentItem = { key: string; label: string; hint: string; group: ContentGroup };

export const CONTENTS: ContentItem[] = [
  // Tabaco
  { key: "tabaco_desfiado", label: "Tabaco desfiado", hint: "fumo de enrolar solto", group: "tabaco" },
  { key: "tabaco_rolo", label: "Fumo de rolo", hint: "fumo de corda picado", group: "tabaco" },
  { key: "tabaco_aromatizado", label: "Tabaco aromatizado", hint: "com sabor ou essência de fábrica", group: "tabaco" },
  { key: "tabaco_natural", label: "Tabaco natural", hint: "orgânico, sem aditivos", group: "tabaco" },
  { key: "palheiro", label: "Fumo de palheiro", hint: "fumo goiano, para palha", group: "tabaco" },

  // Cannabis: flor e derivados
  { key: "flor", label: "Flor", hint: "bud, camarão, skunk", group: "cannabis" },
  { key: "prensado", label: "Prensado", hint: "o famoso pren", group: "cannabis" },
  { key: "flor_cbd", label: "Flor de CBD", hint: "cânhamo, pouco ou nenhum THC", group: "cannabis" },
  { key: "dry", label: "Dry", hint: "dry sift, extração a seco", group: "cannabis" },
  { key: "kief", label: "Kief", hint: "pólen, tricoma do dichavador", group: "cannabis" },
  { key: "haxixe", label: "Haxixe", hint: "hash, marrom ou preto", group: "cannabis" },
  { key: "ice", label: "Ice", hint: "ice-o-lator, bubble hash", group: "cannabis" },
  { key: "crumble", label: "Crumble", hint: "extração seca e esfarelada", group: "cannabis" },
  { key: "rosin", label: "Rosin", hint: "extração na prensa com calor", group: "cannabis" },
  { key: "wax", label: "Wax / Budder", hint: "extração cremosa", group: "cannabis" },
  { key: "shatter", label: "Shatter", hint: "extração vítrea", group: "cannabis" },
  { key: "oleo", label: "Óleo / BHO", hint: "óleo, live resin, distillate", group: "cannabis" },
  { key: "moonrock", label: "Moonrock", hint: "flor com óleo e kief", group: "cannabis" },

  // Ervas naturais (cumbaibeck; chave interna "cumbaia"): sem tabaco, THC ou CBD
  { key: "ervas_blend", label: "Blend de ervas", hint: "substituto do tabaco", group: "ervas" },
  { key: "ervas_aromaticas", label: "Ervas aromáticas", hint: "hortelã, lavanda, camomila", group: "ervas" },

  // Aditivos (não mudam o tipo)
  { key: "mentol", label: "Mentol", hint: "cápsula ou cristal", group: "aditivo" },
  { key: "essencia", label: "Essência", hint: "aroma adicionado na hora", group: "aditivo" },
];

export const CONTENT_GROUPS: { group: ContentGroup; title: string; text: string }[] = [
  { group: "tabaco", title: "Tabaco", text: "A base de fumo" },
  { group: "cannabis", title: "Flor e extrações", text: "Cannabis e derivados" },
  { group: "ervas", title: "Ervas", text: "Naturais, sem THC ou CBD" },
  { group: "aditivo", title: "Aditivos", text: "Sabor e refrescância" },
];

export const CONTENT_BY_KEY = Object.fromEntries(CONTENTS.map((c) => [c.key, c])) as Record<string, ContentItem>;
export const CONTENT_KEYS = CONTENTS.map((c) => c.key);

/** Mesma regra de public.derive_bolado_type. Null quando falta uma base. */
export function deriveType(keys: string[]): BoladoType | null {
  const groups = new Set(keys.map((k) => CONTENT_BY_KEY[k]?.group));
  const t = groups.has("tabaco");
  const c = groups.has("cannabis");
  if (t && c) return "mesclado";
  if (t) return "tabaco";
  if (c) return "beck";
  if (groups.has("ervas")) return "cumbaia";
  return null;
}

/** Texto curto do que tem dentro: "Tabaco desfiado + Ice". */
export function contentsSummary(keys: string[] | null | undefined, max = 3) {
  if (!keys?.length) return null;
  const labels = keys.map((k) => CONTENT_BY_KEY[k]?.label ?? k);
  return labels.length > max ? `${labels.slice(0, max).join(" + ")} +${labels.length - max}` : labels.join(" + ");
}

export const TYPE_INFO: Record<BoladoType, { label: string; hint: string }> = {
  tabaco: { label: "Tabaco", hint: "Só tabaco" },
  beck: { label: "Beck", hint: "Só flor ou extração" },
  mesclado: { label: "Mesclado", hint: "Tabaco misturado com flor ou extração" },
  cumbaia: { label: "Cumbaibeck", hint: "Só ervas naturais, sem tabaco, THC ou CBD" },
};

export const BOLADO_TYPES = Object.keys(TYPE_INFO) as BoladoType[];

export const PAPERS = [
  "Seda brown / natural",
  "Seda branca",
  "Seda de cânhamo",
  "Seda de arroz",
  "Seda transparente (celulose)",
  "Seda com sabor",
  "Blunt (folha de tabaco)",
  "Blunt de cânhamo",
  "Palha de milho",
  "Cone pronto",
];

export const PAPER_SIZES = ["Mini", "1¼", "King Size Slim", "King Size", "Longa / Mega"];

export const FILTERS = [
  "Piteira de papel (dobrada)",
  "Piteira de papelão pré-cortada",
  "Piteira de vidro",
  "Piteira de cerâmica",
  "Piteira de madeira",
  "Filtro de carvão ativado",
  "Filtro de algodão (slim)",
  "Sem piteira",
];
