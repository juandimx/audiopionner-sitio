/* ============================================
   AudioPionner — main.js
   Carrito (localStorage), modo oscuro, helpers compartidos
   ============================================ */

const STORE_INFO = {
  whatsapp: "573163845802",
  phone: "316 384 5802",
  manager: "Sr. Carlos Rodríguez",
  stores: [
    { city: "Santa Marta", address: "Cra 5ta con Calle 13" },
    { city: "Santa Marta", address: "Cra 5ta con Calle 11 y 12" },
    { city: "Santa Marta", address: "San Andresito, Local 160" },
    { city: "Santa Marta", address: "Calle 22 No. 5-21, Local 2" },
    { city: "Ciénaga", address: "Calle 17 #18-05" },
  ].map((s) => ({
    ...s,
    maps: "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(`AudioPionner ${s.address}, ${s.city}, Magdalena`),
  })),
};

/* ---------- Formato de moneda ---------- */
function formatCOP(value) {
  return "$" + Math.round(value).toLocaleString("es-CO");
}

/* ---------- Tarjeta de producto (compartida por todas las páginas) ---------- */
function productCard(p) {
  const base = relPath();
  const hasDiscount = p.price != null && p.compareAtPrice && p.compareAtPrice > p.price;
  const pct = hasDiscount ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0;
  return `
  <a href="${base}producto.html?id=${p.id}" class="product-card">
    <div class="img-wrap" style="--img:url('${base}${p.image}')">
      ${hasDiscount ? `<span class="badge">-${pct}%</span>` : ""}
      <img src="${base}${p.image}" alt="${p.name}" loading="lazy" width="600" height="600">
    </div>
    <div class="body">
      <span class="cat">${p.subcategoryLabel}</span>
      <span class="name">${p.name}</span>
      ${p.colors && p.colors.length ? `<span class="dots" aria-label="${p.colors.length} colores">${p.colors.map(c=>`<i style="--c:${c.hex}" title="${c.name}"></i>`).join("")}</span>` : ""}
      <div class="price-row">
        ${p.price != null
          ? `<span class="price">${formatCOP(p.price)}</span>`
          : `<span class="price price-quote">Precio por WhatsApp</span>`}
        ${hasDiscount ? `<span class="price-old">${formatCOP(p.compareAtPrice)}</span>` : ""}
      </div>
    </div>
  </a>`;
}

/* ---------- Tema claro/oscuro ---------- */
function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem("ap_theme"); } catch (e) {}
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("ap_theme", next); } catch (e) {}
  updateThemeIcon();
}
function updateThemeIcon() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  btn.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  btn.innerHTML = isDark
    ? '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
    : '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

/* ---------- Carrito (localStorage) ---------- */
function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem("ap_cart") || "[]");
    return typeof PRODUCTS === "undefined" ? cart : cart.filter((i) => hasPrice(i.id));
  } catch (e) {
    return [];
  }
}
function saveCart(cart) {
  try { localStorage.setItem("ap_cart", JSON.stringify(cart)); } catch (e) {}
  updateCartCount();
}
function hasPrice(productId) {
  const p = PRODUCTS.find((p) => p.id === productId);
  return !!(p && p.price != null);
}
function addToCart(productId, qty = 1) {
  if (!hasPrice(productId)) return;
  const cart = getCart();
  const existing = cart.find((i) => i.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }
  saveCart(cart);
  openCartDrawer();
}
function removeFromCart(productId) {
  let cart = getCart().filter((i) => i.id !== productId);
  saveCart(cart);
  renderCartDrawer();
  if (typeof renderCartPage === "function") renderCartPage();
}
function setQty(productId, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === productId);
  if (item) {
    item.qty = Math.max(1, qty);
    saveCart(cart);
    renderCartDrawer();
    if (typeof renderCartPage === "function") renderCartPage();
  }
}
function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}
function cartSubtotal() {
  const cart = getCart();
  return cart.reduce((sum, i) => {
    const p = PRODUCTS.find((p) => p.id === i.id);
    return p ? sum + p.price * i.qty : sum;
  }, 0);
}
function updateCartCount() {
  document.querySelectorAll(".cart-count").forEach((el) => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });
}

