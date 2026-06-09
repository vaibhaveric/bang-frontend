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

    document.getElementById("catalog-tbody").innerHTML = `<div class="scroll-x"><table class="table">
      <thead><tr>
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
          return `<tr>
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
    const p = id ? products.find(x => x.id === id) : { en: "", hi: "", cat: "sweets", unit: "500g", price: 0, mrp: 0, stock: 0, img: "", images: [] };
    const isNew = !id;
    const WEIGHT_CATS = ["sweets", "namkeen", "dairy"];   // priced per kg, sold in 250g/500g/750g/1kg boxes
    const isWeight = WEIGHT_CATS.includes(p.cat);
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
        <div><label class="label" id="d-price-label">${isWeight ? 'Price (₹ per kg)' : 'Price (₹)'}</label><input class="input" id="d-price" type="number" value="${p.price}"/></div>
        <div><label class="label">MRP (₹)</label><input class="input" id="d-mrp" type="number" value="${p.mrp}"/></div>
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
      <div style="position:relative; width:96px; height:96px; border-radius:var(--radius); overflow:hidden; border:1px solid ${i===0?'var(--accent)':'var(--rule)'};">
        <img src="${url}" style="width:100%; height:100%; object-fit:cover;"/>
        ${i===0 ? `<span style="position:absolute; left:4px; bottom:4px; background:var(--accent); color:#fff; font-size:9px; padding:1px 5px; border-radius:99px;">Primary</span>` : ''}
        <button onclick="AdminPages.catalog._removeImage(${i})" title="Remove" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,.6); color:#fff; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; line-height:1;">×</button>
      </div>
    `).join("") : `<span style="font-size:13px; color:var(--ink-3);">No images yet — upload above.</span>`;
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

  // Toggle the form between unit-priced and per-kg (weight) categories live as the dropdown changes.
  AdminPages.catalog._onCatChange = function() {
    const isW = ["sweets", "namkeen", "dairy"].includes(document.getElementById("d-cat").value);
    const unitWrap = document.getElementById("d-unit-wrap");
    if (unitWrap) unitWrap.style.display = isW ? "none" : "";
    const pl = document.getElementById("d-price-label");
    if (pl) pl.textContent = isW ? "Price (₹ per kg)" : "Price (₹)";
    const sl = document.getElementById("d-stock-label");
    if (sl) sl.textContent = isW ? "Stock (kg)" : "Stock";
  };

  AdminPages.catalog._save = async function(id) {
    const get = k => document.getElementById("d-"+k)?.value || "";
    const catSlug = get("cat");
    const isWeightCat = ["sweets", "namkeen", "dairy"].includes(catSlug);
    // Resolve categoryId from cached categories
    const catEntry = (ADMIN_API?.getCache()?.categories || []).find(c => c.slug === catSlug);
    const existing = id ? products.find(p => p.id === id) : null;
    const obj = {
      ...(existing || {}),
      id: id || ("p" + Date.now()),
      en: get("en"), hi: get("hi"), cat: catSlug,
      unit: isWeightCat ? "per kg" : get("unit"),
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
