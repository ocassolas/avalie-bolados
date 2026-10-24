import { describe, expect, it } from "vitest";
import { TIERS, TIER_MIN_BOLADOS, tierFor } from "./tiers";

describe("tierFor", () => {
  it("fica em calibração com poucos bolados avaliados", () => {
    const t = tierFor(9.8, TIER_MIN_BOLADOS - 1);
    expect(t.status).toBe("calibrating");
    if (t.status === "calibrating") expect(t.remaining).toBe(1);
  });
  it("sem nota não tem rank", () => expect(tierFor(null, 10).status).toBe("calibrating"));
  it("pega a faixa certa e quanto falta para a próxima", () => {
    const t = tierFor(7.6, 5);
    expect(t.status).toBe("ranked");
    if (t.status === "ranked") {
      expect(t.tier.name).toBe(TIERS[3]!.name);
      expect(t.next?.name).toBe(TIERS[4]!.name);
      expect(t.toNext).toBe(0.4);
    }
  });
  it("a nota mínima da faixa já conta", () => {
    const t = tierFor(TIERS[2]!.min, 3);
    if (t.status === "ranked") expect(t.index).toBe(2);
  });
  it("o topo não tem próxima faixa", () => {
    const t = tierFor(10, 30);
    if (t.status === "ranked") {
      expect(t.index).toBe(TIERS.length - 1);
      expect(t.next).toBeNull();
    }
  });
  it("faixas em ordem crescente", () => {
    for (let i = 1; i < TIERS.length; i++) expect(TIERS[i]!.min).toBeGreaterThan(TIERS[i - 1]!.min);
  });
});
