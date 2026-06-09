/* Admin API Bridge — patches AD.* and BB_APP.orders to use the Spring Boot backend.
 * Loads data from the backend into a local cache; existing sync code reads from cache.
 * Include this AFTER _state.js in admin.html.
 */
(function () {
  "use strict";

  // Change this single line when deploying (e.g. https://api.bangalisweets.in/api)
  const BASE = "http://localhost:8080/api";
  const TOKEN_KEY = "bb_admin_token_v1";

  function getToken() { return localStorage.getItem(TOKEN_KEY); }

  async function apiFetch(method, path, body) {
    const opts = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken(),
      },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    if (res.status === 401) { showLoginModal(); throw new Error("Unauthorized"); }
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || res.statusText);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // ── Local cache (keeps sync AD.* working) ───────────────────────────────
  let cache = {
    products:  null,
    categories: null,
    orders:    null,
    coupons:   null,
    reviews:   null,
    customers: null,
    zones:     null,
    banners:   null,
    dashboard: null,
  };

  function mapProduct(p) {
    return {
      id:      String(p.id),
      cat:     p.category ? p.category.slug : "",
      en:      p.nameEn,
      hi:      p.nameHi,
      price:   parseFloat(p.price),
      mrp:     parseFloat(p.mrp || p.price),
      img:     p.imageUrl || "",
      unit:    p.unit || "",
      pieces:  p.unit || "",
      stock:   p.stock,
      tag:     p.tag || null,
      sold:    p.soldCount || 0,
      rating:  p.rating || 0,
      reviews: p.reviewCount || 0,
      desc:    p.description || "",
      ingredients: p.ingredients || "",
      shelf:   p.shelfLife || "",
      hsn:     p.hsnCode || "1704",
      gst:     p.gstPercent || 5,
      seoTitle: p.seoTitle || "",
      seoDesc:  p.seoDescription || "",
      active:  p.active !== false,
      _backendId: p.id,
      _categoryId: p.category ? p.category.id : null,
    };
  }

  function mapOrder(o) {
    return {
      id:       o.orderNumber,
      orderId:  o.id,
      placedAt: o.createdAt ? new Date(o.createdAt).getTime() : Date.now(),
      status:   o.status || "Packing",
      items:    (o.items || []).map(i => ({
        id:    String(i.productId),
        qty:   i.quantity,
        name:  i.productName,
        price: parseFloat(i.unitPrice),
        img:   i.productImage || "",
      })),
      name:     o.customerName,
      phone:    o.customerPhone,
      email:    o.customerEmail || "",
      address:  o.deliveryAddress || "",
      pin:      o.pincode || "",
      landmark: o.landmark || "",
      mode:     o.mode || "delivery",
      total:    parseFloat(o.total),
      payment:  o.paymentMode || "cod",
    };
  }

  // ── Background refresh ───────────────────────────────────────────────────
  async function refresh() {
    if (!getToken()) return;
    try {
      const [prods, cats, orders, coupons, reviews, dashboard] = await Promise.all([
        apiFetch("GET", "/admin/products").catch(() => null),
        apiFetch("GET", "/admin/categories").catch(() => null),
        apiFetch("GET", "/admin/orders").catch(() => null),
        apiFetch("GET", "/admin/coupons").catch(() => null),
        apiFetch("GET", "/admin/reviews").catch(() => null),
        apiFetch("GET", "/admin/orders/dashboard").catch(() => null),
      ]);

      if (dashboard) cache.dashboard = dashboard;

      if (prods) {
        cache.products = prods.map(mapProduct);
        localStorage.setItem("bb_admin_products_v1", JSON.stringify(cache.products));
      }
      if (cats) {
        cache.categories = cats;
        if (window.BB) {
          window.BB.categories = cats.map(c => ({
            id:   c.id,
            slug: c.slug, en: c.nameEn, hi: c.nameHi, hero: c.heroImage || "",
            desc: c.description || "", items: 0,
            displayOrder: c.displayOrder || 0,
            active: c.active !== false,
            featured: !!c.featured,
          }));
        }
      }
      if (orders) {
        cache.orders = orders.map(mapOrder);
        localStorage.setItem("bb_orders_v1", JSON.stringify(cache.orders));
      }
      if (coupons) cache.coupons = coupons;
      if (reviews) cache.reviews = reviews;

      window.dispatchEvent(new CustomEvent("bb:admin-data-loaded"));
    } catch (e) {
      console.warn("[Admin Bridge] Refresh failed:", e.message);
    }
  }

  // ── Patch AD.* ───────────────────────────────────────────────────────────
  if (window.AD) {
    const _origProducts = window.AD.products;
    window.AD.products = function () {
      if (cache.products) return cache.products;
      return _origProducts();
    };

    const _origCoupons = window.AD.coupons;
    window.AD.coupons = function () {
      if (cache.coupons) return cache.coupons;
      return _origCoupons();
    };

    if (cache.reviews) {
      const _origReviews = window.AD.reviews;
      window.AD.reviews = function () {
        if (cache.reviews) return cache.reviews;
        return _origReviews();
      };
    }

    window.AD.todayOrders = function () {
      const orders = cache.orders || [];
      return orders.filter(o => Date.now() - o.placedAt < 86400000);
    };
  }

  // Patch BB_APP.orders.read() for admin
  if (window.BB_APP) {
    const _origRead = window.BB_APP.orders.read;
    window.BB_APP.orders.read = function () {
      if (cache.orders) return cache.orders;
      return _origRead();
    };
  }

  // ── Admin CRUD operations (exposed on window.ADMIN_API) ─────────────────
  window.ADMIN_API = {

    login: async function (username, password) {
      const res = await fetch(BASE + "/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");
      localStorage.setItem(TOKEN_KEY, data.token);
      return data;
    },

    // Products
    saveProduct: async function (productData, isNew) {
      const body = {
        sku:           productData.id || ("p" + Date.now()),
        categoryId:    productData._categoryId || productData.catId,
        nameEn:        productData.en,
        nameHi:        productData.hi,
        price:         productData.price,
        mrp:           productData.mrp,
        unit:          productData.unit || productData.pieces,
        stock:         productData.stock,
        imageUrl:      productData.img,
        tag:           productData.tag,
        description:   productData.desc,
        ingredients:   productData.ingredients,
        shelfLife:     productData.shelf,
        hsnCode:       productData.hsn,
        gstPercent:    productData.gst,
        seoTitle:      productData.seoTitle,
        seoDescription: productData.seoDesc,
      };

      let result;
      if (isNew || !productData._backendId) {
        result = await apiFetch("POST", "/admin/products", body);
      } else {
        result = await apiFetch("PUT", "/admin/products/" + productData._backendId, body);
      }
      await refresh();
      return mapProduct(result);
    },

    deleteProduct: async function (product) {
      if (!product._backendId) return;
      await apiFetch("DELETE", "/admin/products/" + product._backendId);
      await refresh();
    },

    restock: async function (product, qty) {
      if (!product._backendId) return;
      await apiFetch("POST", "/admin/products/" + product._backendId + "/restock", { qty });
      await refresh();
    },

    uploadImage: async function (file) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(BASE + "/admin/products/upload-image", {
        method: "POST",
        headers: { "Authorization": "Bearer " + getToken() },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return BASE.replace("/api", "") + data.url;
    },

    // Categories
    saveCategory: async function (catData, isNew) {
      const body = {
        slug:         catData.slug,
        nameEn:       catData.en || catData.nameEn,
        nameHi:       catData.hi || catData.nameHi,
        description:  catData.desc || catData.description,
        heroImage:    catData.hero || catData.heroImage,
        displayOrder: catData.displayOrder || 0,
        active:       catData.active !== false,
        featured:     !!catData.featured,
      };
      let result;
      if (isNew || !catData.id) {
        result = await apiFetch("POST", "/admin/categories", body);
      } else {
        result = await apiFetch("PUT", "/admin/categories/" + catData.id, body);
      }
      await refresh();
      return result;
    },

    deleteCategory: async function (id) {
      await apiFetch("DELETE", "/admin/categories/" + id);
      await refresh();
    },

    // Orders
    updateOrderStatus: async function (orderId, status) {
      const order = (cache.orders || []).find(o => o.id === orderId);
      if (!order) return;
      await apiFetch("PATCH", "/admin/orders/" + order.orderId + "/status", { status });
      await refresh();
    },

    // Coupons
    saveCoupon: async function (couponData, isNew) {
      const body = {
        code:        couponData.code,
        type:        couponData.type,
        value:       couponData.value,
        minOrder:    couponData.minOrder || 0,
        maxDiscount: couponData.maxDisc || null,
        applies:     couponData.applies || "all",
        validTill:   couponData.validTill || null,
        maxUses:     couponData.maxUses || 0,
        status:      couponData.status || "active",
        description: couponData.desc || "",
      };
      let result;
      if (isNew || !couponData._id) {
        result = await apiFetch("POST", "/admin/coupons", body);
      } else {
        result = await apiFetch("PUT", "/admin/coupons/" + couponData._id, body);
      }
      await refresh();
      return result;
    },

    deleteCoupon: async function (id) {
      await apiFetch("DELETE", "/admin/coupons/" + id);
      await refresh();
    },

    // Reviews
    updateReview: async function (id, status) {
      await apiFetch("PATCH", "/admin/reviews/" + id + "/status", { status });
      await refresh();
    },

    deleteReview: async function (id) {
      await apiFetch("DELETE", "/admin/reviews/" + id);
      await refresh();
    },

    // Shipping zones
    saveZone: async function (zoneData, isNew) {
      let result;
      if (isNew || !zoneData.id) {
        result = await apiFetch("POST", "/admin/shipping-zones", zoneData);
      } else {
        result = await apiFetch("PUT", "/admin/shipping-zones/" + zoneData.id, zoneData);
      }
      await refresh();
      return result;
    },

    deleteZone: async function (id) {
      await apiFetch("DELETE", "/admin/shipping-zones/" + id);
      await refresh();
    },

    // Banners / CMS
    saveBanners: async function (body) {
      const result = await apiFetch("PUT", "/admin/banners", body);
      await refresh();
      return result;
    },

    refresh,
    getCache: () => cache,
    getDashboard: () => cache.dashboard,
  };

  // ── Login modal ──────────────────────────────────────────────────────────
  function showLoginModal() {
    if (document.getElementById("admin-login-modal")) return;
    const modal = document.createElement("div");
    modal.id = "admin-login-modal";
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center";
    modal.innerHTML = `
      <div style="background:var(--paper,#fff);border-radius:12px;padding:40px;width:380px;max-width:90vw;box-shadow:0 24px 64px rgba(0,0,0,.3)">
        <h2 style="font-family:var(--display,'Georgia');font-size:28px;margin:0 0 8px">Admin Login</h2>
        <p style="color:#888;font-size:13px;margin-bottom:24px">Bangali Sweets Dashboard</p>
        <label style="display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Username</label>
        <input id="al-user" type="text" value="admin" style="width:100%;padding:12px 14px;border:1px solid #ddd;border-radius:8px;font-size:15px;box-sizing:border-box;margin-bottom:14px"/>
        <label style="display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Password</label>
        <input id="al-pass" type="password" placeholder="Bangali@2024" style="width:100%;padding:12px 14px;border:1px solid #ddd;border-radius:8px;font-size:15px;box-sizing:border-box;margin-bottom:20px"/>
        <p id="al-err" style="color:red;font-size:13px;min-height:18px;margin-bottom:10px"></p>
        <button id="al-btn" onclick="adminDoLogin()" style="width:100%;padding:14px;background:#6b2727;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer">Sign in →</button>
        <p style="font-size:11px;color:#aaa;margin-top:16px;text-align:center">Default: admin / Bangali@2024</p>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById("al-pass").addEventListener("keydown", e => {
      if (e.key === "Enter") window.adminDoLogin();
    });
  }

  window.adminDoLogin = async function () {
    const user = document.getElementById("al-user").value;
    const pass = document.getElementById("al-pass").value;
    const btn  = document.getElementById("al-btn");
    const err  = document.getElementById("al-err");
    btn.disabled = true; btn.textContent = "Signing in…";
    try {
      const res = await fetch(BASE + "/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");
      localStorage.setItem(TOKEN_KEY, data.token);
      document.getElementById("admin-login-modal").remove();
      await refresh();
      if (window.renderTab) renderTab(location.hash.slice(1) || "overview");
    } catch (e) {
      err.textContent = e.message;
      btn.disabled = false; btn.textContent = "Sign in →";
    }
  };

  // ── Boot ─────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", async function () {
    if (!getToken()) {
      showLoginModal();
    } else {
      await refresh();
      if (window.renderTab) renderTab(location.hash.slice(1) || "overview");
    }
  });
})();
