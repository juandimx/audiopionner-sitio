// Genera una página pequeña por producto (y por color) en /catalogo/p/.
// Sirve para que, al enviar el enlace por WhatsApp, se vea la foto del producto.
// Uso: node tools/generar-enlaces-catalogo.js   (correr de nuevo cuando cambien los productos)
const fs = require("fs"), path = require("path");
const P = require("../products.js");
const SITE = "https://audiopionnerdemo.netlify.app";
const out = path.join(__dirname, "..", "catalogo", "p");
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const plain = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const slugify = (s) => plain(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
let n = 0;
for (const p of P) {
  const variants = p.colors && p.colors.length ? p.colors.map((c, i) => ({ c, i })) : [{ c: null, i: 0 }];
  for (const { c, i } of variants) {
    const file = slugify(p.name + (c ? " " + c.name : "")) + ".html";
    const title = p.name + (c ? " – " + c.name : "") + " | AudioPionner";
    const img = SITE + "/" + (c ? c.image : p.image);
    const target = `../producto.html?id=${p.id}${c ? "&color=" + i : ""}`;
    fs.writeFileSync(path.join(out, file), `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${esc(p.description)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="AudioPionner">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:image" content="${img}">
<meta property="og:url" content="${SITE}/catalogo/p/${file}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${SITE}/catalogo/${target.slice(3)}">
</head><body><a href="${target}">Ver ${esc(p.name)}</a><script>location.replace(${JSON.stringify(target)})</script></body></html>`);
    n++;
  }
}
console.log(n, "enlaces generados en catalogo/p/");
