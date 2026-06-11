/* Bangali Sweets — Shared site logic
 * - Injects header + footer
 * - Cart in localStorage
 * - Auth (mock) in localStorage
 * - Toast notifications
 * - Page-view tracking (stored locally; admin reads)
 */

(function() {
  "use strict";

  const STORE = window.BB;
  const KEY_CART = "bb_cart_v1";
  const KEY_AUTH = "bb_auth_v1";
  const KEY_ANALYTICS = "bb_analytics_v1";
  const KEY_ORDERS = "bb_orders_v1";

  // ============================== STATE ==============================
  function readCart()    { try { return JSON.parse(localStorage.getItem(KEY_CART)) || []; } catch(e) { return []; } }
  function writeCart(c)  { localStorage.setItem(KEY_CART, JSON.stringify(c)); window.dispatchEvent(new CustomEvent("bb:cart")); }
  function readAuth()    { try { return JSON.parse(localStorage.getItem(KEY_AUTH)) || null; } catch(e) { return null; } }
  function writeAuth(a)  { localStorage.setItem(KEY_AUTH, JSON.stringify(a)); window.dispatchEvent(new CustomEvent("bb:auth")); }
  function readOrders()  { try { return JSON.parse(localStorage.getItem(KEY_ORDERS)) || []; } catch(e) { return []; } }
  function writeOrders(o){ localStorage.setItem(KEY_ORDERS, JSON.stringify(o)); }
  function readAnalytics(){ try { return JSON.parse(localStorage.getItem(KEY_ANALYTICS)) || {pageViews:{}, productViews:{}, events:[]}; } catch(e) { return {pageViews:{}, productViews:{}, events:[]}; } }
  function writeAnalytics(a){ localStorage.setItem(KEY_ANALYTICS, JSON.stringify(a)); }

  // ============================== CART ==============================
  // A cart line is identified by product id + weight (kg) for weight-priced items
  // (sweets/namkeen/dairy). Non-weight items have no `weight`, so their key is just
  // the id — keeping all existing id-based update/remove calls working unchanged.
  function cartKey(i) { return i.weight ? i.id + "|" + i.weight : i.id; }

  function cartCount() {
    return readCart().reduce((s, i) => s + i.qty, 0);
  }
  function cartTotal() {
    const cart = readCart();
    return cart.reduce((s, i) => {
      const p = findProduct(i.id);
      if (!p) return s;
      const factor = i.weight || 1;   // weight-priced: price is per kg, factor scales it
      return s + p.price * factor * i.qty;
    }, 0);
  }
  function addToCart(id, qty = 1, opts = {}) {
    const cart = readCart();
    const line = { id, qty };
    if (opts.weight) { line.weight = opts.weight; line.weightLabel = opts.weightLabel || ""; }
    const key = cartKey(line);
    const existing = cart.find(i => cartKey(i) === key);
    if (existing) existing.qty += qty;
    else cart.push(line);
    writeCart(cart);
    const p = findProduct(id);
    const lbl = opts.weightLabel ? ` (${opts.weightLabel})` : "";
    toast(`Added <b>${p ? p.en : "item"}${lbl}</b> to bag`);
    trackEvent("add_to_cart", { id });
  }
  function updateCartQty(key, qty) {
    const cart = readCart();
    const it = cart.find(i => cartKey(i) === key);
    if (!it) return;
    if (qty <= 0) {
      writeCart(cart.filter(i => cartKey(i) !== key));
    } else {
      it.qty = qty;
      writeCart(cart);
    }
  }
  function removeFromCart(key) {
    writeCart(readCart().filter(i => cartKey(i) !== key));
  }
  function clearCart() { writeCart([]); }

  // ============================== LOOKUPS ==============================
  function findProduct(id) { return STORE.products.find(p => p.id === id); }
  function findCategory(slug) { return STORE.categories.find(c => c.slug === slug); }
  function productsByCategory(slug) { return STORE.products.filter(p => p.cat === slug); }

  // ============================== FORMATTING ==============================
  function rupee(n) { return "₹" + Number(n).toLocaleString("en-IN"); }

  // ============================== TOAST ==============================
  function toast(html, type = "info") {
    let stack = document.getElementById("bb-toasts");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "bb-toasts";
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="x">✦</span><span>${html}</span>`;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, 2200);
    setTimeout(() => el.remove(), 2600);
  }

  // ============================== BACKDROP LOADER ==============================
  // Reference-counted, full-screen backdrop with a branded spinner.
  // "Smart" = shows only after a brief delay (fast ops never flash it) and stays
  // up for a minimum time once shown (no flicker). Concurrent calls are stacked.
  const LOADER_DELAY = 180;  // ms to wait before showing — quick calls finish first
  const LOADER_MIN   = 450;  // ms to keep it visible once shown
  let loaderCount = 0, loaderEl = null, loaderShowTimer = null, loaderHideTimer = null, loaderShownAt = 0;

  function ensureLoaderEl() {
    if (loaderEl) return loaderEl;
    loaderEl = document.createElement("div");
    loaderEl.className = "bb-loader";
    loaderEl.setAttribute("role", "status");
    loaderEl.setAttribute("aria-live", "polite");
    loaderEl.setAttribute("aria-hidden", "true");
    loaderEl.innerHTML = `<div class="bb-loader__card"><div class="bb-loader__ring"></div><div class="bb-loader__msg"></div></div>`;
    document.body.appendChild(loaderEl);
    return loaderEl;
  }

  function paintLoader(on, msg) {
    const el = ensureLoaderEl();
    if (msg != null) el.querySelector(".bb-loader__msg").textContent = msg;
    el.classList.toggle("is-on", on);
    el.setAttribute("aria-hidden", on ? "false" : "true");
  }

  function showLoader(msg = "Just a moment…") {
    loaderCount++;
    clearTimeout(loaderHideTimer);
    if (loaderShownAt) {
      paintLoader(true, msg);                // already visible → just refresh the message
    } else if (!loaderShowTimer) {
      loaderShowTimer = setTimeout(() => {
        loaderShowTimer = null;
        loaderShownAt = Date.now();
        paintLoader(true, msg);
      }, LOADER_DELAY);
    }
  }

  function hideLoader() {
    loaderCount = Math.max(0, loaderCount - 1);
    if (loaderCount > 0) return;             // other operations still running
    if (loaderShowTimer) {                   // never actually shown → cancel pending show
      clearTimeout(loaderShowTimer);
      loaderShowTimer = null;
      return;
    }
    const wait = Math.max(0, LOADER_MIN - (Date.now() - loaderShownAt));
    loaderHideTimer = setTimeout(() => {
      if (loaderCount === 0) { paintLoader(false); loaderShownAt = 0; }
    }, wait);
  }

  // Wrap any promise/async fn so the loader auto-shows for its duration.
  async function duringLoader(work, msg) {
    showLoader(msg);
    try { return await (typeof work === "function" ? work() : work); }
    finally { hideLoader(); }
  }

  function loaderMessageFor(url, method) {
    if (url.includes("/auth/send-otp"))    return "Sending OTP…";
    if (url.includes("/auth/verify-otp"))  return "Verifying…";
    if (url.includes("/auth/admin"))       return "Signing in…";
    if (url.includes("/upload-image"))     return "Uploading image…";
    if (url.includes("/orders"))           return "Placing your order…";
    if (url.includes("/coupons"))          return "Applying coupon…";
    if (url.includes("/addresses"))        return "Saving address…";
    if (url.includes("/profile"))          return "Saving…";
    if (method.toUpperCase() === "DELETE") return "Removing…";
    return "Just a moment…";
  }

  // Smart auto-loader: transparently wrap mutating backend calls (POST/PUT/PATCH/
  // DELETE to /api/). Every blocking action — orders, OTP, coupons, profile,
  // admin — gets the backdrop with no per-call wiring. Background GETs (catalogue,
  // product/search render) are left alone; they use their own inline placeholders.
  (function patchFetchForLoader() {
    if (window.__bbLoaderFetch) return;
    window.__bbLoaderFetch = true;
    const orig = window.fetch.bind(window);
    const MUTATING = /^(POST|PUT|PATCH|DELETE)$/i;
    window.fetch = function (input, init) {
      const method = (init && init.method) || (typeof input === "object" && input && input.method) || "GET";
      const url    = typeof input === "string" ? input : (input && input.url) || "";
      // Backend call? matches the configured API base (read at call time, after
      // env.js loads) or a "/api/" path — so it works in dev and production.
      const base = (window.BB_CONFIG && window.BB_CONFIG.API_BASE) || "/api";
      const isBackend = url.includes("/api/") || (base && url.indexOf(base) === 0);
      if (isBackend && MUTATING.test(method)) {
        showLoader(loaderMessageFor(url, method));
        return orig(input, init).finally(hideLoader);
      }
      return orig(input, init);
    };
  })();

  // ============================== ANALYTICS ==============================
  function trackPageView(path) {
    const a = readAnalytics();
    a.pageViews[path] = (a.pageViews[path] || 0) + 1;
    a.events.push({ t: Date.now(), type: "pageview", path });
    if (a.events.length > 500) a.events = a.events.slice(-500);
    writeAnalytics(a);
  }
  function trackProductView(id) {
    const a = readAnalytics();
    a.productViews[id] = (a.productViews[id] || 0) + 1;
    a.events.push({ t: Date.now(), type: "productview", id });
    if (a.events.length > 500) a.events = a.events.slice(-500);
    writeAnalytics(a);
  }
  function trackEvent(type, data) {
    const a = readAnalytics();
    a.events.push({ t: Date.now(), type, ...data });
    if (a.events.length > 500) a.events = a.events.slice(-500);
    writeAnalytics(a);
  }

  // ============================== ICONS ==============================
  const ICONS = {
    search: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bag:    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    user:   '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>',
    heart:  '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z"/></svg>',
    pin:    '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    phone:  '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 5a2 2 0 0 1 2-2h2l2 5-2 1a10 10 0 0 0 5 5l1-2 5 2v2a2 2 0 0 1-2 2A14 14 0 0 1 5 5Z"/></svg>',
    arrow:  '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    plus:   '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12h14"/></svg>',
  };

  // ============================== HEADER ==============================
  // Static fallback shown only until the API categories load (cold page, no cache).
  const FALLBACK_NAV = [
    { slug: "sweets",    label: "Sweets" },
    { slug: "namkeen",   label: "Namkeen" },
    { slug: "dryfruits", label: "Dry Fruits" },
    { slug: "dairy",     label: "Dairy" },
    { slug: "bakery",    label: "Bakery" },
    { slug: "hampers",   label: "Hampers" },
    { slug: "birthday",  label: "Birthday" },
  ];

  function renderHeader(activeNav) {
    const auth = readAuth();
    // Categories come from /api/categories (active only, ordered by displayOrder),
    // loaded into STORE.categories by api.js. Fall back to the static list pre-load.
    const cats = (STORE.categories || []).filter(c => c.active !== false);
    const navItems = cats.length
      ? cats.map(c => ({ slug: c.slug, label: c.en }))
      : FALLBACK_NAV;
    return `
      <div class="bar-main">
        <a class="logo" href="index.html" aria-label="Bangali Sweets — Home">
          <span class="seal">B</span>
          <span>
            <span class="nm">Bangali Sweets and Dry Fruits</span>
            <span class="nm-hi" style="display:block">बंगाली स्वीट्स</span>
          </span>
        </a>
        <nav class="utils" aria-label="User">
          <a href="${STORE.shop.mapsUrl}" target="_blank" rel="noopener" title="Outlet location">
            ${ICONS.pin}<span class="lbl">Bhind, MP</span>
          </a>
          <a href="account.html" title="My Account">
            ${ICONS.user}<span class="lbl">${auth ? (auth.name || "Account") : "Sign in"}</span>
          </a>
          <a href="cart.html" class="cart-pill" aria-label="Cart">
            ${ICONS.bag}<span data-cart-count>${cartCount()}</span>
          </a>
        </nav>
      </div>
      <nav class="bar-nav" aria-label="Categories">
        ${navItems.map(n => `<a href="category.html?slug=${n.slug}" class="${activeNav === n.slug ? "active" : ""}">${n.label}</a>`).join("")}
        <span class="right">
          <a href="about.html">About</a>
          <a href="outlet.html">Our Outlet</a>
          <a href="track.html">Track</a>
          <a href="account.html">My Account</a>
        </span>
      </nav>
    `;
  }

  // ============================== FOOTER ==============================
  function renderFooter() {
    return `
      <div class="grid">
        <div>
          <div class="nm">Bangali Sweets</div>
          <div class="nm-hi">बंगाली स्वीट्स · since 1987</div>
          <p class="blurb">Pure-veg mithai, namkeen and dry fruits — hand-made in Bhind, delivered fresh across India.</p>
          <div style="font-size:12px; opacity:.7; line-height:1.7;">
            📍 ${STORE.shop.address}<br/>
            📞 <a href="tel:${STORE.shop.phone}" style="display:inline">${STORE.shop.phoneDisplay}</a><br/>
            ✉️ <a href="mailto:${STORE.shop.email}" style="display:inline">${STORE.shop.email}</a><br/>
            🕘 ${STORE.shop.hours}
          </div>
          <div class="social">
            <span title="Instagram">IG</span>
            <span title="Facebook">FB</span>
            <span title="YouTube">YT</span>
            <span title="WhatsApp">WA</span>
          </div>
        </div>
        <div>
          <h4>Shop</h4>
          ${STORE.categories.map(c => `<a href="category.html?slug=${c.slug}">${c.en}</a>`).join("")}
        </div>
        <div>
          <h4>Company</h4>
          <a href="about.html">About Us</a>
          <a href="outlet.html">Our Outlet</a>
          <a href="about.html#story">Our Story</a>
          <a href="about.html#corporate">Bulk &amp; Corporate</a>
        </div>
        <div>
          <h4>Help</h4>
          <a href="track.html">Track Order</a>
          <a href="about.html#shipping">Shipping</a>
          <a href="about.html#returns">Returns</a>
          <a href="about.html#faq">FAQs</a>
          <a href="account.html">Contact Us</a>
        </div>
        <div>
          <h4>Account</h4>
          <a href="account.html">My Profile</a>
          <a href="account.html#orders">My Orders</a>
          <a href="account.html#addresses">Addresses</a>
          <a href="account.html#points">Mithai Points</a>
          <a href="admin.html" style="color:var(--gold)">Admin Dashboard ↗</a>
        </div>
      </div>
      <div class="legal">
        <span>© 2026 Bangali Sweets &amp; Dryfruits, Bhind · GSTIN ${STORE.shop.gstin} · FSSAI ${STORE.shop.fssai}</span>
        <span><a href="privacy.html" style="display:inline">Privacy</a> · <a href="terms.html" style="display:inline">Terms</a> · <a href="terms.html#cancel" style="display:inline">Refunds</a></span>
      </div>
    `;
  }

  // ============================== AUTH (mock OTP) ==============================
  function login(phone, name) {
    writeAuth({
      phone, name: name || "",
      points: 0,
      joined: Date.now(),
      addresses: [],
    });
  }
  function logout() {
    localStorage.removeItem(KEY_AUTH);
    window.dispatchEvent(new CustomEvent("bb:auth"));
  }

  // ============================== ORDERS ==============================
  function placeOrder(payload) {
    const orders = readOrders();
    const id = "BS-2026-" + String(orders.length + 4810 + Math.floor(Math.random() * 10)).padStart(5, "0");
    const cart = readCart();
    const items = cart.map(c => {
      const p = findProduct(c.id);
      return { id: c.id, qty: c.qty, name: p.en, price: p.price, img: p.img };
    });
    const order = {
      id,
      placedAt: Date.now(),
      status: "Packing",
      items,
      ...payload,
    };
    orders.push(order);
    writeOrders(orders);
    clearCart();
    trackEvent("order_placed", { id });
    return order;
  }

  // ============================== UPDATE CART COUNT (live) ==============================
  function refreshCartCount() {
    const els = document.querySelectorAll("[data-cart-count]");
    const n = cartCount();
    els.forEach(el => el.textContent = n);
  }
  window.addEventListener("bb:cart", refreshCartCount);

  // ============================== INIT ==============================
  let currentNav = null;

  function paintChrome() {
    const header = document.getElementById("site-header");
    if (header) {
      header.className = "site-header";
      header.innerHTML = renderHeader(currentNav);
    }
    const footer = document.getElementById("site-footer");
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML = renderFooter();
    }
  }

  function mount(opts = {}) {
    const path = location.pathname.split("/").pop() || "index.html";
    trackPageView(path);
    currentNav = opts.nav || null;
    paintChrome();
  }

  // When the live categories arrive from the API, repaint the nav/footer so they
  // replace the static fallback without a page reload.
  window.addEventListener("bb:catalogue-loaded", paintChrome);

  // ============================== SEARCH ==============================
  function search(q) {
    if (!q || !q.trim()) return;
    location.href = "search.html?q=" + encodeURIComponent(q.trim());
  }

  // ============================== PUBLIC ==============================
  window.BB_APP = {
    mount, search, toast, rupee,
    loader: { show: showLoader, hide: hideLoader, during: duringLoader },
    cart: { read: readCart, count: cartCount, total: cartTotal, add: addToCart, update: updateCartQty, remove: removeFromCart, clear: clearCart, key: cartKey },
    auth: { read: readAuth, login, logout },
    orders: { read: readOrders, place: placeOrder },
    analytics: { read: readAnalytics, track: trackEvent, trackPageView, trackProductView },
    find: { product: findProduct, category: findCategory, byCategory: productsByCategory },
    icons: ICONS,
  };
})();