/* ---------- Cart Drawer (inyectado en todas las páginas) ---------- */
function injectCartDrawer() {
  if (document.getElementById("cartDrawer")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="cart-overlay" id="cartOverlay" onclick="closeCartDrawer()"></div>
    <aside class="cart-drawer" id="cartDrawer">
      <div class="cart-head">
        <h3>Tu carrito</h3>
        <button class="icon-btn" onclick="closeCartDrawer()" aria-label="Cerrar carrito">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="cart-items" id="cartItemsWrap"></div>
      <div class="cart-foot" id="cartFoot"></div>
    </aside>
  `;
  document.body.appendChild(wrap);
}
function openCartDrawer() {
  renderCartDrawer();
  document.getElementById("cartOverlay").classList.add("open");
  document.getElementById("cartDrawer").classList.add("open");
}
function closeCartDrawer() {
  document.getElementById("cartOverlay").classList.remove("open");
  document.getElementById("cartDrawer").classList.remove("open");
}
function renderCartDrawer() {
  const cart = getCart();
  const itemsWrap = document.getElementById("cartItemsWrap");
  const foot = document.getElementById("cartFoot");
  if (!itemsWrap) return;

  if (cart.length === 0) {
    itemsWrap.innerHTML = `<div class="empty-state">
      <p>Tu carrito está vacío</p>
      <a href="${relPath()}muebles.html" class="btn btn-primary btn-sm" style="margin-top:12px;">Ver muebles</a>
    </div>`;
    foot.innerHTML = "";
    return;
  }

  itemsWrap.innerHTML = cart
    .map((item) => {
      const p = PRODUCTS.find((p) => p.id === item.id);
      if (!p) return "";
      return `
      <div class="cart-item">
        <img src="${relPath()}${p.image}" alt="${p.name}">
        <div class="ci-info">
          <div class="ci-name">${p.name}</div>
          <div class="ci-price">${formatCOP(p.price)} × 
            <button class="qty-mini" onclick="setQty(${p.id}, ${item.qty - 1})" aria-label="Quitar uno">–</button>
            ${item.qty}
            <button class="qty-mini" onclick="setQty(${p.id}, ${item.qty + 1})" aria-label="Agregar uno">+</button>
          </div>
          <button class="ci-remove" onclick="removeFromCart(${p.id})">Eliminar</button>
        </div>
      </div>`;
    })
    .join("");

  foot.innerHTML = `
    <div class="cart-subtotal"><span>Subtotal</span><span>${formatCOP(cartSubtotal())}</span></div>
    <a href="${relPath()}checkout.html" class="btn btn-accent btn-block">Finalizar compra</a>
    <a href="${relPath()}carrito.html" class="btn btn-ghost btn-block" style="margin-top:8px;">Ver carrito completo</a>
  `;
}

/* ---------- Utilidad de rutas relativas ---------- */
function relPath() {
  const el = document.querySelector("[data-relpath]");
  return el ? el.getAttribute("data-relpath") : "";
}

/* ---------- Header / Nav compartido ---------- */
function renderHeader() {
  const mount = document.getElementById("siteHeader");
  if (!mount) return;
  const base = relPath();
  const links = [
    ["muebles.html", "Muebles"],
    ["muebles.html?sub=sala", "Salas"],
    ["muebles.html?sub=comedor", "Comedores"],
    ["muebles.html?sub=camas", "Camas"],
    ["muebles.html?sub=closets", "Closets"],
    ["muebles.html?promo=1", "Promociones"],
    ["tiendas.html", "Tiendas"],
  ];
  const navLinks = links.map(([href, label]) => `<a href="${base}${href}">${label}</a>`).join("");
  mount.innerHTML = `
    <div class="announce">Envíos a todo Colombia · Compra online y recoge en tienda · Financiación con Addi, Alo Credit, Sistecrédito y Banco de Bogotá</div>
    <header class="site-header">
      <div class="header-inner">
        <button class="icon-btn mobile-nav-toggle" id="mobileNavToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="mobileNav" onclick="toggleMobileNav()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <a href="${base}index.html" class="logo-link" aria-label="AudioPionner, ir al inicio">
          <img src="${base}logo.png" alt="AudioPionner">
        </a>
        <nav class="main-nav" aria-label="Principal">${navLinks}</nav>
        <div class="header-actions">
          <button class="icon-btn" id="themeToggle" onclick="toggleTheme()" aria-label="Cambiar tema"></button>
          <button class="icon-btn" onclick="openCartDrawer()" aria-label="Abrir carrito">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span class="cart-count" style="display:none;">0</span>
          </button>
        </div>
      </div>
      <nav class="mobile-nav" id="mobileNav" aria-label="Menú móvil" hidden>
        ${navLinks}
        <a href="https://wa.me/${STORE_INFO.whatsapp}" target="_blank" rel="noopener" class="mobile-nav-wa">Escríbenos por WhatsApp</a>
      </nav>
    </header>
  `;
  updateThemeIcon();
}
function toggleMobileNav(force) {
  const nav = document.getElementById("mobileNav");
  const btn = document.getElementById("mobileNavToggle");
  if (!nav || !btn) return;
  const open = typeof force === "boolean" ? force : nav.hidden;
  nav.hidden = !open;
  btn.setAttribute("aria-expanded", String(open));
  btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    toggleMobileNav(false);
    if (document.getElementById("cartDrawer")?.classList.contains("open")) closeCartDrawer();
  }
});

/* ---------- Footer compartido ---------- */
function renderFooter() {
  const mount = document.getElementById("siteFooter");
  if (!mount) return;
  const base = relPath();
  mount.innerHTML = `
    <footer>
      <div class="footer-inner">
        <div>
          <div class="footer-logo"><img src="${base}logo-white.png" alt="AudioPionner"></div>
          <p style="font-size:.82rem; color:#B7C0D2; max-width:280px;">Tecnología, hogar y electrodomésticos en Santa Marta y Ciénaga. Envíos a toda Colombia.</p>
        </div>
        <div>
          <h5>Atención al cliente</h5>
          <a href="https://wa.me/${STORE_INFO.whatsapp}" target="_blank" rel="noopener">WhatsApp: ${STORE_INFO.phone}</a>
          <a href="${base}tiendas.html">Nuestras tiendas</a>
          <a href="${base}checkout.html">Recogida en tienda</a>
        </div>
        <div>
          <h5>Comprar</h5>
          <a href="${base}muebles.html?sub=sala">Juegos de sala</a>
          <a href="${base}muebles.html?sub=comedor">Juegos de comedor</a>
          <a href="${base}muebles.html?sub=camas">Camas</a>
          <a href="${base}muebles.html?sub=closets">Closets</a>
          <a href="${base}muebles.html?sub=tocadores">Tocadores</a>
          <a href="${base}muebles.html?sub=organizadores">Organizadores y gaveteros</a>
          <a href="${base}muebles.html?sub=consolas">Consolas</a>
        </div>
        <div>
          <h5>Financiación</h5>
          <span>Addi</span>
          <span>Alo Credit</span>
          <span>Sistecrédito</span>
          <span>Banco de Bogotá</span>
        </div>
      </div>
      <div class="footer-bottom">© 2026 AudioPionner · Tecnología · Hogar · Electrodomésticos — Sitio demo académico</div>
    </footer>
  `;
}

/* ---------- WhatsApp flotante ---------- */
function renderWhatsappFab() {
  if (document.getElementById("waFab")) return;
  const a = document.createElement("a");
  a.id = "waFab";
  a.className = "whatsapp-fab";
  a.href = `https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent("Hola AudioPionner, quiero más información sobre un producto.")}`;
  a.target = "_blank";
  a.rel = "noopener";
  a.setAttribute("aria-label", "Escribir a AudioPionner por WhatsApp");
  a.innerHTML = `<svg aria-hidden="true" width="27" height="27" viewBox="0 0 24 24" fill="white"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.79 14.07c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.26-.29.58-.36.77-.36.19 0 .39 0 .55.01.18.01.42-.07.65.5.24.58.81 2 .88 2.15.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.61-.07.16-.19.68-.79.87-1.06.18-.28.36-.23.6-.14.24.09 1.55.73 1.82.87.27.14.45.2.51.32.07.11.07.65-.17 1.33z"/></svg>`;
  document.body.appendChild(a);
}

/* ---------- Init global ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  injectCartDrawer();
  renderHeader();
  renderFooter();
  renderWhatsappFab();
  updateCartCount();
  updateThemeIcon();
});
