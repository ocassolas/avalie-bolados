import { z } from "zod";
import { CONTENT_KEYS, deriveType } from "./contents";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.]{3,20}$/, "Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.");

export const passwordSchema = z
  .string()
  .min(8, "A senha precisa de pelo menos 8 caracteres.")
  .max(72, "Senha longa demais.")
  .regex(/[A-Za-z]/, "Inclua pelo menos uma letra.")
  .regex(/\d/, "Inclua pelo menos um número.");

export function isAdult(birthdate: string) {
  const d = new Date(birthdate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  return d <= limit;
}

export const birthdateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de nascimento.")
  .refine(isAdult, "O Avalie Bolados é só para maiores de 18 anos.")
  .refine((v) => new Date(v) > new Date("1900-01-01"), "Data inválida.");

export const signUpSchema = z
  .object({
    display_name: z.string().trim().min(1, "Como a roda te chama?").max(40, "Máximo de 40 caracteres."),
    username: usernameSchema,
    email: z.string().trim().toLowerCase().email("E-mail inválido."),
    birthdate: birthdateSchema,
    password: passwordSchema,
    confirm: z.string(),
    consent_terms: z.literal(true, { message: "Aceite os Termos de Uso para continuar." }),
    consent_privacy: z.literal(true, { message: "Aceite a Política de Privacidade para continuar." }),
    consent_sensitive_data: z.literal(true, { message: "Precisamos do seu consentimento para tratar esses dados." }),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "As senhas não conferem." });

export const completeProfileSchema = z.object({
  display_name: z.string().trim().min(1, "Como a roda te chama?").max(40, "Máximo de 40 caracteres."),
  username: usernameSchema,
  birthdate: birthdateSchema,
  consent_terms: z.literal(true, { message: "Aceite os Termos de Uso para continuar." }),
  consent_privacy: z.literal(true, { message: "Aceite a Política de Privacidade para continuar." }),
  consent_sensitive_data: z.literal(true, { message: "Precisamos do seu consentimento para tratar esses dados." }),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Digite sua senha."),
});

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "As senhas não conferem." });

export const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Informe um nome.").max(40),
  username: usernameSchema,
  bio: z.string().trim().max(160, "Bio de até 160 caracteres.").optional().or(z.literal("")),
});

export const rodaSchema = z.object({
  name: z.string().trim().min(2, "Nome curto demais.").max(40, "Máximo de 40 caracteres."),
  description: z.string().trim().max(280).optional().or(z.literal("")),
});

export const boladoSchema = z.object({
  roda_id: z.string().uuid("Escolha a roda."),
  roller_id: z.string().uuid("Escolha quem bolou."),
  contents: z
    .array(z.enum(CONTENT_KEYS as [string, ...string[]]))
    .min(1, "Marque o que tem dentro do bolado.")
    .max(12)
    .refine((c) => deriveType(c) !== null, "Escolha pelo menos uma base: tabaco, flor/extração ou ervas."),
  mix_tobacco_pct: z.number().int().min(0).max(100).nullable().optional(),
  weight_g: z.number().positive().max(20).nullable().optional(),
  rolled_at: z.string().min(1),
  paper: z.string().trim().max(60).optional().or(z.literal("")),
  paper_size: z.string().trim().max(30).optional().or(z.literal("")),
  filter: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const evaluationSchema = z.object({
  bolado_id: z.string().uuid(),
  scores: z
    .array(
      z.object({
        key: z.enum(["bolar", "estetica", "construcao", "crema", "sabor", "experiencia"]),
        score: z.number().min(0).max(10).multipleOf(0.5),
        checklist: z.array(z.string().max(120)).max(10),
      }),
    )
    .min(5)
    .max(6),
  feedback: z.string().trim().max(1000).optional(),
  airflow: z.enum(["leve", "ideal", "pesado"]).nullable(),
});

export const mediaLinkSchema = z.object({
  bolado_id: z.string().uuid(),
  url: z
    .string()
    .trim()
    .url("Link inválido.")
    .refine((u) => u.startsWith("https://"), "Use um link https.")
    .refine((u) => /(youtube\.com|youtu\.be|instagram\.com|tiktok\.com)/.test(u), "Aceitamos links do YouTube, Instagram ou TikTok."),
  caption: z.string().trim().max(140).optional(),
});

export function firstError(e: z.ZodError) {
  return e.issues[0]?.message ?? "Dados inválidos.";
}

export function fieldErrors(e: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = String(i.path[0] ?? "_");
    out[k] ??= i.message;
  }
  return out;
}
