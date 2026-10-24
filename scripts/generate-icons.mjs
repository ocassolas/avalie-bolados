// Gera ícones e imagens da marca a partir de public/brand/logo-mark.svg
// Uso: node scripts/generate-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = new URL("../", import.meta.url);
const p = (rel) => new URL(rel, root);

const markSvg = await readFile(p("public/brand/logo-mark.svg"), "utf8");
// Conteúdo interno do SVG (sem a tag <svg>) para reaproveitar em composições
const markInner = markSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

const bg = `
  <defs>
    <radialGradient id="ab-bg" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="#1C1915"/>
      <stop offset="1" stop-color="#060606"/>
    </radialGradient>
  </defs>`;

// Ícone de app: quadrado arredondado preto com a marca
const appIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}
  <rect width="512" height="512" rx="112" fill="url(#ab-bg)"/>
  <rect x="1.5" y="1.5" width="509" height="509" rx="110.5" fill="none" stroke="#E9AE45" stroke-opacity=".18" stroke-width="3"/>
  <g transform="translate(56 50) scale(.78)">${markInner}</g>
</svg>`;

// Maskable (Android): fundo sangrado, marca dentro da zona segura de 80%
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}
  <rect width="512" height="512" fill="url(#ab-bg)"/>
  <g transform="translate(102 98) scale(.6)">${markInner}</g>
</svg>`;

// Logo horizontal com nome
const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1240 300" role="img" aria-label="Avalie Bolados">
  <g transform="translate(0 -6) scale(.6)">${markInner}</g>
  <text x="300" y="150" font-family="Fraunces, Georgia, 'Times New Roman', serif" font-size="112" font-weight="600" fill="#F4EFE6" letter-spacing="-2">Avalie</text>
  <text x="300" y="262" font-family="Fraunces, Georgia, 'Times New Roman', serif" font-size="112" font-weight="600" font-style="italic" fill="url(#ab-gold)" letter-spacing="-2">Bolados</text>
</svg>`;

// Imagem de compartilhamento (Open Graph)
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="og-bg" cx="28%" cy="45%" r="80%">
      <stop offset="0" stop-color="#211C14"/>
      <stop offset="1" stop-color="#070707"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#og-bg)"/>
  <g transform="translate(70 70) scale(.95)">${markInner}</g>
  <text x="600" y="270" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-weight="700" fill="#F4EFE6">Avalie</text>
  <text x="600" y="380" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-weight="700" font-style="italic" fill="url(#ab-gold)">Bolados</text>
  <text x="604" y="460" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#BFB6A8">O troféu é de quem bola.</text>
</svg>`;

await writeFile(p("public/brand/app-icon.svg"), appIcon);
await writeFile(p("public/brand/maskable.svg"), maskable);
await writeFile(p("public/brand/logo-full.svg"), full);
await writeFile(p("src/app/icon.svg"), appIcon);

const png = (svg, size, out) =>
  sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toFile(new URL(out, root).pathname.slice(1));

await png(appIcon, 192, "public/icon-192.png");
await png(appIcon, 512, "public/icon-512.png");
await png(maskable, 512, "public/maskable-512.png");
await png(maskable, 180, "src/app/apple-icon.png");
await png(markSvg, 1024, "public/brand/logo-mark-1024.png");
await sharp(Buffer.from(og), { density: 144 }).resize(1200, 630).png().toFile(new URL("src/app/opengraph-image.png", root).pathname.slice(1));
await sharp(Buffer.from(full), { density: 300 }).resize(1240, 300).png().toFile(new URL("public/brand/logo-full.png", root).pathname.slice(1));

const icoSizes = await Promise.all(
  [16, 32, 48].map((s) => sharp(Buffer.from(appIcon), { density: 384 }).resize(s, s).png().toBuffer()),
);
await writeFile(p("src/app/favicon.ico"), await pngToIco(icoSizes));

console.log("Ícones gerados.");
