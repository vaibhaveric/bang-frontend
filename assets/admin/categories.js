/* Admin / Categories — list + edit/add/delete drawer */

(function() {

  AdminPages.categories = function(root) {
    const products = AD.products();
    const cats = BB.categories || [];

    // Compute top category by product count
    let topCat = "—"; let topCatCount = 0;
    cats.forEach(c => {
      const n = products.filter(p => p.cat === c.slug).length;
      if (n > topCatCount) { topCatCount = n; topCat = c.en; }
    });

    const featuredCat = cats.find(c => c.featured);

    root.innerHTML = `
      <div class="kpi-row">
        ${AD.kpiCard("Categories", cats.length, "active")}
        ${AD.kpiCard("Total products", products.length, "across all")}
        ${AD.kpiCard("Top category", topCat || "—", `${topCatCount} SKUs`)}
        ${AD.kpiCard("Featured", featuredCat ? featuredCat.en : "None", "homepage hero")}
      </div>

      <div class="table-card">
        <div class="head">
          <div>
            <div class="lbl">Storefront categories</div>
            <h3>Click to edit · drag to reorder</h3>
          </div>
          <button class="btn btn-sm" onclick="AdminPages.categories._openDrawer()">+ New category</button>
        </div>
        <div class="scroll-x"><table class="table">
          <thead><tr>
            <th style="width:30px;"></th>
            <th>Category</th>
            <th>हिंदी</th>
            <th>Slug · URL</th>
            <th>Products</th>
            <th>Stock value</th>
            <th>Order</th>
            <th>Status</th>
            <th></th>
          </tr></thead>
          <tbody>
            ${cats.slice().sort((a,b) => (a.displayOrder||0) - (b.displayOrder||0)).map((cat, i) => {
              const inCat = products.filter(p => p.cat === cat.slug);
              const stockValue = inCat.reduce((s, p) => s + (p.price * (p.stock || 0)), 0);
              const backendCat = ADMIN_API ? (ADMIN_API.getCache().categories || []).find(c => c.slug === cat.slug) : null;
              const catId = backendCat ? backendCat.id : cat.id;
              return `<tr>
                <td style="cursor: grab; color: var(--ink-3); text-align: center;">⋮⋮</td>
                <td>
                  <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius); overflow: hidden; flex: 0 0 auto; background: var(--bg-sub);">
                      ${cat.hero ? `<img src="${cat.hero}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'"/>` : ""}
                    </div>
                    <div>
                      <strong>${cat.en}</strong>
                      ${cat.featured ? `<span style="font-size:10px;margin-left:6px;padding:2px 6px;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);border-radius:99px;font-weight:700;">Featured</span>` : ""}
                      <div style="font-size: 11px; color: var(--ink-3); margin-top: 2px; max-width: 220px;">${(cat.desc || "").slice(0, 60)}${(cat.desc||"").length > 60 ? "…" : ""}</div>
                    </div>
                  </div>
                </td>
                <td style="font-family: var(--hindi);">${cat.hi}</td>
                <td><code style="font-family: ui-monospace, monospace; font-size: 11px; color: var(--ink-3);">/category.html?slug=${cat.slug}</code></td>
                <td><strong>${inCat.length}</strong></td>
                <td><strong>${AD.rupee(stockValue)}</strong></td>
                <td style="color: var(--ink-3);">${cat.displayOrder !== undefined ? cat.displayOrder : i+1}</td>
                <td>${AD.statusChip(cat.active !== false ? "Live" : "Hidden", cat.active !== false ? "ok" : "muted")}</td>
                <td style="text-align: right;">
                  <button onclick="AdminPages.categories._openDrawer(${catId})" style="color: var(--accent); font-size: 12px; font-weight: 600; padding: 4px 8px;">Edit</button>
                </td>
              </tr>`;
            }).join("")}
          </tbody>
        </table></div>
      </div>

      <div class="chart-card" style="margin-top: 16px;">
        <div class="chart-head">
          <div>
            <div class="lbl">Category navigation order</div>
            <h3>How they appear in the site header</h3>
          </div>
        </div>
        <p style="color: var(--ink-3); font-size: 13px; margin: 0 0 14px;">Set the Display Order field when editing a category to control nav and homepage grid ordering.</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; padding: 16px; background: var(--bg-sub); border-radius: var(--radius);">
          ${cats.slice().sort((a,b) => (a.displayOrder||0)-(b.displayOrder||0)).map(c => `<span class="chip" style="background: var(--paper); border: 1px solid var(--rule);">${c.en}</span>`).join("")}
        </div>
      </div>
    `;
  };

  AdminPages.categories._openDrawer = function(catId) {
    const backendCats = window.ADMIN_API ? (ADMIN_API.getCache().categories || []) : [];
    const cat = catId ? backendCats.find(c => c.id === catId) : null;
    const isNew = !cat;

    // Resolve frontend display object for pre-fill if backend cat is missing fields
    const displayCat = cat || {};

    openDrawer(`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <div class="lbl" style="font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: .12em;">${isNew ? "New category" : "Edit category"}</div>
          <h2 style="margin-top: 4px;">${isNew ? "Add to storefront" : displayCat.nameEn || ""}</h2>
        </div>
        <button onclick="closeDrawer()" style="font-size: 24px; color: var(--ink-3);">×</button>
      </div>

      ${!isNew && displayCat.heroImage ? `
        <div style="width: 100%; aspect-ratio: 16/5; border-radius: var(--radius); overflow: hidden; margin-bottom: 18px; background: var(--bg-sub);">
          <img src="${displayCat.heroImage}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.style.display='none'"/>
        </div>` : ""}

      <div class="field"><label class="label">Name (English) *</label>
        <input class="input" id="dc-en" value="${displayCat.nameEn || ""}" placeholder="Sweets" oninput="AdminPages.categories._autoSlug()"/>
      </div>
      <div class="field"><label class="label">Name (हिंदी)</label>
        <input class="input" style="font-family: var(--hindi);" id="dc-hi" value="${displayCat.nameHi || ""}" placeholder="मिठाइयाँ"/>
      </div>
      <div class="field"><label class="label">Slug (URL key)</label>
        <input class="input" id="dc-slug" value="${displayCat.slug || ""}" placeholder="sweets"/>
        <div style="font-size:11px;color:var(--ink-3);margin-top:4px;">Used in URL: /category.html?slug=<strong id="dc-slug-preview">${displayCat.slug || "…"}</strong></div>
      </div>
      <div class="field"><label class="label">Description</label>
        <textarea class="input" id="dc-desc" rows="2" placeholder="Short description for the category page…">${displayCat.description || ""}</textarea>
      </div>
      <div class="field"><label class="label">Hero image URL</label>
        <input class="input" id="dc-hero" value="${displayCat.heroImage || ""}" placeholder="https://…" oninput="AdminPages.categories._previewHero()"/>
        <div id="dc-hero-preview" style="margin-top:8px;display:${displayCat.heroImage?'block':'none'}">
          <img src="${displayCat.heroImage || ""}" style="width:100%;aspect-ratio:16/5;object-fit:cover;border-radius:var(--radius);" onerror="this.style.display='none'"/>
        </div>
      </div>
      <div class="field-row cols-2 field">
        <div><label class="label">Display order</label>
          <input class="input" id="dc-order" type="number" value="${displayCat.displayOrder !== undefined ? displayCat.displayOrder : 0}" min="0"/>
        </div>
        <div style="padding-top: 8px;">
          <label class="label">&nbsp;</label>
          <div style="display:flex;gap:16px;padding-top:4px;">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="dc-active" ${displayCat.active !== false ? "checked" : ""}/> Active
            </label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
              <input type="checkbox" id="dc-featured" ${displayCat.featured ? "checked" : ""}/> Featured
            </label>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 24px;">
        <button class="btn btn-block" onclick="AdminPages.categories._save(${catId || "null"})">${isNew ? "Create category" : "Save changes"}</button>
        ${!isNew ? `<button class="btn btn-ghost" onclick="AdminPages.categories._delete(${catId})" style="border-color: var(--danger); color: var(--danger)">Delete</button>` : ""}
      </div>
    `);

    // Focus first input
    setTimeout(() => document.getElementById("dc-en")?.focus(), 50);
  };

  AdminPages.categories._autoSlug = function() {
    const en = document.getElementById("dc-en")?.value || "";
    const slug = en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const slugInput = document.getElementById("dc-slug");
    const preview = document.getElementById("dc-slug-preview");
    if (slugInput && !slugInput.dataset.manual) {
      slugInput.value = slug;
      if (preview) preview.textContent = slug || "…";
    }
  };

  AdminPages.categories._previewHero = function() {
    const url = document.getElementById("dc-hero")?.value || "";
    const div = document.getElementById("dc-hero-preview");
    if (!div) return;
    if (url) {
      div.style.display = "block";
      const img = div.querySelector("img");
      if (img) { img.src = url; img.style.display = ""; }
    } else {
      div.style.display = "none";
    }
  };

  // Prevent auto-slug override once user edits slug manually
  document.addEventListener("input", function(e) {
    if (e.target && e.target.id === "dc-slug") {
      e.target.dataset.manual = "1";
      const preview = document.getElementById("dc-slug-preview");
      if (preview) preview.textContent = e.target.value || "…";
    }
  });

  AdminPages.categories._save = async function(catId) {
    const g = id => document.getElementById(id)?.value || "";
    const data = {
      id:           catId || null,
      slug:         g("dc-slug"),
      nameEn:       g("dc-en"),
      nameHi:       g("dc-hi"),
      description:  g("dc-desc"),
      heroImage:    g("dc-hero"),
      displayOrder: parseInt(g("dc-order")) || 0,
      active:       document.getElementById("dc-active")?.checked !== false,
      featured:     !!document.getElementById("dc-featured")?.checked,
      // Frontend format aliases
      en:   g("dc-en"),
      hi:   g("dc-hi"),
      desc: g("dc-desc"),
      hero: g("dc-hero"),
    };

    if (!data.nameEn || !data.slug) {
      BB_APP.toast("Name and slug are required");
      return;
    }

    try {
      if (window.ADMIN_API) {
        await ADMIN_API.saveCategory(data, !catId);
      } else {
        BB_APP.toast("Backend not connected");
        return;
      }
      closeDrawer();
      renderTab("categories");
      BB_APP.toast(catId ? "Category updated ✦" : "Category created ✦");
    } catch (e) {
      BB_APP.toast("Error: " + e.message);
    }
  };

  AdminPages.categories._delete = async function(catId) {
    if (!confirm("Delete this category? Products assigned to it will need to be reassigned.")) return;
    try {
      if (window.ADMIN_API) {
        await ADMIN_API.deleteCategory(catId);
      }
      closeDrawer();
      renderTab("categories");
      BB_APP.toast("Category deleted");
    } catch (e) {
      BB_APP.toast("Delete failed: " + e.message);
    }
  };
})();
