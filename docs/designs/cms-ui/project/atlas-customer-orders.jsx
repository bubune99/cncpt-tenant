// Atlas Customer — D4: Orders list
// Filterable history of every order, with status/total/items.

function CustomerOrders({ store }) {
  const { SfChrome, AcctSide } = window;

  const orders = [
    { id: '#4821', when: 'Tue 16 May',  whenY: '2026', items: ['Dahlia tee', 'Marigold cap'],          n: 2, total: '$53.66',  status: 'In transit',   cls: 'pill-solid-accent', isNew: true },
    { id: '#4702', when: 'Mon 28 Apr',  whenY: '2026', items: ['Marigold cap'],                         n: 1, total: '$32.00',  status: 'Delivered',    cls: 'pill-solid-moss' },
    { id: '#4621', when: 'Sun 14 Apr',  whenY: '2026', items: ['Moss tote', 'Studio letter', 'Tea'],    n: 3, total: '$92.20',  status: 'Delivered',    cls: 'pill-solid-moss' },
    { id: '#4488', when: 'Fri 22 Mar',  whenY: '2026', items: ['Heritage hoodie', 'Patch set'],         n: 2, total: '$118.40', status: 'Returned',     cls: 'pill-out', notes: '$24.50 store credit issued' },
    { id: '#4391', when: 'Wed 06 Mar',  whenY: '2026', items: ['Marigold tea'],                         n: 1, total: '$18.00',  status: 'Delivered',    cls: 'pill-solid-moss', notes: 'subscription · auto-renewal' },
    { id: '#4225', when: 'Tue 13 Feb',  whenY: '2026', items: ['Linen apron', 'Field journal'],         n: 2, total: '$72.50',  status: 'Delivered',    cls: 'pill-solid-moss' },
    { id: '#4108', when: 'Mon 22 Jan',  whenY: '2026', items: ['Marigold tea'],                         n: 1, total: '$18.00',  status: 'Delivered',    cls: 'pill-solid-moss', notes: 'subscription · auto-renewal' },
    { id: '#3984', when: 'Sat 14 Dec',  whenY: '2025', items: ['Holiday set', 'Wrapping paper'],        n: 2, total: '$64.00',  status: 'Delivered',    cls: 'pill-solid-moss' },
    { id: '#3812', when: 'Fri 29 Nov',  whenY: '2025', items: ['Dahlia tee'],                           n: 1, total: '$32.00',  status: 'Delivered',    cls: 'pill-solid-moss' },
  ];

  return (
    <div className="page-frame">
      <SfChrome active="account" store={store} />

      <div className="acct-body">
        <AcctSide active="orders" />

        <div className="acct-main">
          {/* ── Head ─────────────────────────────────── */}
          <div className="acct-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="crumbs">
                <a href="#">Account</a><span className="sep">/</span>
                <span className="here">Orders</span>
              </div>
              <h1>Your <span className="i">orders</span></h1>
              <div className="sub">14 orders · $987.46 spent with {store.name} since March 2024.</div>
            </div>
            <div className="right">
              <a href="#" className="btn btn-ghost btn-sm">Export CSV</a>
              <a href="#" className="btn btn-sm">Filter</a>
            </div>
          </div>

          {/* ── Filter chip row ──────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 14 }}>
            <span className="chip on">All <span className="ct">14</span></span>
            <span className="chip">In transit <span className="ct">1</span></span>
            <span className="chip">Delivered <span className="ct">11</span></span>
            <span className="chip">Returned <span className="ct">1</span></span>
            <span className="chip">Refunded <span className="ct">1</span></span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="eyebrow">Year</span>
              <span className="chip">2026 <span className="ct">7</span></span>
              <span className="chip">2025 <span className="ct">5</span></span>
              <span className="chip">2024 <span className="ct">2</span></span>
            </div>
          </div>

          {/* ── Table ────────────────────────────────── */}
          <div className="card bare" style={{ background: 'var(--wl-surface)', border: '1px solid var(--wl-rule)', borderRadius: 'var(--wl-radius)', padding: '4px 16px' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Order</th>
                  <th style={{ width: 130 }}>Placed</th>
                  <th>Items</th>
                  <th style={{ width: 150 }}>Status</th>
                  <th className="num" style={{ width: 100 }}>Total</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <span className="mono" style={{ fontWeight: 600 }}>{o.id}</span>
                      {o.isNew && <span className="pill pill-out-accent" style={{ marginLeft: 6 }}>NEW</span>}
                    </td>
                    <td>
                      <div className="fig" style={{ fontSize: 13 }}>{o.when}</div>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--wl-text-faint)', letterSpacing: '.04em' }}>{o.whenY}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="order-row-items">
                          {Array.from({ length: Math.min(o.n, 2) }).map((_, i) => (
                            <div key={i} className="thumb"></div>
                          ))}
                          {o.n > 2 && <div className="thumb more">+{o.n - 2}</div>}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="display" style={{ fontSize: 14, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>
                            {o.items.join(' · ')}
                          </div>
                          {o.notes && <div className="fig" style={{ fontSize: 11, marginTop: 2 }}>{o.notes}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={'pill ' + o.cls}>
                        <span className="dot"></span>{o.status}
                      </span>
                    </td>
                    <td className="num">{o.total}</td>
                    <td><a href="#" className="link-arrow">View →</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Footer pagination + summary ─────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 14, paddingTop: 12,
          }}>
            <div className="fig" style={{ fontSize: 12 }}>Showing 9 of 14 orders</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <a href="#" className="btn btn-sm btn-ghost">← Older</a>
              <a href="#" className="btn btn-sm">Load more</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CustomerOrders });
