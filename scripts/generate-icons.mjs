import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const logo = readFileSync(resolve(root, "public/sprintly-logo.svg"), "utf8")
  .replace(/<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");

const outDir = resolve(root, "public/icons");

// A square icon: optional full-bleed background, logo centered with padding.
function icon({ size, background, pad, out }) {
  const inner = size - pad * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${background}"/>
  <svg x="${pad}" y="${pad}" width="${inner}" height="${inner}" viewBox="0 0 112 112">${logo}</svg>
</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
  writeFileSync(resolve(outDir, out), png);
  console.log(`wrote public/icons/${out} (${size}x${size})`);
}

mkdirSync(outDir, { recursive: true });

// iOS home screen icon (no transparency)
icon({ size: 180, background: "#ffffff", pad: 16, out: "apple-touch-icon.png" });
icon({ size: 192, background: "#ffffff", pad: 18, out: "icon-192.png" });
icon({ size: 512, background: "#ffffff", pad: 48, out: "icon-512.png" });

// Maskable icon: brand blue bleeds to the edges, logo kept inside the 80% safe zone
icon({ size: 512, background: "#2563eb", pad: 112, out: "maskable-512.png" });
