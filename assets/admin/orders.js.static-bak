/* Admin / Orders — list + detail modal */

(function() {
  let currentFilter = "all";

  function whenLabel(t) {
    const elapsedMin = Math.floor((Date.now() - t) / 60000);
    if (elapsedMin < 60) return `${elapsedMin}m ago`;
    if (elapsedMin < 1440) return `${Math.floor(elapsedMin/60)}h ago`;
    return `${Math.floor(elapsedMin/1440)}d ago`;
  }
  function statusOf(o) {
    if (o.status) return o.status;
    const m = Math.floor((Date.now() - o.placedAt) / 60000);
    return m < 10 ? "Packing" : m < 30 ? "Sealed" : m < 60 ? "Out for delivery" : "Delivered";
  }
  function statusColor(s) {
    if (s === "Delivered") return "ok";
    if (s === "Out for delivery") return "warn";
    if (s === "Cancelled") return "danger";
    if (s === "Refunded") return "muted";
    return "accent";
  }

  AdminPages.orders = function(root) {
    const all = BB_APP.orders.read().slice().reverse();
    const today = all.filter(o => Date.now() - o.placedAt < 86400000);
    const packing = all.filter(o => statusOf(o) === "Packing");
    const ofd = all.filter(o => statusOf(o) === "Out for delivery");
    const delivered = all.filter(o => statusOf(o) === "Delivered");

    root.innerHTML = `
      <div class="kpi-row">
        ${AD.kpiCard("Today's orders", today.length, "+ since 9 AM")}
        ${AD.kpiCard("Need packing", `<span style="color:${packing.length>0?'var(--danger)':'var(--ink)'}">${packing.length}</span>`, packing.length ? "🔴 priority" : "all clear", packing.length ? "down" : "up")}
        ${AD.kpiCard("Out for delivery", ofd.length, "in transit")}
        ${AD.kpiCard("Lifetime revenue", AD.rupee(all.reduce((s,o)=>s+(o.total||0),0)), `${all.length} orders total`)}
      </div>

      <div class="table-card">
        <div class="head">
          <div>
            <div class="lbl">All orders</div>
            <h3>${all.length} order${all.length !== 1 ? 's' : ''}</h3>
          </div>
          <div class="tools">
            <div class="pills-row">
              <span class="filter-chip ${currentFilter==='all'?'sel':''}" data-f="all">All · ${all.length}</span>
              <span class="filter-chip ${currentFilter==='today'?'sel':''}" data-f="today">Today · ${today.length}</span>
              <span class="filter-chip ${currentFilter==='packing'?'sel':''}" data-f="packing">Packing · ${packing.length}</span>
              <span class="filter-chip ${currentFilter==='ofd'?'sel':''}" data-f="ofd">In transit · ${ofd.length}</span>
              <span class="filter-chip ${currentFilter==='delivered'?'sel':''}" data-f="delivered">Delivered · ${delivered.length}</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="AdminPages.orders._exportCSV()">Export CSV</button>
          </div>
        </div>
        <div id="orders-table"></div>
      </div>

      ${all.length === 0 ? `
        <div class="chart-card" style="text-align: center; padding: 40px;">
          <div style="font-size: 56px; margin-bottom: 12px;">📭</div>
          <h3 style="font-family: var(--display); font-size: 22px; margin-bottom: 6px;">No live orders yet</h3>
          <p style="color: var(--ink-3); font-size: 13px;">Place a <a href="checkout.html" style="color: var(--accent); display: inline; font-weight: 600;">test order</a> on the storefront to see it appear here.</p>
        </div>` : ""}
    `;

    document.querySelectorAll(".filter-chip[data-f]").forEach(el => {
      el.addEventListener("click", () => {
        currentFilter = el.dataset.f;
        renderTab("orders");
      });
    });

    let list = all;
    if (currentFilter === "today") list = today;
    else if (currentFilter === "packing") list = packing;
    else if (currentFilter === "ofd") list = ofd;
    else if (currentFilter === "delivered") list = delivered;

    document.getElementById("orders-table").innerHTML = list.length === 0 ? "" : `
      <div class="scroll-x"><table class="table">
        <thead><tr>
          <th><input type="checkbox"/></th>
          <th>Order</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Total</th>
          <th>Mode</th>
          <th>Address</th>
          <th>Placed</th>
          <th>Status</th>
          <th></th>
        </tr></thead>
        <tbody>
          ${list.map(o => {
            const st = statusOf(o);
            return `<tr onclick="AdminPages.orders._open('${o.id}')" style="cursor:pointer;">
              <td onclick="event.stopPropagation()"><input type="checkbox"/></td>
              <td><strong style="font-family: ui-monospace, monospace; font-size: 12px;">${o.id}</strong></td>
              <td>${o.name || "—"}<div style="font-size: 11px; color: var(--ink-3);">+91 ${o.phone || "—"}</div></td>
              <td><strong>${o.items.length}</strong></td>
              <td><strong>${AD.rupee(o.total)}</strong></td>
              <td><span class="chip">${o.mode || "delivery"}</span></td>
              <td style="font-size: 12px; max-width: 220px;">${(o.address || "—").slice(0, 60)}${(o.address||'').length > 60 ? '…' : ''}</td>
              <td style="color: var(--ink-3); font-size: 12px;">${whenLabel(o.placedAt)}</td>
              <td>${AD.statusChip(st, statusColor(st))}</td>
              <td style="text-align: right;"><a style="color: var(--accent); font-size: 11px; font-weight: 600;">Open →</a></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table></div>`;
  };

  // === Open order detail modal ===
  AdminPages.orders._open = function(id) {
    const order = BB_APP.orders.read().find(o => o.id === id);
    if (!order) return;

    const st = statusOf(order);
    const placed = new Date(order.placedAt);
    const placedFmt = placed.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    const elapsedMin = (Date.now() - order.placedAt) / 60000;

    const steps = [
      { label: "Order received",       t: placedFmt,                                       msg: `Payment confirmed via ${order.payment === 'cod' ? 'COD' : 'UPI'}.`, done: true },
      { label: "Packing",               t: elapsedMin > 2  ? "~5 min ago"  : (st === "Packing" ? "Now" : "—"), msg: "Kitchen team plating mithai." },
      { label: "Quality check & seal",  t: elapsedMin > 8  ? "~3 min ago"  : "—",          msg: "Final taste check, vacuum seal, thermal liner." },
      { label: order.mode === "pickup" ? "Ready for pickup" : "Out for delivery",
        t: elapsedMin > 15 ? "Just now" : "—",
        msg: order.mode === "pickup" ? "Pickup from outlet." : "Rider has dispatched." },
      { label: "Delivered",             t: elapsedMin > 60 ? "Today" : "ETA · Today 6 PM", msg: "Customer received the order." },
    ];
    // mark progress
    const stepIdx = ["Packing","Sealed","Out for delivery","Delivered"].indexOf(st);
    steps.forEach((s, i) => {
      if (i <= stepIdx) s.done = true;
      else if (i === stepIdx + 1) s.curr = true;
    });
    // adjust for delivered
    if (st === "Delivered") { steps.forEach(s => s.done = true); }

    // line items
    const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
    const delivery = order.total - subtotal;

    const html = `
      <div class="modal-head">
        <div>
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 6px;">
            <span style="font-family: ui-monospace, monospace; font-size: 14px; color: var(--ink-3);">${order.id}</span>
            ${AD.statusChip(st, statusColor(st))}
          </div>
          <h2>${order.name || "Customer"} <span style="font-family: var(--hindi); font-size: 16px; color: var(--accent); font-style: normal;">· ${order.phone || ""}</span></h2>
          <div style="font-size: 12px; color: var(--ink-3); margin-top: 4px;">Placed ${placedFmt} · ${order.items.length} items · ${order.mode || "delivery"}</div>
        </div>
        <span class="close" onclick="closeModal()">×</span>
      </div>
      <div class="modal-body">

        <!-- Action bar -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid var(--rule);">
          ${st === "Packing" ? `<button class="btn btn-sm" onclick="AdminPages.orders._setStatus('${order.id}', 'Sealed')">Mark packed →</button>` : ''}
          ${st === "Sealed"  ? `<button class="btn btn-sm" onclick="AdminPages.orders._setStatus('${order.id}', 'Out for delivery')">Dispatch →</button>` : ''}
          ${st === "Out for delivery" ? `<button class="btn btn-sm" onclick="AdminPages.orders._setStatus('${order.id}', 'Delivered')">Mark delivered ✓</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="alert('Print invoice — wire to backend')">Print invoice</button>
          <button class="btn btn-ghost btn-sm" onclick="window.open('https://wa.me/91${(order.phone||'').replace(/\\D/g,'')}','_blank')">💬 WhatsApp customer</button>
          <button class="btn btn-ghost btn-sm" onclick="window.open('track.html?id=${order.id}','_blank')">Customer track →</button>
          <span style="flex: 1;"></span>
          ${st !== "Delivered" && st !== "Cancelled" && st !== "Refunded" ? `
            <button class="btn btn-ghost btn-sm" style="color: var(--danger); border-color: var(--danger);" onclick="AdminPages.orders._cancel('${order.id}')">Cancel order</button>
          ` : ''}
          ${st === "Delivered" ? `
            <button class="btn btn-ghost btn-sm" style="color: var(--danger); border-color: var(--danger);" onclick="AdminPages.orders._refund('${order.id}')">Issue refund</button>
          ` : ''}
        </div>

        <div class="detail-grid">
          <div>
            <!-- Items -->
            <div class="detail-panel" style="margin-bottom: 16px;">
              <h3>Items <span style="font-size: 12px; color: var(--ink-3); font-family: var(--sans); font-weight: 500;">${order.items.length} line${order.items.length !== 1 ? 's' : ''}</span></h3>
              ${order.items.map(i => `
                <div style="display: grid; grid-template-columns: 50px 1fr auto; gap: 12px; padding: 10px 0; align-items: center; border-bottom: 1px solid var(--rule);">
                  <img src="${i.img}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius);"/>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">${i.name}</div>
                    <div style="font-size: 11px; color: var(--ink-3);">Qty ${i.qty} · ${AD.rupee(i.price)} each</div>
                  </div>
                  <div style="font-family: var(--display); font-size: 18px;">${AD.rupee(i.price * i.qty)}</div>
                </div>
              `).join("")}
              <div style="padding: 14px 0 0; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; padding: 4px 0;"><span>Subtotal</span><span>${AD.rupee(subtotal)}</span></div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0; color: var(--ink-3);"><span>Delivery</span><span>${delivery === 0 ? "FREE" : AD.rupee(delivery)}</span></div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0 0; border-top: 1px dashed var(--rule-strong); margin-top: 6px; font-family: var(--display); font-size: 20px;"><span>Total</span><span>${AD.rupee(order.total)}</span></div>
              </div>
            </div>

            <!-- Activity log -->
            <div class="detail-panel">
              <h3>Activity timeline</h3>
              <div class="timeline-vert">
                ${steps.map(s => `
                  <div class="tl-vert-step ${s.done ? 'done' : ''} ${s.curr ? 'curr' : ''}">
                    <div class="dot">${s.done ? '✓' : (s.curr ? '●' : '○')}</div>
                    <div>
                      <h4>${s.label}</h4>
                      <div class="when">${s.t}</div>
                      <p>${s.msg}</p>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <div>
            <!-- Customer -->
            <div class="detail-panel" style="margin-bottom: 16px;">
              <h3>Customer</h3>
              <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 14px;">
                <div class="icon-sq accent" style="width: 44px; height: 44px;">${(order.name || "?").split(" ").map(p => p[0]).join("").slice(0,2)}</div>
                <div>
                  <div style="font-weight: 700;">${order.name || "—"}</div>
                  <div style="font-size: 12px; color: var(--ink-3);">+91 ${order.phone || "—"}</div>
                  ${order.email ? `<div style="font-size: 12px; color: var(--ink-3);">${order.email}</div>` : ''}
                </div>
              </div>
              <button class="btn btn-ghost btn-sm" style="width: 100%;" onclick="AdminPages.customers._open('+91 ${order.phone}'); closeModal();">View customer profile →</button>
            </div>

            <!-- Delivery -->
            <div class="detail-panel" style="margin-bottom: 16px;">
              <h3>${order.mode === 'pickup' ? 'Pickup' : 'Delivery'}</h3>
              <div style="padding: 12px; background: var(--bg-sub); border-radius: var(--radius); font-size: 13px; line-height: 1.55;">
                ${order.address || "—"}
                ${order.pin ? `<br/><strong>PIN ${order.pin}</strong>` : ''}
                ${order.landmark ? `<br/><span style="color: var(--ink-3);">Landmark: ${order.landmark}</span>` : ''}
              </div>
              <div style="margin-top: 10px; padding: 10px 12px; background: color-mix(in srgb, var(--ok) 12%, transparent); color: var(--ok); border-radius: var(--radius); font-size: 12px; font-weight: 600;">
                ✓ ETA · Today, 6 PM
              </div>
            </div>

            <!-- Payment -->
            <div class="detail-panel">
              <h3>Payment</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div style="padding: 10px; background: var(--bg-sub); border-radius: var(--radius);">
                  <div class="lbl" style="font-size: 10px; color: var(--ink-3); text-transform: uppercase; letter-spacing: .12em;">Method</div>
                  <div style="font-weight: 700; font-size: 14px; margin-top: 4px;">${order.payment === 'cod' ? 'Cash on Delivery' : (order.payment || 'UPI').toUpperCase()}</div>
                </div>
                <div style="padding: 10px; background: var(--bg-sub); border-radius: var(--radius);">
                  <div class="lbl" style="font-size: 10px; color: var(--ink-3); text-transform: uppercase; letter-spacing: .12em;">Status</div>
                  <div style="font-weight: 700; font-size: 14px; margin-top: 4px; color: ${order.payment === 'cod' ? 'var(--gold-ink)' : 'var(--ok)'}">${order.payment === 'cod' ? 'Pending COD' : 'Captured'}</div>
                </div>
              </div>
              <div style="margin-top: 10px; padding: 10px; background: var(--bg-sub); border-radius: var(--radius); font-size: 11px;">
                <div style="color: var(--ink-3); text-transform: uppercase; letter-spacing: .12em;">Razorpay transaction</div>
                <div style="font-family: ui-monospace, monospace; margin-top: 4px;">pay_${Math.random().toString(36).slice(2,15)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    openModal(html);
  };

  AdminPages.orders._setStatus = function(id, status) {
    const orders = BB_APP.orders.read();
    const o = orders.find(x => x.id === id);
    if (!o) return;
    o.status = status;
    localStorage.setItem("bb_orders_v1", JSON.stringify(orders));
    BB_APP.toast(`Order ${id} → ${status}`);
    AdminPages.orders._open(id);
    updateBadges();
  };

  AdminPages.orders._cancel = function(id) {
    if (!confirm("Cancel this order? Refund will be initiated if already paid.")) return;
    AdminPages.orders._setStatus(id, "Cancelled");
  };

  AdminPages.orders._refund = function(id) {
    const amt = prompt("Refund amount (₹). Leave empty for full refund:");
    if (amt === null) return;
    AdminPages.orders._setStatus(id, "Refunded");
    BB_APP.toast("Refund initiated · 5–7 business days");
  };

  AdminPages.orders._exportCSV = function() {
    const orders = BB_APP.orders.read();
    if (orders.length === 0) { alert("No orders to export."); return; }
    const head = "Order ID,Customer,Phone,Items,Total,Mode,Address,PIN,Status,Placed";
    const rows = orders.map(o => [
      o.id, o.name || "", o.phone || "", o.items.length, o.total,
      o.mode || "", `"${(o.address||"").replace(/"/g,'""')}"`, o.pin || "",
      statusOf(o), new Date(o.placedAt).toISOString()
    ].join(","));
    const blob = new Blob([head + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orders.csv"; a.click();
    URL.revokeObjectURL(url);
  };
})();
