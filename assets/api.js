/* Bangali Sweets — Backend API Client
 * Wraps all HTTP calls to the Spring Boot backend and exposes window.BB_API.
 * On load it fetches the catalogue, fills window.BB, and fires `bb:catalogue-loaded`.
 * If the backend is unreachable the page keeps whatever window.BB already has.
 */
(function () {
  "use strict";

  // Backend URL comes from assets/env.js (window.BB_CONFIG). Fallback keeps it working if env.js is missing.
  const BASE = (window.BB_CONFIG && window.BB_CONFIG.API_BASE) || "http://localhost:8080/api";
  const KEY_TOKEN = "bb_token_v1";
  const KEY_AUTH  = "bb_auth_v1";

  // ── Helpers ──────────────────────────────────────────────────────────────
  function getToken() { return localStorage.getItem(KEY_TOKEN); }
  function setToken(t) { localStorage.setItem(KEY_TOKEN, t); }
  function clearToken() { localStorage.removeItem(KEY_TOKEN); localStorage.removeItem(KEY_AUTH); }

  function authHeaders() {
    const t = getToken();
    return t ? { "Authorization": "Bearer " + t, "Content-Type": "application/json" }
             : { "Content-Type": "application/json" };
  }

  async function req(method, path, body) {
    const opts = { method, headers: authHeaders() };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // ── Map backend product/category/review to the frontend (window.BB) shape ──
  function mapProduct(p) {
    return {
      id:     String(p.id),
      cat:    p.category ? p.category.slug : "",
      en:     p.nameEn,
      hi:     p.nameHi,
      price:  parseFloat(p.price),
      mrp:    parseFloat(p.mrp || p.price),
      img:    p.imageUrl || "",
      images: p.images ? p.images.split(",").filter(Boolean) : (p.imageUrl ? [p.imageUrl] : []),
      unit:   p.unit || "",
      pieces: p.unit || "",
      // Available weights (kg) for weight-priced bakery items; [] for others.
      weights: p.weightOptions ? p.weightOptions.split(",").map(s => parseFloat(s)).filter(n => n > 0) : [],
      stock:  p.stock,
      tag:    p.tag || null,
      sold:   p.soldCount || 0,
      rating: p.rating || 0,
      reviews:p.reviewCount || 0,
      desc:   p.description || "",
      ingredients: p.ingredients || "",
      shelf:  p.shelfLife || "",
      hsn:    p.hsnCode || "1704",
      gst:    p.gstPercent || 5,
      seoTitle: p.seoTitle || "",
      seoDesc:  p.seoDescription || "",
    };
  }

  function mapCategory(c) {
    return {
      id:           c.id,
      slug:         c.slug,
      en:           c.nameEn,
      hi:           c.nameHi,
      hero:         c.heroImage || "",
      desc:         c.description || "",
      items:        0, // filled after products load
      displayOrder: c.displayOrder || 0,
      active:       c.active !== false,
      featured:     !!c.featured,
    };
  }

  function mapReview(r) {
    return {
      name:   r.customerName || "Customer",
      rating: r.rating || 5,
      text:   r.reviewText || "",
      date:   r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
        : "",
    };
  }

  // ── Catalogue (with stale-while-revalidate cache) ──────────────────────────
  // The DB is remote, so we cache the mapped catalogue in sessionStorage and render
  // it instantly on every page, then refresh in the background. Navigation between
  // pages no longer waits on the network.
  const CATALOGUE_CACHE_KEY = "bb_catalogue_v2";

  function readCatalogueCache() {
    try {
      const raw = sessionStorage.getItem(CATALOGUE_CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !obj.t || !obj.data) return null;
      return obj;   // { t, data: { cats, prods, reviews } }
    } catch { return null; }
  }
  function writeCatalogueCache(data) {
    try { sessionStorage.setItem(CATALOGUE_CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch { /* quota */ }
  }
  function applyCatalogue(d) {
    window.BB = window.BB || {};
    window.BB.categories = d.cats;
    window.BB.products   = d.prods;
    if (d.reviews && d.reviews.length) window.BB.reviews = d.reviews;
    window.dispatchEvent(new CustomEvent("bb:catalogue-loaded", { detail: { cats: d.cats, prods: d.prods } }));
  }

  async function loadCatalogue() {
    try {
      const [cats, prods, reviews] = await Promise.all([
        req("GET", "/categories"),
        req("GET", "/products"),
        req("GET", "/reviews?limit=12").catch(() => null),
      ]);

      const mappedCats  = cats.map(mapCategory);
      const mappedProds = prods.map(mapProduct);

      mappedCats.forEach(c => {
        c.items = mappedProds.filter(p => p.cat === c.slug).length;
      });
      mappedCats.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      const data = {
        cats:    mappedCats,
        prods:   mappedProds,
        reviews: (reviews && reviews.length > 0) ? reviews.map(mapReview) : [],
      };
      writeCatalogueCache(data);
      applyCatalogue(data);
      return { cats: mappedCats, prods: mappedProds };
    } catch (e) {
      console.warn("[API] Backend unreachable, keeping existing catalogue:", e.message);
      return null;
    }
  }

  // Opaque full-screen boot loader — shown on first load (no cached data) so the
  // dummy fallback from catalog.js is never visible while the API is loading.
  function showBootLoader() {
    if (document.getElementById("bb-boot-loader")) return;
    const el = document.createElement("div");
    el.id = "bb-boot-loader";
    el.className = "bb-loader bb-loader--solid is-on";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.innerHTML = `<div class="bb-loader__card"><div class="bb-loader__ring"></div><div class="bb-loader__msg">Loading…</div></div>`;
    (document.body || document.documentElement).appendChild(el);
  }
  function hideBootLoader() {
    const el = document.getElementById("bb-boot-loader");
    if (!el) return;
    el.classList.remove("is-on");
    setTimeout(() => el.remove(), 320);   // remove after the fade-out
  }


  async function getProductById(id) {
    try { return mapProduct(await req("GET", "/products/" + id)); }
    catch { return window.BB?.products?.find(p => p.id === String(id)) || null; }
  }

  // Single-call category fetch: returns the category's products plus the category
  // meta (banner image, names, description) read from the embedded category object,
  // so a category page needs no /categories or full /products call.
  async function getProductsByCategory(slug) {
    const res = await req("GET", "/products?category=" + encodeURIComponent(slug));
    const products = res.map(mapProduct);
    const rawCat = res.find(p => p.category && p.category.slug === slug)?.category
                || (res[0] && res[0].category) || null;
    return { category: rawCat ? mapCategory(rawCat) : null, products };
  }

  async function searchProducts(q) {
    try {
      const res = await req("GET", "/products/search?q=" + encodeURIComponent(q));
      return res.map(mapProduct);
    } catch {
      const lower = q.toLowerCase();
      return (window.BB?.products || []).filter(p =>
        p.en.toLowerCase().includes(lower) || p.hi.includes(q));
    }
  }

  async function getBanners() {
    try { return await req("GET", "/banners"); }
    catch { return {}; }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function sendOtp(phone) {
    const data = await req("POST", "/auth/send-otp", { phone });
    if (data.otp && window.BB_APP) {
      window.BB_APP.toast(`Dev OTP: <strong>${data.otp}</strong>`, "info");
    }
    return data;
  }

  async function verifyOtp(phone, otp, name) {
    const data = await req("POST", "/auth/verify-otp", { phone, otp, name });
    setToken(data.token);
    localStorage.setItem(KEY_AUTH, JSON.stringify({
      phone: data.phone,
      name:  data.name || "",
      userId: data.userId,
      points: 0,
    }));
    window.dispatchEvent(new CustomEvent("bb:auth"));
    return data;
  }

  async function adminLogin(username, password) {
    const data = await req("POST", "/auth/admin/login", { username, password });
    setToken(data.token);
    localStorage.setItem("bb_admin_token_v1", data.token);
    return data;
  }

  function logout() {
    clearToken();
    window.dispatchEvent(new CustomEvent("bb:auth"));
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  async function placeOrder(payload) {
    const cart = window.BB_APP ? window.BB_APP.cart.read() : [];
    const items = cart.map(c => {
      const item = { id: parseInt(c.id) || c.id, qty: c.qty };
      if (c.weight) { item.weight = c.weight; item.weightLabel = c.weightLabel || ""; }  // weight-priced box
      return item;
    });

    const body = {
      name:       payload.name,
      phone:      payload.phone,
      email:      payload.email || "",
      address:    payload.address || "",
      pin:        payload.pin || "",
      landmark:   payload.landmark || "",
      mode:       payload.mode || "delivery",
      payment:    payload.payment || "cod",
      couponCode: payload.couponCode || "",
      items,
    };

    const order = await req("POST", "/orders", body);
    if (window.BB_APP) window.BB_APP.cart.clear();
    return order; // { orderNumber, orderId, total, status }
  }

  async function getMyOrders() {
    if (!getToken()) return [];
    try { return await req("GET", "/orders/my"); }
    catch { return []; }
  }

  async function trackOrder(orderNumber) {
    return req("GET", "/orders/track/" + orderNumber);
  }

  // ── Coupons / Shipping ─────────────────────────────────────────────────────
  async function validateCoupon(code, cartTotal) {
    return req("POST", "/coupons/validate", { code, cartTotal: String(cartTotal) });
  }

  async function getShipping(pincode, cartTotal) {
    try {
      return await req("GET", `/shipping/calculate?pincode=${pincode}&cartTotal=${cartTotal}`);
    } catch {
      return { serviceable: true, charge: cartTotal >= 999 ? 0 : 89, days: "Same-day", zone: "Bhind Local" };
    }
  }

  // ── User ──────────────────────────────────────────────────────────────────
  async function getProfile() { return req("GET", "/user/profile"); }

  async function updateProfile(name, email) {
    const data = await req("PUT", "/user/profile", { name, email });
    const auth = JSON.parse(localStorage.getItem(KEY_AUTH) || "{}");
    auth.name = data.name;
    localStorage.setItem(KEY_AUTH, JSON.stringify(auth));
    return data;
  }

  async function addAddress(address) { return req("POST", "/user/addresses", address); }
  async function deleteAddress(addressId) { return req("DELETE", "/user/addresses/" + addressId); }

  // ── Admin (used by api-bridge.js) ──────────────────────────────────────────
  const admin = {
    login: adminLogin,
    getToken: () => localStorage.getItem("bb_admin_token_v1"),
    getProducts:  ()        => req("GET",    "/admin/products"),
    createProduct:(body)    => req("POST",   "/admin/products", body),
    updateProduct:(id, body)=> req("PUT",    "/admin/products/" + id, body),
    deleteProduct:(id)      => req("DELETE", "/admin/products/" + id),
    restockProduct:(id, qty)=> req("POST",   "/admin/products/" + id + "/restock", { qty }),
    getCategories:  ()        => req("GET",    "/admin/categories"),
    createCategory: (body)    => req("POST",   "/admin/categories", body),
    updateCategory: (id, body)=> req("PUT",    "/admin/categories/" + id, body),
    deleteCategory: (id)      => req("DELETE", "/admin/categories/" + id),
    getOrders:    ()           => req("GET",   "/admin/orders"),
    updateStatus: (id, status) => req("PATCH", "/admin/orders/" + id + "/status", { status }),
    getDashboard: ()           => req("GET",   "/admin/orders/dashboard"),
    getCoupons:   ()        => req("GET",    "/admin/coupons"),
    createCoupon: (body)    => req("POST",   "/admin/coupons", body),
    updateCoupon: (id, body)=> req("PUT",    "/admin/coupons/" + id, body),
    deleteCoupon: (id)      => req("DELETE", "/admin/coupons/" + id),
    getCustomers: () => req("GET", "/admin/customers"),
    getReviews:    (status) => req("GET",    "/admin/reviews" + (status ? "?status=" + status : "")),
    updateReview:  (id, s)  => req("PATCH",  "/admin/reviews/" + id + "/status", { status: s }),
    deleteReview:  (id)     => req("DELETE", "/admin/reviews/" + id),
    getZones:    ()        => req("GET",    "/admin/shipping-zones"),
    createZone:  (body)    => req("POST",   "/admin/shipping-zones", body),
    updateZone:  (id, body)=> req("PUT",    "/admin/shipping-zones/" + id, body),
    deleteZone:  (id)      => req("DELETE", "/admin/shipping-zones/" + id),
    getBanners:   ()     => req("GET", "/banners"),
    updateBanners:(body) => req("PUT", "/admin/banners", body),
    uploadImage: async (file) => {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(BASE + "/admin/products/upload-image", {
        method: "POST",
        headers: { "Authorization": "Bearer " + localStorage.getItem("bb_admin_token_v1") },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
  };

  // ── Public API ────────────────────────────────────────────────────────────
  window.BB_API = {
    BASE,
    loadCatalogue, getProductById, getProductsByCategory, searchProducts, getBanners,
    sendOtp, verifyOtp, logout,
    placeOrder, getMyOrders, trackOrder,
    validateCoupon, getShipping,
    getProfile, updateProfile, addAddress, deleteAddress,
    admin,
    isLoggedIn: () => !!getToken(),
    getToken,
    // Force a fresh catalogue fetch (e.g. after an admin edit) bypassing the cache.
    invalidateCatalogue: () => { try { sessionStorage.removeItem(CATALOGUE_CACHE_KEY); } catch {} return loadCatalogue(); },
  };

  // Decide synchronously NOW — api.js runs before each page's inline render script:
  //  • cache present → apply real (cached) data immediately, so the page renders live
  //    data with no dummy flash and no loader.
  //  • no cache → show the opaque boot loader to fully hide the dummy catalog.js
  //    fallback until the API responds.
  const _bootCache = readCatalogueCache();
  if (_bootCache) applyCatalogue(_bootCache.data);
  else showBootLoader();

  // Always revalidate against the API after the page loads; drop the boot loader when done.
  // A page can set window.BB_SKIP_CATALOGUE = true (before DOMContentLoaded) to opt out
  // of the catalogue-wide fetch (/categories + /products + /reviews) — used by pages that
  // load only their own slice of data, e.g. the category page.
  document.addEventListener("DOMContentLoaded", () => {
    if (window.BB_SKIP_CATALOGUE) { hideBootLoader(); return; }
    loadCatalogue().finally(hideBootLoader);
  });
})();
