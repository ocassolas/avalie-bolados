import { describe, expect, it } from "vitest";
import { contentsSummary, deriveType } from "./contents";

describe("deriveType (mesma regra de public.derive_bolado_type)", () => {
  it("tabaco com ice vira mesclado", () => expect(deriveType(["tabaco_desfiado", "ice"])).toBe("mesclado"));
  it("só flor e extração é beck", () => expect(deriveType(["flor", "kief", "rosin"])).toBe("beck"));
  it("só tabaco é tabaco, mesmo com mentol", () => expect(deriveType(["tabaco_rolo", "mentol"])).toBe("tabaco"));
  it("blend de ervas sem tabaco é cumbaia", () => expect(deriveType(["ervas_blend", "essencia"])).toBe("cumbaia"));
  it("ervas com flor conta como beck", () => expect(deriveType(["ervas_blend", "flor"])).toBe("beck"));
  it("só aditivo não tem base", () => expect(deriveType(["mentol"])).toBeNull());
  it("resume o conteúdo", () => expect(contentsSummary(["tabaco_desfiado", "ice"])).toBe("Tabaco desfiado + Ice"));
});
