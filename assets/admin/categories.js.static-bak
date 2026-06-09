/* Admin / Categories */

(function() {
  AdminPages.categories = function(root) {
    const products = AD.products();
    const pageViews = AD.livePageViews();

    root.innerHTML = `
      <div class="kpi-row">
        ${AD.kpiCard("Categories", BB.categories.length, "active")}
        ${AD.kpiCard("Total products", products.length, "across all")}
        ${AD.kpiCard("Top category", "Sweets", `${products.filter(p => p.cat === 'sweets').length} SKUs`)}
        ${AD.kpiCard("Featured", "Hampers", "homepage hero")}
      </div>

      <div class="table-card">
        <div class="head">
          <div>
            <div class="lbl">Storefront categories</div>
            <h3>Drag to reorder · click to edit</h3>
          </div>
          <button class="btn btn-sm">+ New category</button>
        </div>
        <div class="scroll-x"><table class="table">
          <thead><tr>
            <th style="width:30px;"></th>
            <th>Category</th>
            <th>हिंदी</th>
            <th>Slug · URL</th>
            <th>Products</th>
            <th>Views · 7d</th>
            <th>Stock value</th>
            <th>Order</th>
            <th>Status</th>
            <th></th>
          </tr></thead>
          <tbody>
            ${BB.categories.map((cat, i) => {
              const inCat = products.filter(p => p.cat === cat.slug);
              const stockValue = inCat.reduce((s, p) => s + (p.price * (p.stock || 0)), 0);
              const views = pageViews[`category.html`] || Math.floor(Math.random() * 3000) + 800;
              return `<tr>
                <td style="cursor: grab; color: var(--ink-3); text-align: center;">⋮⋮</td>
                <td>
                  <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="width: 48px; height: 48px; border-radius: var(--radius); overflow: hidden; flex: 0 0 auto;"><img src="${cat.hero}" style="width: 100%; height: 100%; object-fit: cover;"/></div>
                    <div>
                      <strong>${cat.en}</strong>
                      <div style="font-size: 11px; color: var(--ink-3); margin-top: 2px; max-width: 220px;">${cat.desc.slice(0, 60)}…</div>
                    </div>
                  </div>
                </td>
                <td style="font-family: var(--hindi);">${cat.hi}</td>
                <td><code style="font-family: ui-monospace, monospace; font-size: 11px; color: var(--ink-3);">/category.html?slug=${cat.slug}</code></td>
                <td><strong>${inCat.length}</strong></td>
                <td>${views.toLocaleString('en-IN')}</td>
                <td><strong>${AD.rupee(stockValue)}</strong></td>
                <td style="color: var(--ink-3);">${i+1}</td>
                <td>${AD.statusChip("Live", "ok")}</td>
                <td style="text-align: right;">
                  <button style="color: var(--accent); font-size: 12px; font-weight: 600;">Edit</button>
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
        <p style="color: var(--ink-3); font-size: 13px; margin: 0 0 14px;">Drag &amp; drop in the table above to change the order shown in the nav, homepage category grid, and footer.</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; padding: 16px; background: var(--bg-sub); border-radius: var(--radius);">
          ${BB.categories.map(c => `<span class="chip" style="background: var(--paper); border: 1px solid var(--rule);">${c.en}</span>`).join("")}
        </div>
      </div>
    `;
  };
})();
