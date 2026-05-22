// Atlas Customer — D6: Wishlist
// Saved items, organised by collection, with back-in-stock and sale tags.

function CustomerWishlist({ store }) {
  const { SfChrome, AcctSide } = window;

  const items = [
    { nm: 'Moss tote',           v: 'Canvas · large',   price: '$58', tag: 'BACK IN STOCK', tagCls: 'pill-solid-accent', added: '12 May' },
    { nm: 'Heritage hoodie',     v: 'Brick · M',        price: '$92', tag: '',              tagCls: '',                  added: '08 May' },
    { nm: 'Field journal',       v: 'A5 · linen',       price: '$22', tag: 'SALE −20%',     tagCls: 'pill-solid-gold',   added: '02 May',  sale: true },
    { nm: 'Wax candle, no. 4',   v: 'Cardamom',         price: '$28', tag: '',              tagCls: '',                  added: '28 Apr' },
    { nm: 'Linen apron',         v: 'Natural',          price: '$48', tag: 'OUT OF STOCK',  tagCls: 'pill-solid-ink',    added: '20 Apr',  oos: true },
    { nm: 'Patch set, dahlia',   v: '3 pieces',         price: '$14', tag: '',              tagCls: '',                  added: '14 Apr' },
    { nm: 'Heritage seed box',   v: 'Spring 2026',      price: '$28', tag: '6 LEFT',        tagCls: 'pill-out-accent',   added: '12 Apr' },
    { nm: 'Marigold cap',        v: 'Moss',             price: '$18', tag: 'PURCHASED',     tagCls: 'pill-out',          added: '08 Apr',  bought: true },
  ];

  return (
    <div className="page-frame">
      <SfChrome active="account" store={store} />

      <div className="acct-body">
        <AcctSide active="wishlist" />

        <div className="acct-main">
          {/* ── Head ─────────────────────────────────── */}
          <div className="acct-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="crumbs">
                <a href="#">Account</a><span className="sep">/</span>
                <span className="here">Wishlist</span>
              </div>
              <h1>Your <span className="i">wishlist</span></h1>
              <div className="sub">8 saved · 1 back in stock · 1 on sale</div>
            </div>
            <div className="right">
              <a href="#" className="btn btn-ghost btn-sm">Share list</a>
              <a href="#" className="btn btn-sm">Move all to bag</a>
            </div>
          </div>

          {/* ── Tabs / chip row ──────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 14 }}>
            <span className="chip on">All <span className="ct">8</span></span>
            <span className="chip">In stock <span className="ct">6</span></span>
            <span className="chip">Sale <span className="ct">1</span></span>
            <span className="chip">Back in stock <span className="ct">1</span></span>
            <span className="chip">Out of stock <span className="ct">1</span></span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="eyebrow">Sort</span>
              <span className="chip">Recently added ▾</span>
            </div>
          </div>

          {/* ── Grid ─────────────────────────────────── */}
          <div className="wish-grid" style={{ gap: 14 }}>
            {items.map((it) => (
              <div key={it.nm} className="wish-card" style={{ opacity: it.bought ? 0.65 : 1 }}>
                <div className="ph" style={{ height: 140, position: 'relative' }}>
                  {it.tag && <span className={'pill ' + it.tagCls} style={{ position: 'absolute', top: 8, left: 8 }}>{it.tag}</span>}
                  <span className="heart" title="Remove from wishlist">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-9-9c-1-2.5.5-6 4-6 2 0 3 1.5 5 4 2-2.5 3-4 5-4 3.5 0 5 3.5 4 6-2 4.5-9 9-9 9Z"/></svg>
                  </span>
                </div>
                <div className="meta">
                  <div className="nm">{it.nm}</div>
                  <div className="pr">{it.v}</div>
                  <div style={{
                    marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6,
                  }}>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: it.sale ? 'var(--wl-warning)' : 'var(--wl-text)' }}>{it.price}</span>
                    {it.oos
                      ? <a href="#" className="link-arrow" style={{ fontSize: 10 }}>Notify me →</a>
                      : it.bought
                        ? <a href="#" className="link-arrow" style={{ fontSize: 10 }}>Buy again →</a>
                        : <a href="#" className="btn btn-sm btn-accent" style={{ padding: '4px 8px', fontSize: 11 }}>Add to bag</a>
                    }
                  </div>
                  <div className="mono" style={{ fontSize: 9.5, color: 'var(--wl-text-faint)', marginTop: 8, letterSpacing: '.04em' }}>
                    SAVED {it.added.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CustomerWishlist });
