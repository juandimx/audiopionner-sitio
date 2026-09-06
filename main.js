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
    { city: "Ciénaga", address: "Calle 17 #18-05" },
  ],
};

/* ---------- Formato de moneda ---------- */
function formatCOP(value) {
  return "$" + Math.round(value).toLocaleString("es-CO");
}

/* ---------- Tema claro/oscuro ---------- */
function initTheme() {
  const saved = localStorage.getItem("ap_theme");
  const theme = saved || "light";
  document.documentElement.setAttribute("data-theme", theme);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("ap_theme", next);
  updateThemeIcon();
}
function updateThemeIcon() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  btn.innerHTML = isDark
    ? '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
    : '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

/* ---------- Carrito (localStorage) ---------- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("ap_cart") || "[]");
  } catch (e) {
    return [];
  }
}
function saveCart(cart) {
  localStorage.setItem("ap_cart", JSON.stringify(cart));
  updateCartCount();
}
function addToCart(productId, qty = 1) {
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
        <button class="icon-btn" onclick="closeCartDrawer()">
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
            <span style="cursor:pointer" onclick="setQty(${p.id}, ${item.qty - 1})">–</span>
            &nbsp;${item.qty}&nbsp;
            <span style="cursor:pointer" onclick="setQty(${p.id}, ${item.qty + 1})">+</span>
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
  mount.innerHTML = `
    <div class="announce">Envíos a todo Colombia · Compra online y recoge en tienda · Financiación con Addi, Alo Credit y Banco de Bogotá</div>
    <header class="site-header">
      <div class="header-inner">
        <a href="${base}index.html" class="logo-link">
          <img src="${base}images/logo/logo.png" alt="AudioPionner">
        </a>
        <nav class="main-nav">
          <a href="${base}muebles.html">Muebles</a>
          <a href="${base}muebles.html?sub=sala">Salas</a>
          <a href="${base}muebles.html?sub=comedor">Comedores</a>
          <a href="${base}muebles.html?sub=camas">Camas</a>
          <a href="${base}tiendas.html">Tiendas</a>
        </nav>
        <div class="header-actions">
          <button class="icon-btn" id="themeToggle" onclick="toggleTheme()" title="Cambiar tema"></button>
          <button class="icon-btn" onclick="openCartDrawer()" title="Carrito">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span class="cart-count" style="display:none;">0</span>
          </button>
        </div>
      </div>
    </header>
  `;
  updateThemeIcon();
}

/* ---------- Footer compartido ---------- */
function renderFooter() {
  const mount = document.getElementById("siteFooter");
  if (!mount) return;
  const base = relPath();
  mount.innerHTML = `
    <footer>
      <div class="footer-inner">
        <div>
          <div class="footer-logo"><img src="${base}images/logo/logo-white.png" alt="AudioPionner"></div>
          <p style="font-size:.82rem; color:#B7C0D2; max-width:280px;">Tecnología, hogar y electrodomésticos en Santa Marta y Ciénaga. Envíos a toda Colombia.</p>
        </div>
        <div>
          <h5>Atención al cliente</h5>
          <a href="https://wa.me/${STORE_INFO.whatsapp}" target="_blank">WhatsApp: ${STORE_INFO.phone}</a>
          <a href="${base}tiendas.html">Nuestras tiendas</a>
          <a href="${base}checkout.html">Recogida en tienda</a>
        </div>
        <div>
          <h5>Comprar</h5>
          <a href="${base}muebles.html?sub=sala">Juegos de sala</a>
          <a href="${base}muebles.html?sub=comedor">Juegos de comedor</a>
          <a href="${base}muebles.html?sub=camas">Camas</a>
          <a href="${base}muebles.html?sub=consolas">Consolas</a>
        </div>
        <div>
          <h5>Financiación</h5>
          <span>Addi</span>
          <span>Alo Credit</span>
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
  a.innerHTML = `<svg width="27" height="27" viewBox="0 0 24 24" fill="white"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.79 14.07c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.26-.29.58-.36.77-.36.19 0 .39 0 .55.01.18.01.42-.07.65.5.24.58.81 2 .88 2.15.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.61-.07.16-.19.68-.79.87-1.06.18-.28.36-.23.6-.14.24.09 1.55.73 1.82.87.27.14.45.2.51.32.07.11.07.65-.17 1.33z"/></svg>`;
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
