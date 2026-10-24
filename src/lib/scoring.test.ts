import { describe, expect, it } from "vitest";
import { CRITERIA } from "./criteria";
import { levelForXp, xpForLevel } from "./levels";
import { computePartial, computeTotal, notaOuro } from "./scoring";

const all = { estetica: 9, construcao: 8.5, crema: 10, sabor: 9, experiencia: 9.5 } as const;

describe("computeTotal", () => {
  it("bate com o banco quando Bolar é pulado (caso do teste SQL: 9,21)", () => {
    expect(computeTotal(CRITERIA, all)).toBe(9.21);
  });

  it("inclui Bolar quando preenchido (caso do teste SQL: 9,46)", () => {
    expect(computeTotal(CRITERIA, { bolar: 10, estetica: 9, construcao: 9, crema: 10, sabor: 9, experiencia: 10 })).toBe(9.46);
  });

  it("retorna null se faltar critério obrigatório", () => {
    expect(computeTotal(CRITERIA, { estetica: 9 })).toBeNull();
  });

  it("respeita pesos da roda", () => {
    const t = computeTotal(CRITERIA, { estetica: 10, construcao: 0, crema: 10, sabor: 10, experiencia: 10 }, { construcao: 0 });
    expect(t).toBe(10);
  });

  it("exemplo do guia dá 9,00", () => {
    expect(computeTotal(CRITERIA, { estetica: 9, construcao: 8, crema: 10, sabor: 9, experiencia: 9 })).toBe(9);
  });
});

describe("computePartial", () => {
  it("calcula só o que já foi preenchido", () => {
    expect(computePartial(CRITERIA, { estetica: 8, construcao: 10 })).toBe(9.2);
    expect(computePartial(CRITERIA, {})).toBeNull();
  });
});

describe("notaOuro", () => {
  it("puxa poucos bolados para a média da roda", () => {
    expect(notaOuro(10, 1, 7)).toBe(7.75);
    expect(notaOuro(9, 20, 7)).toBe(8.74);
  });
});

describe("níveis", () => {
  it("é o inverso da curva 100·(n−1)^1.5", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    for (let n = 1; n < 30; n++) expect(levelForXp(xpForLevel(n))).toBe(n);
  });
});
