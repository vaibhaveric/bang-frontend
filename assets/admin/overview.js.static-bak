/* Admin / Overview */

(function() {
  function renderOrdersTable(orderList, compact) {
    if (orderList.length === 0) {
      return `<div style="padding: 32px; text-align: center; color: var(--ink-3);">
        No orders yet. <a href="checkout.html" style="color: var(--accent); display: inline; font-weight: 600;">Place a test order</a> to see live data appear here.
      </div>`;
    }
    return `<div class="scroll-x"><table class="table">
      <thead><tr>
        <th>Order</th>
        <th>Customer</th>
        <th>Items</th>
        <th>Total</th>
        <th>Mode</th>
        <th>Placed</th>
        <th>Status</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${orderList.map(o => {
          const elapsedMin = Math.floor((Date.now() - o.placedAt) / 60000);
          const when = elapsedMin < 60 ? `${elapsedMin}m ago` : elapsedMin < 1440 ? `${Math.floor(elapsedMin/60)}h ago` : `${Math.floor(elapsedMin/1440)}d ago`;
          const status = o.status || (elapsedMin < 10 ? "Packing" : elapsedMin < 30 ? "Sealed" : elapsedMin < 60 ? "Out for delivery" : "Delivered");
          const color = status === "Delivered" ? "ok" : status === "Out for delivery" ? "warn" : "accent";
          return `<tr style="cursor:pointer" onclick="AdminPages.orders._open('${o.id}')">
            <td><strong style="font-family: ui-monospace, monospace; font-size: 12px;">${o.id}</strong></td>
            <td>${o.name || "—"}<div style="font-size: 11px; color: var(--ink-3);">+91 ${o.phone || "—"}</div></td>
            <td><strong>${o.items.length}</strong></td>
            <td><strong>${AD.rupee(o.total)}</strong></td>
            <td><span class="chip">${o.mode || "delivery"}</span></td>
            <td style="color: var(--ink-3); font-size: 12px;">${when}</td>
            <td>${AD.statusChip(status, color)}</td>
            <td style="text-align: right;"><a style="color: var(--accent); font-size: 11px; font-weight: 600;">Open →</a></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table></div>`;
  }

  AdminPages.overview = function(root) {
    const orders = BB_APP.orders.read();
    const today = AD.todayOrders();
    const todayRev = today.reduce((s,o) => s + (o.total||0), 0);
    const allRev = orders.reduce((s,o) => s + (o.total||0), 0);
    const aov = orders.length ? Math.round(allRev / orders.length) : 0;
    const products = AD.products();
    const lowStock = products.filter(p => (p.stock||0) < 15);

    const max = Math.max(...AD.sales14d);
    const pts = AD.sales14d.map((v, i) => `${(i / (AD.sales14d.length - 1)) * 100},${100 - (v / max) * 88}`).join(" ");

    root.innerHTML = `
      <div class="kpi-row">
        ${AD.kpiCard("Revenue · today", AD.rupee(todayRev || 84230), `↑ ${today.length || 12} orders`)}
        ${AD.kpiCard("Live orders", String(orders.length || 67), `${orders.length || 8} need packing`)}
        ${AD.kpiCard("AOV", AD.rupee(aov || 1257), "↑ 4.1% vs last week")}
        ${AD.kpiCard("Live visitors", '<span>23</span> <span class="dot dot-ok" style="animation: pulse 1.6s infinite"></span>', "on Hampers (8)")}
      </div>

      <div class="charts-row">
        <div class="chart-card">
          <div class="chart-head">
            <div>
              <div class="lbl">Sales · last 14 days</div>
              <h3>${AD.rupee(AD.sales14d.reduce((a,b)=>a+b,0))}</h3>
            </div>
            <div class="chart-tabs">
              <span>7D</span><span class="sel">14D</span><span>30D</span><span>90D</span><span>1Y</span>
            </div>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:160px;">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6b2727" stop-opacity=".25"/>
                <stop offset="100%" stop-color="#6b2727" stop-opacity="0"/>
              </linearGradient>
            </defs>
            ${[20,40,60,80].map(y => `<line x1="0" x2="100" y1="${y}" y2="${y}" stroke="#e0d4ba" stroke-width="0.3" vector-effect="non-scaling-stroke" stroke-dasharray="0.8 1.6"/>`).join("")}
            <polygon points="0,100 ${pts} 100,100" fill="url(#g1)"/>
            <polyline points="${pts}" fill="none" stroke="#6b2727" stroke-width="0.7" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
            ${AD.sales14d.map((v,i) => `<circle cx="${(i/(AD.sales14d.length-1))*100}" cy="${100-(v/max)*88}" r="0.8" fill="#fff" stroke="#6b2727" stroke-width="0.6" vector-effect="non-scaling-stroke"/>`).join("")}
          </svg>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--ink-3); margin-top: 6px;">
            <span>Apr 28</span><span>May 2</span><span>May 6</span><span>May 10</span><span>May 12</span>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-head">
            <div>
              <div class="lbl">Traffic sources · 7d</div>
              <h3>12,442 sessions</h3>
            </div>
            <span class="chip" style="background: color-mix(in srgb, var(--ok) 14%, transparent); color: var(--ok); font-weight: 600;">● Live</span>
          </div>
          <div style="display: flex; height: 10px; border-radius: 99px; overflow: hidden; margin-bottom: 14px;">
            ${AD.traffic.map(t => `<div style="width: ${t.v}%; background: ${t.color};"></div>`).join("")}
          </div>
          ${AD.traffic.map(t => `
            <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; padding: 5px 0;">
              <span style="width: 9px; height: 9px; border-radius: 2px; background: ${t.color}"></span>
              <span style="flex: 1; color: var(--ink-2)">${t.label}</span>
              <span style="font-weight: 600;">${t.v}%</span>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="bottom-row">
        <div class="table-card">
          <div class="head">
            <div>
              <div class="lbl">Live orders</div>
              <h3>Today's queue</h3>
            </div>
            <a class="btn btn-ghost btn-sm" onclick="renderTab('orders')">View all →</a>
          </div>
          ${renderOrdersTable(orders.slice().reverse().slice(0, 5), true)}
        </div>

        <div class="chart-card">
          <div class="chart-head">
            <div>
              <div class="lbl">Top products · 30d</div>
              <h3>Best sellers</h3>
            </div>
            <a class="btn btn-ghost btn-sm" onclick="renderTab('reports')">Full report →</a>
          </div>
          ${products.slice().sort((a,b) => (b.sold||0)-(a.sold||0)).slice(0,6).map((p, i, arr) => {
            const max = Math.max(...arr.map(x => x.sold||0));
            return `
              <div style="display: grid; grid-template-columns: 22px 36px 1fr auto; gap: 10px; padding: 8px 0; align-items: center; border-bottom: 1px solid var(--rule);">
                <span style="font-family: var(--display); color: var(--ink-3); font-size: 13px;">${i+1}</span>
                <div style="width: 36px; height: 36px; background: var(--bg-sub); border-radius: var(--radius); overflow: hidden;"><img src="${p.img}" style="width: 100%; height: 100%; object-fit: cover;"/></div>
                <div>
                  <div style="font-size: 13px; font-weight: 600; line-height: 1.1">${p.en}</div>
                  <div class="bar" style="margin-top: 5px; height: 4px;"><i style="width: ${((p.sold||0)/max)*100}%"></i></div>
                </div>
                <div style="text-align: right; font-size: 12px;"><strong>${p.sold||0}</strong> sold<br/><span style="color: var(--ok); font-size: 10px;">${AD.rupee((p.sold||0)*p.price)}</span></div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <!-- Alerts row -->
      <div class="charts-row" style="grid-template-columns: 1fr 1fr;">
        <div class="chart-card">
          <div class="chart-head">
            <div>
              <div class="lbl">Low stock alerts</div>
              <h3>${lowStock.length} items need attention</h3>
            </div>
            <a class="btn btn-ghost btn-sm" onclick="renderTab('catalog')">Catalog →</a>
          </div>
          ${lowStock.length === 0
            ? `<div style="padding: 20px 0; color: var(--ink-3); font-size: 13px;">✓ All products are well-stocked.</div>`
            : lowStock.slice(0, 5).map(p => `
              <div style="display: grid; grid-template-columns: 36px 1fr auto; gap: 10px; padding: 8px 0; align-items: center; border-bottom: 1px solid var(--rule);">
                <div style="width: 36px; height: 36px; background: var(--bg-sub); border-radius: var(--radius); overflow: hidden;"><img src="${p.img}" style="width: 100%; height: 100%; object-fit: cover;"/></div>
                <div>
                  <div style="font-size: 13px; font-weight: 600;">${p.en}</div>
                  <div style="font-size: 11px; color: var(--ink-3);">${p.hi || ''}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 13px; font-weight: 700; color: var(--danger);">${p.stock} left</div>
                  <button onclick="AdminPages.catalog._openDrawer('${p.id}')" style="font-size: 11px; color: var(--accent); font-weight: 600; margin-top: 2px;">Restock →</button>
                </div>
              </div>
            `).join("")
          }
        </div>

        <div class="chart-card">
          <div class="chart-head">
            <div>
              <div class="lbl">To do · review queue</div>
              <h3>Things waiting on you</h3>
            </div>
          </div>
          ${(() => {
            const reviewPending = AD.reviews().filter(r => r.status === "pending").length;
            const reviewFlagged = AD.reviews().filter(r => r.status === "flagged").length;
            const tasks = [
              { ic: "📦", t: `${orders.filter(o => !o.status || o.status === "Packing").length} orders need packing`, link: "orders" },
              { ic: "★",  t: `${reviewPending} reviews pending approval`, link: "reviews" },
              { ic: "⚠",  t: `${reviewFlagged} reviews flagged for moderation`, link: "reviews" },
              { ic: "📊", t: `Last month's GST report due 11 days`, link: "reports" },
              { ic: "🎁", t: `Diwali coupon DIWALI20 expires in 30 days`, link: "coupons" },
            ];
            return tasks.map(t => `
              <div onclick="renderTab('${t.link}')" style="display: flex; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--rule); cursor: pointer; align-items: center;">
                <div class="icon-sq accent">${t.ic}</div>
                <div style="flex: 1; font-size: 13px;">${t.t}</div>
                <span style="color: var(--ink-3);">→</span>
              </div>
            `).join("");
          })()}
        </div>
      </div>
    `;
  };
})();
