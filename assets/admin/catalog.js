/* Admin / Catalog */

(function() {
  let products = AD.products();
  let filter = "all";

  AdminPages.catalog = function(root) {
    products = AD.products();
    const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
    const lowStockList = products.filter(p => (p.stock || 0) < 15);
    const lowStock = lowStockList.length;
    const outOfStock = products.filter(p => (p.stock || 0) === 0).length;
    const totalValue = products.reduce((s, p) => s + (p.price * (p.stock || 0)), 0);

    root.innerHTML = `
      <div class="kpi-row">
        ${AD.kpiCard("Total SKUs", products.length, `across ${BB.categories.length} categories`)}
        ${AD.kpiCard("Inventory value", AD.rupee(totalValue), `${totalStock} units in stock`)}
        ${AD.kpiCard("Low stock", `<span style="color:${lowStock>0?'var(--danger)':'var(--ink)'}">${lowStock}</span>`, `< 15 units`, lowStock ? "down" : "muted")}
        ${AD.kpiCard("Out of stock", `<span style="color:${outOfStock>0?'var(--danger)':'var(--ink)'}">${outOfStock}</span>`, "0 units", outOfStock ? "down" : "muted")}
      </div>

      <div class="table-card">
        <div class="head">
          <div>
            <div class="lbl">Catalog · ${products.length} active SKUs</div>
            <h3>Manage products &amp; stock</h3>
          </div>
          <div class="tools">
            <div class="pills-row">
              <span class="filter-chip ${filter==='all'?'sel':''}" data-cat="all">All · ${products.length}</span>
              ${BB.categories.map(cat => {
                const n = products.filter(p => p.cat === cat.slug).length;
                return `<span class="filter-chip ${filter===cat.slug?'sel':''}" data-cat="${cat.slug}">${cat.en} · ${n}</span>`;
              }).join("")}
              <span class="filter-chip ${filter==='low'?'sel':''}" data-cat="low" style="color: var(--danger)">Low stock · ${lowStock}</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="AdminPages.catalog._exportCSV()">Export</button>
            <button class="btn btn-sm" onclick="AdminPages.catalog._openDrawer()">+ Add</button>
          </div>
        </div>
        <div id="catalog-tbody"></div>
      </div>
    `;

    document.querySelectorAll(".filter-chip[data-cat]").forEach(el => {
      el.addEventListener("click", () => {
        filter = el.dataset.cat;
        renderTab("catalog");
      });
    });

    renderCatalogTable();
  };

  function renderCatalogTable() {
    let list = products;
    if (filter === "low") list = list.filter(p => (p.stock || 0) < 15);
    else if (filter && filter !== "all") list = list.filter(p => p.cat === filter);

    const liveViews = AD.liveProductViews();

    const reorderable = filter !== "low";
    document.getElementById("catalog-tbody").innerHTML = `<div class="scroll-x"><table class="table">
      <thead><tr>
        <th style="width:28px;" title="${reorderable ? 'Drag rows to set the order shown on the website' : 'Switch off the Low stock filter to reorder'}"></th>
        <th style="width:36px;"><input type="checkbox"/></th>
        <th>Product</th>
        <th>Category</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Views · 7d</th>
        <th>Sold · 30d</th>
        <th>Revenue · 30d</th>
        <th>Status</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${list.map(p => {
          const lowStock = (p.stock || 0) < 15;
          const oos = (p.stock || 0) === 0;
          const views = liveViews[p.id] || Math.floor(Math.random() * 2000) + 400;
          return `<tr data-id="${p.id}" ${reorderable ? 'draggable="true" class="cat-row"' : ''}>
            <td class="drag-handle" style="text-align:center; color:var(--ink-3); ${reorderable ? 'cursor:grab' : 'opacity:.3'}" title="Drag to reorder">⠿</td>
            <td><input type="checkbox"/></td>
            <td>
              <div style="display: flex; gap: 12px; align-items: center;">
                <div style="width: 44px; height: 44px; border-radius: var(--radius); overflow: hidden; background: var(--bg-sub); flex: 0 0 auto;"><img src="${p.img}" style="width: 100%; height: 100%; object-fit: cover;"/></div>
                <div>
                  <div style="font-weight: 600; font-size: 13px;">${p.en}</div>
                  <div style="font-family: var(--hindi); font-size: 11px; color: var(--ink-3);">${p.hi || ''} · ${p.unit || p.pieces || ''}</div>
                </div>
              </div>
            </td>
            <td><span class="chip">${AD.findCategory(p.cat)?.en || p.cat}</span></td>
            <td>
              <div style="font-weight: 600;">${AD.rupee(p.price)}</div>
              <div style="font-size: 10px; color: var(--ink-3); text-decoration: line-through;">₹${p.mrp}</div>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="dot ${oos ? 'dot-low' : lowStock ? 'dot-low' : 'dot-ok'}"></span>
                <span style="font-weight: 600; color: ${oos || lowStock ? 'var(--danger)' : 'var(--ink)'}">${p.stock || 0}</span>
              </div>
              ${lowStock ? `<button onclick="AdminPages.catalog._restock('${p.id}')" style="font-size: 10px; color: var(--accent); font-weight: 600; margin-top: 2px;">Restock</button>` : ''}
            </td>
            <td>
              <div style="font-weight: 600;">${views.toLocaleString("en-IN")}</div>
              <div class="bar" style="margin-top: 4px; width: 60px;"><i style="width: ${Math.min(100, views/3500*100)}%"></i></div>
            </td>
            <td><strong>${p.sold || 0}</strong></td>
            <td><strong style="color: var(--ok);">${AD.rupee((p.sold||0) * p.price)}</strong></td>
            <td>${AD.statusChip(oos ? "Out of stock" : (lowStock ? "Reorder" : "Live"), oos || lowStock ? "danger" : "ok")}</td>
            <td style="text-align: right;">
              <button onclick="AdminPages.catalog._openDrawer('${p.id}')" style="color: var(--accent); font-size: 12px; font-weight: 600; padding: 4px 8px;">Edit</button>
            </td>
          </tr>`;
        }).join("")}
      </tbody>
    </table></div>`;

    if (reorderable) attachDragHandlers();
  }

  // ---------- drag-to-reorder ----------
  // Rows are draggable; dropping persists displayOrder so the website lists products
  // in this exact order (the public catalogue + category API sort by displayOrder).
  function attachDragHandlers() {
    const tbody = document.querySelector("#catalog-tbody tbody");
    if (!tbody) return;

    tbody.querySelectorAll("tr.cat-row").forEach(row => {
      row.addEventListener("dragstart", e => {
        row.classList.add("dragging");
        row.style.opacity = ".4";
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", row.dataset.id);   // Firefox needs payload
      });
      row.addEventListener("dragend", () => {
        row.classList.remove("dragging");
        row.style.opacity = "";
      });
      row.addEventListener("dragover", e => {
        e.preventDefault();
        const dragging = tbody.querySelector("tr.dragging");
        if (!dragging || dragging === row) return;
        const rect = row.getBoundingClientRect();
        const after = (e.clientY - rect.top) > rect.height / 2;
        tbody.insertBefore(dragging, after ? row.nextSibling : row);
      });
    });

    tbody.addEventListener("drop", e => { e.preventDefault(); persistOrderFromDOM(); });
  }

  async function persistOrderFromDOM() {
    const tbody = document.querySelector("#catalog-tbody tbody");
    if (!tbody) return;
    const visibleIds = Array.from(tbody.querySelectorAll("tr[data-id]")).map(r => r.dataset.id);

    // Rebuild the master list: keep rows outside the current filter where they are,
    // and slot the visible rows back in their new on-screen order.
    const byId = new Map(products.map(p => [p.id, p]));
    const visibleSet = new Set(visibleIds);
    let qi = 0;
    products = products.map(p => visibleSet.has(p.id) ? byId.get(visibleIds[qi++]) : p);

    if (!window.ADMIN_API) {                 // static/offline mode — persist locally only
      AD.saveProducts(products);
      BB_APP.toast("Order saved");
      return;
    }
    try {
      const ids = products.map(p => p._backendId).filter(Boolean);
      await ADMIN_API.reorderProducts(ids);
      products = AD.products();              // re-sync from backend (now in displayOrder)
      BB_APP.toast("Order saved · live on the website");
    } catch (e) {
      BB_APP.toast("Couldn't save order: " + e.message);
      renderTab("catalog");                  // revert the DOM to the server's order
    }
  }

  AdminPages.catalog._restock = async function(id) {
    const n = prompt("Restock quantity (units):");
    if (!n) return;
    const product = products.find(p => p.id === id);
    if (!product) return;
    try {
      if (window.ADMIN_API) {
        await ADMIN_API.restock(product, Number(n));
        products = AD.products();
      } else {
        const idx = products.findIndex(p => p.id === id);
        products[idx].stock = (Number(products[idx].stock) || 0) + Number(n);
        AD.saveProducts(products);
      }
      BB_APP.toast(`Stock updated · +${n} units`);
      renderTab("catalog");
    } catch (e) { BB_APP.toast("Error: " + e.message); }
  };

  // ---------- full-screen form overlay ----------
  function openFullscreen(html) {
    let el = document.getElementById("fs-form");
    if (!el) {
      el = document.createElement("div");
      el.id = "fs-form";
      el.style.cssText = "position:fixed; inset:0; z-index:1000; background:var(--bg,#faf7f2); overflow-y:auto;";
      document.body.appendChild(el);
    }
    el.innerHTML = `<div style="max-width:920px; margin:0 auto; padding:24px 24px 96px;">${html}</div>`;
    el.style.display = "block";
    document.body.style.overflow = "hidden";
  }
  function closeFullscreen() {
    const el = document.getElementById("fs-form");
    if (el) { el.style.display = "none"; el.innerHTML = ""; }
    document.body.style.overflow = "";
  }
  AdminPages.catalog._close = closeFullscreen;

  AdminPages.catalog._openDrawer = function(id) {
    const p = id ? products.find(x => x.id === id) : { en: "", hi: "", cat: "sweets", unit: "500g", price: 0, mrp: 0, stock: 0, img: "", images: [], weights: [] };
    const isNew = !id;
    const WEIGHT_CATS = ["sweets", "namkeen", "dairy", "bakery"];   // priced per kg
    const CUSTOM_WEIGHT_CATS = ["bakery"];                          // admin defines the weight list (kg/lb)
    const isWeight = WEIGHT_CATS.includes(p.cat);
    const isCustomWeight = CUSTOM_WEIGHT_CATS.includes(p.cat);
    // working copy of the product's image list (first = primary)
    AdminPages.catalog._imgs = (p.images && p.images.length) ? p.images.slice() : (p.img ? [p.img] : []);
    openFullscreen(`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; position:sticky; top:0; background:var(--bg,#faf7f2); padding:10px 0; z-index:2; border-bottom:1px solid var(--rule);">
        <div>
          <div class="lbl" style="font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: .12em;">${isNew ? "New product" : "Edit product"}</div>
          <h2 style="margin-top: 4px;">${isNew ? "Add to catalog" : p.en}</h2>
        </div>
        <button onclick="AdminPages.catalog._close()" class="btn btn-ghost btn-sm">✕ Close</button>
      </div>

      <div class="field"><label class="label">Name (English)</label><input class="input" id="d-en" value="${p.en}"/></div>
      <div class="field"><label class="label">Name (हिंदी)</label><input class="input" style="font-family: var(--hindi);" id="d-hi" value="${p.hi||''}"/></div>
      <div class="field-row cols-2 field">
        <div><label class="label">Category</label>
          <select class="input" id="d-cat" onchange="AdminPages.catalog._onCatChange()">
            ${BB.categories.map(cat => `<option value="${cat.slug}" ${cat.slug === p.cat ? 'selected' : ''}>${cat.en}</option>`).join("")}
          </select>
        </div>
        <div id="d-unit-wrap" style="${isWeight ? 'display:none' : ''}"><label class="label">Unit / Pieces</label><input class="input" id="d-unit" value="${p.unit || p.pieces || ''}"/></div>
      </div>
      <div class="field-row cols-2 field">
        <div><label class="label" id="d-price-label">${isWeight ? 'Price (₹ per kg)' : 'Price (₹ per item)'}</label><input class="input" id="d-price" type="number" value="${p.price}"/></div>
        <div><label class="label">MRP (₹)</label><input class="input" id="d-mrp" type="number" value="${p.mrp}"/></div>
      </div>
      <div class="field" id="d-weights-wrap" style="${isCustomWeight ? '' : 'display:none'}">
        <label class="label">Available weights — comma separated, in kg or lb (e.g. <code>0.5kg, 1kg, 1.5kg</code> or <code>1lb, 2lb</code>)</label>
        <input class="input" id="d-weights" value="${(p.weights || []).map(w => w + 'kg').join(', ')}" placeholder="0.5kg, 1kg, 1.5kg, 2kg"/>
        <div style="font-size:12px; color:var(--ink-3); margin-top:6px;">Customers pick a weight; box price = per-kg price × weight. Both kg and lb are shown on the website.</div>
      </div>
      <div class="field-row cols-2 field">
        <div><label class="label" id="d-stock-label">${isWeight ? 'Stock (kg)' : 'Stock'}</label><input class="input" id="d-stock" type="number" value="${p.stock || 0}"/></div>
        <div><label class="label">Tag</label><input class="input" id="d-tag" value="${p.tag || ''}" placeholder="Bestseller / Festive / Limited"/></div>
      </div>
      <div class="field-row cols-2 field">
        <div><label class="label">HSN code</label><input class="input" id="d-hsn" value="${p.hsn || '1704'}" placeholder="1704"/></div>
        <div><label class="label">GST %</label><input class="input" id="d-gst" type="number" value="${p.gst || 5}" placeholder="5"/></div>
      </div>

      <div class="field">
        <label class="label">Product images — upload one or more (first is the primary image)</label>
        <input type="file" accept="image/*" multiple onchange="AdminPages.catalog._uploadImages(this)"/>
        <div id="d-img-grid" style="display:flex; flex-wrap:wrap; gap:10px; margin-top:12px;"></div>
      </div>

      <div class="field"><label class="label">Description</label><textarea class="input" id="d-desc" rows="3">${p.desc || ''}</textarea></div>
      <div class="field"><label class="label">Ingredients</label><textarea class="input" id="d-ing" rows="2">${p.ingredients || ''}</textarea></div>
      <div class="field"><label class="label">Shelf life &amp; storage</label><input class="input" id="d-shelf" value="${p.shelf || ''}"/></div>

      <h3 style="font-family: var(--display); font-size: 16px; margin: 22px 0 8px; padding-top: 14px; border-top: 1px solid var(--rule); font-weight: 500;">SEO</h3>
      <div class="field"><label class="label">Meta title</label><input class="input" id="d-seo-title" value="${p.seoTitle || p.en + ' — Bangali Sweets'}"/></div>
      <div class="field"><label class="label">Meta description</label><textarea class="input" id="d-seo-desc" rows="2">${p.seoDesc || (p.desc || '').slice(0, 150)}</textarea></div>

      <div style="display: flex; gap: 10px; margin-top: 24px;">
        <button class="btn btn-block" onclick="AdminPages.catalog._save('${id || ''}')">${isNew ? 'Add product' : 'Save changes'}</button>
        ${!isNew ? `<button class="btn btn-ghost" onclick="AdminPages.catalog._delete('${id}')" style="border-color: var(--danger); color: var(--danger)">Delete</button>` : ''}
      </div>
    `);
    AdminPages.catalog._renderImages();
  };

  AdminPages.catalog._renderImages = function() {
    const grid = document.getElementById("d-img-grid");
    if (!grid) return;
    const imgs = AdminPages.catalog._imgs || [];
    grid.innerHTML = imgs.length ? imgs.map((url, i) => `
      <div style="width:112px; border:1px solid ${i===0?'var(--accent)':'var(--rule)'}; border-radius:var(--radius); overflow:hidden;">
        <div style="position:relative; width:112px; height:96px;">
          <img src="${url}" style="width:100%; height:100%; object-fit:cover;"/>
          ${i===0 ? `<span style="position:absolute; left:4px; top:4px; background:var(--accent); color:#fff; font-size:9px; padding:1px 6px; border-radius:99px;">★ Main</span>` : ''}
          <button onclick="AdminPages.catalog._removeImage(${i})" title="Remove" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,.6); color:#fff; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; line-height:1;">×</button>
        </div>
        ${i!==0
          ? `<button onclick="AdminPages.catalog._setMain(${i})" style="width:100%; border:none; border-top:1px solid var(--rule); background:var(--paper); font-size:11px; padding:5px 0; cursor:pointer; color:var(--accent);">Set as main</button>`
          : `<div style="font-size:11px; text-align:center; padding:5px 0; color:var(--ink-3);">Main image</div>`}
      </div>
    `).join("") : `<span style="font-size:13px; color:var(--ink-3);">No images yet — upload above.</span>`;
  };

  AdminPages.catalog._setMain = function(i) {
    const imgs = AdminPages.catalog._imgs || [];
    if (i <= 0 || i >= imgs.length) return;
    const [picked] = imgs.splice(i, 1);
    imgs.unshift(picked);                 // move chosen image to position 0 (primary)
    AdminPages.catalog._renderImages();
  };

  AdminPages.catalog._uploadImages = async function(input) {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    const grid = document.getElementById("d-img-grid");
    if (grid) grid.insertAdjacentHTML("beforeend", `<span id="d-img-uploading" style="font-size:13px;color:var(--ink-3); align-self:center;">Uploading ${files.length}…</span>`);
    for (const f of files) {
      try {
        const url = await ADMIN_API.uploadImage(f);
        (AdminPages.catalog._imgs = AdminPages.catalog._imgs || []).push(url);
      } catch (e) { BB_APP.toast("Upload failed: " + e.message); }
    }
    input.value = "";
    AdminPages.catalog._renderImages();
  };

  AdminPages.catalog._removeImage = function(i) {
    (AdminPages.catalog._imgs || []).splice(i, 1);
    AdminPages.catalog._renderImages();
  };

  // Toggle the form between per-item and per-kg (weight) categories live as the dropdown changes.
  AdminPages.catalog._onCatChange = function() {
    const cat = document.getElementById("d-cat").value;
    const isW = ["sweets", "namkeen", "dairy", "bakery"].includes(cat);
    const isCustomW = ["bakery"].includes(cat);
    const unitWrap = document.getElementById("d-unit-wrap");
    if (unitWrap) unitWrap.style.display = isW ? "none" : "";
    const wWrap = document.getElementById("d-weights-wrap");
    if (wWrap) wWrap.style.display = isCustomW ? "" : "none";
    const pl = document.getElementById("d-price-label");
    if (pl) pl.textContent = isW ? "Price (₹ per kg)" : "Price (₹ per item)";
    const sl = document.getElementById("d-stock-label");
    if (sl) sl.textContent = isW ? "Stock (kg)" : "Stock";
  };

  // Parse the "available weights" field — accepts kg, lb/pound, or g tokens; returns kg numbers.
  AdminPages.catalog._parseWeights = function(str) {
    return (str || "").split(",").map(tok => {
      tok = tok.trim().toLowerCase();
      const num = parseFloat(tok.replace(/[^0-9.]/g, ""));
      if (!(num > 0)) return null;
      let kg;
      if (tok.includes("kg")) kg = num;
      else if (/lb|pound/.test(tok)) kg = num * 0.453592;
      else if (/(^|[^k])g\b|gram|gm/.test(tok)) kg = num / 1000;
      else kg = num;                                  // bare number → kg
      return Math.round(kg * 1000) / 1000;
    }).filter(n => n && n > 0);
  };

  AdminPages.catalog._save = async function(id) {
    const get = k => document.getElementById("d-"+k)?.value || "";
    const catSlug = get("cat");
    const isWeightCat = ["sweets", "namkeen", "dairy", "bakery"].includes(catSlug);
    const isCustomWeightCat = ["bakery"].includes(catSlug);
    // Resolve categoryId from cached categories
    const catEntry = (ADMIN_API?.getCache()?.categories || []).find(c => c.slug === catSlug);
    const existing = id ? products.find(p => p.id === id) : null;
    const obj = {
      ...(existing || {}),
      id: id || ("p" + Date.now()),
      en: get("en"), hi: get("hi"), cat: catSlug,
      unit: isWeightCat ? "per kg" : get("unit"),
      weights: isCustomWeightCat ? AdminPages.catalog._parseWeights(get("weights")) : [],
      price: Number(get("price")) || 0,
      mrp: Number(get("mrp")) || 0,
      stock: Number(get("stock")) || 0,
      tag: get("tag") || undefined,
      hsn: get("hsn"), gst: Number(get("gst")) || 5,
      img: (AdminPages.catalog._imgs || [])[0] || "",
      images: AdminPages.catalog._imgs || [],
      desc: get("desc"),
      ingredients: get("ing"), shelf: get("shelf"),
      seoTitle: get("seo-title"), seoDesc: get("seo-desc"),
      _categoryId: catEntry ? catEntry.id : (existing?._categoryId),
    };
    try {
      if (window.ADMIN_API) {
        await ADMIN_API.saveProduct(obj, !id);
        products = AD.products();
      } else {
        if (id) {
          const idx = products.findIndex(p => p.id === id);
          if (idx > -1) products[idx] = obj;
        } else { products.unshift(obj); }
        AD.saveProducts(products);
      }
      AdminPages.catalog._close(); renderTab("catalog");
      BB_APP.toast(id ? "Product updated ✦" : "Product added");
    } catch (e) { BB_APP.toast("Save failed: " + e.message); }
  };

  AdminPages.catalog._delete = async function(id) {
    if (!confirm("Delete this product?")) return;
    const product = products.find(p => p.id === id);
    try {
      if (window.ADMIN_API && product?._backendId) {
        await ADMIN_API.deleteProduct(product);
        products = AD.products();
      } else {
        products = products.filter(p => p.id !== id);
        AD.saveProducts(products);
      }
      AdminPages.catalog._close(); renderTab("catalog");
      BB_APP.toast("Product deleted");
    } catch (e) { BB_APP.toast("Delete failed: " + e.message); }
  };

  AdminPages.catalog._exportCSV = function() {
    const head = "ID,Name,Hindi,Category,Unit,Price,MRP,Stock,HSN,GST%,Sold,Image";
    const rows = products.map(p => [
      p.id, `"${p.en}"`, `"${p.hi || ''}"`, p.cat, p.unit || p.pieces || '',
      p.price, p.mrp, p.stock || 0, p.hsn || '1704', p.gst || 5, p.sold || 0, p.img
    ].join(","));
    const blob = new Blob([head + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "catalog.csv"; a.click();
    URL.revokeObjectURL(url);
  };
})();
