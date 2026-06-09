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

  AdminPages.catalog._restock = function(id) {
    const n = prompt("Restock quantity (units):");
    if (!n) return;
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return;
    products[idx].stock = (Number(products[idx].stock) || 0) + Number(n);
    AD.saveProducts(products);
    BB_APP.toast(`Stock updated · +${n} units`);
    renderTab("catalog");
  };

  AdminPages.catalog._openDrawer = function(id) {
    const p = id ? products.find(x => x.id === id) : { en: "", hi: "", cat: "sweets", unit: "500g", price: 0, mrp: 0, stock: 0, img: "" };
    const isNew = !id;
    openDrawer(`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <div class="lbl" style="font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: .12em;">${isNew ? "New product" : "Edit product"}</div>
          <h2 style="margin-top: 4px;">${isNew ? "Add to catalog" : p.en}</h2>
        </div>
        <button onclick="closeDrawer()" style="font-size: 24px; color: var(--ink-3);">×</button>
      </div>

      ${!isNew ? `<div style="display: flex; gap: 14px; padding: 12px; background: var(--bg-sub); border-radius: var(--radius); margin-bottom: 18px;">
        <img src="${p.img}" style="width: 60px; height: 60px; object-fit: cover; border-radius: var(--radius);"/>
        <div>
          <div style="font-family: ui-monospace, monospace; font-size: 11px; color: var(--ink-3);">${p.id}</div>
          <div style="font-size: 13px; margin-top: 4px;">Sold ${p.sold || 0} · ${(p.rating || 0).toFixed(1)} ★ (${p.reviews || 0} reviews)</div>
        </div>
      </div>` : ''}

      <div class="field"><label class="label">Name (English)</label><input class="input" id="d-en" value="${p.en}"/></div>
      <div class="field"><label class="label">Name (हिंदी)</label><input class="input" style="font-family: var(--hindi);" id="d-hi" value="${p.hi||''}"/></div>
      <div class="field-row cols-2 field">
        <div><label class="label">Category</label>
          <select class="input" id="d-cat">
            ${BB.categories.map(cat => `<option value="${cat.slug}" ${cat.slug === p.cat ? 'selected' : ''}>${cat.en}</option>`).join("")}
          </select>
        </div>
        <div><label class="label">Unit / Pieces</label><input class="input" id="d-unit" value="${p.unit || p.pieces || ''}"/></div>
      </div>
      <div class="field-row cols-2 field">
        <div><label class="label">Price (₹)</label><input class="input" id="d-price" type="number" value="${p.price}"/></div>
        <div><label class="label">MRP (₹)</label><input class="input" id="d-mrp" type="number" value="${p.mrp}"/></div>
      </div>
      <div class="field-row cols-2 field">
        <div><label class="label">Stock</label><input class="input" id="d-stock" type="number" value="${p.stock || 0}"/></div>
        <div><label class="label">Tag</label><input class="input" id="d-tag" value="${p.tag || ''}" placeholder="Bestseller / Festive / Limited"/></div>
      </div>
      <div class="field-row cols-2 field">
        <div><label class="label">HSN code</label><input class="input" id="d-hsn" value="${p.hsn || '1704'}" placeholder="1704"/></div>
        <div><label class="label">GST %</label><input class="input" id="d-gst" type="number" value="${p.gst || 5}" placeholder="5"/></div>
      </div>
      <div class="field"><label class="label">Image URL</label><input class="input" id="d-img" value="${p.img || ''}"/></div>
      ${p.img ? `<img src="${p.img}" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: var(--radius); margin-bottom: 14px;"/>` : ''}
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
  };

  AdminPages.catalog._save = function(id) {
    const get = k => document.getElementById("d-"+k).value;
    const obj = {
      id: id || ("p" + Date.now()),
      en: get("en"),
      hi: get("hi"),
      cat: get("cat"),
      unit: get("unit"),
      price: Number(get("price")) || 0,
      mrp: Number(get("mrp")) || 0,
      stock: Number(get("stock")) || 0,
      tag: get("tag") || undefined,
      hsn: get("hsn"),
      gst: Number(get("gst")) || 5,
      img: get("img"),
      desc: get("desc"),
      ingredients: get("ing"),
      shelf: get("shelf"),
      seoTitle: get("seo-title"),
      seoDesc: get("seo-desc"),
    };
    if (id) {
      const idx = products.findIndex(p => p.id === id);
      if (idx > -1) products[idx] = { ...products[idx], ...obj };
    } else {
      products.unshift(obj);
    }
    AD.saveProducts(products);
    closeDrawer();
    renderTab("catalog");
    BB_APP.toast(id ? "Product updated ✦" : "Product added");
  };

  AdminPages.catalog._delete = function(id) {
    if (!confirm("Delete this product? You can restore via 'Reset demo'.")) return;
    products = products.filter(p => p.id !== id);
    AD.saveProducts(products);
    closeDrawer();
    renderTab("catalog");
    BB_APP.toast("Product deleted");
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
