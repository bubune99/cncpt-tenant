// Atlas Customer — main: stacks the 3 frames + wires Tweaks (white-label theming)

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "brand": "marigold",
  "accent": "#8b2c1f",
  "displayFont": "Spectral",
  "italicHeadlines": true,
  "density": "comfortable",
  "showImpersonate": true,
  "showGreeting": true
}/*EDITMODE-END*/;

// ──────────────────────────────────────────────
// Brand presets — demonstrate white-label theming
// Each preset rewrites a bundle of --wl-* CSS variables on :root
// ──────────────────────────────────────────────
const BRAND_PRESETS = {
  marigold: {
    label: 'Marigold',
    name:  'Studio Marigold',
    glyph: 'M',
    url:   'marigold.shop',
    vars: {
      '--wl-canvas':    '#d9d3c2',
      '--wl-bg':        '#faf7ef',
      '--wl-surface':   '#ffffff',
      '--wl-surface-2': '#f5f1e6',
      '--wl-surface-3': '#ebe5d4',
      '--wl-text':      '#1a1410',
      '--wl-text-soft': 'rgba(26,20,16,.62)',
      '--wl-text-faint':'rgba(26,20,16,.40)',
      '--wl-rule':      'rgba(26,20,16,.18)',
      '--wl-rule-soft': 'rgba(26,20,16,.10)',
      '--wl-accent':    '#8b2c1f',
      '--wl-accent-fg': '#ffffff',
      '--wl-accent-soft':'rgba(139,44,31,.10)',
      '--wl-success':   '#4f5e3a',
      '--wl-warning':   '#b58730',
    },
    fonts: { display: 'Spectral', body: 'Geist', mono: 'Geist Mono' },
  },
  boreal: {
    label: 'Boreal',
    name:  'Boreal Goods',
    glyph: 'B',
    url:   'borealgoods.com',
    vars: {
      '--wl-canvas':    '#e8e8e6',
      '--wl-bg':        '#ffffff',
      '--wl-surface':   '#ffffff',
      '--wl-surface-2': '#f6f6f4',
      '--wl-surface-3': '#eceae6',
      '--wl-text':      '#0d1f1c',
      '--wl-text-soft': 'rgba(13,31,28,.62)',
      '--wl-text-faint':'rgba(13,31,28,.40)',
      '--wl-rule':      'rgba(13,31,28,.14)',
      '--wl-rule-soft': 'rgba(13,31,28,.08)',
      '--wl-accent':    '#1a4d3a',
      '--wl-accent-fg': '#ffffff',
      '--wl-accent-soft':'rgba(26,77,58,.10)',
      '--wl-success':   '#1a4d3a',
      '--wl-warning':   '#b89031',
    },
    fonts: { display: 'Fraunces', body: 'Inter', mono: 'Geist Mono' },
  },
  obsidian: {
    label: 'Obsidian',
    name:  'Obsidian & Co',
    glyph: 'O',
    url:   'obsidian.co',
    vars: {
      '--wl-canvas':    '#1a1a1d',
      '--wl-bg':        '#0f0f12',
      '--wl-surface':   '#16161a',
      '--wl-surface-2': '#1c1c20',
      '--wl-surface-3': '#22222a',
      '--wl-text':      '#f0ede5',
      '--wl-text-soft': 'rgba(240,237,229,.68)',
      '--wl-text-faint':'rgba(240,237,229,.42)',
      '--wl-rule':      'rgba(240,237,229,.16)',
      '--wl-rule-soft': 'rgba(240,237,229,.08)',
      '--wl-accent':    '#d4a84b',
      '--wl-accent-fg': '#0f0f12',
      '--wl-accent-soft':'rgba(212,168,75,.14)',
      '--wl-success':   '#7faa55',
      '--wl-warning':   '#d4a84b',
    },
    fonts: { display: 'DM Serif Display', body: 'Inter', mono: 'Geist Mono' },
  },
  meadow: {
    label: 'Meadow',
    name:  'Meadow Market',
    glyph: '✿',
    url:   'meadowmarket.shop',
    vars: {
      '--wl-canvas':    '#e6dfd1',
      '--wl-bg':        '#f7f3e9',
      '--wl-surface':   '#fffdf6',
      '--wl-surface-2': '#f0ead7',
      '--wl-surface-3': '#e2dabd',
      '--wl-text':      '#2d2918',
      '--wl-text-soft': 'rgba(45,41,24,.66)',
      '--wl-text-faint':'rgba(45,41,24,.42)',
      '--wl-rule':      'rgba(45,41,24,.18)',
      '--wl-rule-soft': 'rgba(45,41,24,.10)',
      '--wl-accent':    '#5c7548',
      '--wl-accent-fg': '#fffdf6',
      '--wl-accent-soft':'rgba(92,117,72,.12)',
      '--wl-success':   '#5c7548',
      '--wl-warning':   '#c08a2e',
    },
    fonts: { display: 'Cormorant Garamond', body: 'Inter', mono: 'Geist Mono' },
  },
};

const DISPLAY_FONTS = ['Spectral', 'Fraunces', 'Cormorant Garamond', 'DM Serif Display'];

// ──────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply brand preset whenever brand changes
  React.useEffect(() => {
    const preset = BRAND_PRESETS[t.brand] || BRAND_PRESETS.marigold;
    Object.entries(preset.vars).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
    document.documentElement.style.setProperty('--wl-font-display', `'${preset.fonts.display}', Georgia, serif`);
    document.documentElement.style.setProperty('--wl-font-body',    `'${preset.fonts.body}', -apple-system, sans-serif`);
    document.documentElement.style.setProperty('--wl-font-mono',    `'${preset.fonts.mono}', monospace`);
  }, [t.brand]);

  // Override display font if user picks one
  React.useEffect(() => {
    if (t.displayFont) {
      document.documentElement.style.setProperty('--wl-font-display', `'${t.displayFont}', Georgia, serif`);
    }
  }, [t.displayFont]);

  // Density
  React.useEffect(() => {
    document.body.setAttribute('data-density', t.density);
  }, [t.density]);

  const store = BRAND_PRESETS[t.brand] || BRAND_PRESETS.marigold;

  const frames = [
    ['D1', 'Dashboard home',
      'The customer\'s landing — lifecycle ribbon, store credit, recent orders, a hand-set greeting from the shop owner.',
      <CustomerHome key="d1" store={store} />],
    ['D2', 'Order detail · tracking',
      'Full timeline from placed → delivered, the items, addresses, summary. Surfaced from "Orders" or from the new-order toast on the home.',
      <CustomerOrder key="d2" store={store} />],
    ['D3', 'Orders · all',
      'Full history with filter chips by status and by year. Subscription auto-renewals are flagged inline; returned orders show their store-credit outcome.',
      <CustomerOrders key="d3" store={store} />],
    ['D4', 'Subscriptions',
      'Active recurring shipments — next charge, schedule strip, controls to skip / swap / pause. Marisol\'s picks at the bottom plant the seed for a third sub.',
      <CustomerSubs key="d4" store={store} />],
    ['D5', 'Wishlist',
      'Saved items with stock tags (back in stock, on sale, OOS, already purchased). The grid favours quick triage over browsing.',
      <CustomerWishlist key="d5" store={store} />],
    ['D6', 'Returns & exchanges',
      'Items still inside the 30-day window get one-click return / exchange. Past returns sit in a small ledger; store credit floats top-right.',
      <CustomerReturns key="d6" store={store} />],
    ['D7', 'Loyalty & store credit',
      'Tier badge, progress to next tier, points balance and the rewards you can redeem now or later. Activity log tells the customer where every point came from.',
      <CustomerLoyalty key="d7" store={store} />],
    ['D8', 'Settings · addresses & payment',
      'Saved shipping and billing addresses, cards, PayPal and wallets — all with default flags so the bag remembers them on checkout.',
      <CustomerAddrPay key="d8" store={store} />],
    ['D9', 'Settings · profile & notifications',
      'Identity (name, email, password, birthday) and a three-channel matrix for what we send by email, SMS, and in-app. Connected accounts and a quiet danger zone live on the right.',
      <CustomerProfile key="d9" store={store} />],
    ['M1', 'Mobile · home & order',
      'Same shape, narrower canvas. Lifecycle becomes a progress bar; the order timeline goes vertical; the greeting tightens to fit a phone.',
      <CustomerMobile key="m1" store={store} />],
    ['M2', 'Mobile · orders, subs, wishlist',
      'Three of the busiest tabs. Status pills + progress bars do the work of the desktop table; the subscription manage screen turns every action into a row.',
      <CustomerMobile2 key="m2" store={store} />],
    ['M3', 'Mobile · loyalty & settings',
      'Tier as a bold accent-coloured hero card, rewards as a list, settings as compact rows of toggles. Two-column settings collapse to single column with the same hierarchy.',
      <CustomerMobile3 key="m3" store={store} />],
  ];

  return (
    <>
      {frames.map(([n, title, desc, frame]) => (
        <section key={n} style={{ marginTop: 14 }}>
          <div className="page-label-row">
            <span className="num">{n}</span>
            <span className="name">{title}</span>
            <span className="desc">— {desc}</span>
          </div>
          {frame}
        </section>
      ))}

      <TweaksPanel title="Storefront tweaks">
        <TweakSection label="Brand preset" />
        <TweakRadio
          label="Theme"
          value={t.brand}
          options={Object.keys(BRAND_PRESETS)}
          onChange={(v) => {
            setTweak({
              brand: v,
              displayFont: BRAND_PRESETS[v].fonts.display,
              accent: BRAND_PRESETS[v].vars['--wl-accent'],
            });
          }}
        />
        <div style={{
          marginTop: 4, padding: '8px 10px',
          background: 'rgba(0,0,0,.04)', borderRadius: 6,
          fontSize: 11, lineHeight: 1.4, color: 'rgba(41,38,27,.7)',
        }}>
          <b>{store.label}</b> · {store.name} · {store.url}<br/>
          <span style={{ color: 'rgba(41,38,27,.5)' }}>
            Display: {store.fonts.display} · Body: {store.fonts.body}
          </span>
        </div>

        <TweakSection label="Type" />
        <TweakSelect
          label="Display font"
          value={t.displayFont}
          options={DISPLAY_FONTS}
          onChange={(v) => setTweak('displayFont', v)}
        />

        <TweakSection label="Layout" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={['compact', 'comfortable', 'spacious']}
          onChange={(v) => setTweak('density', v)}
        />

        <TweakSection label="Chrome" />
        <TweakToggle
          label="Admin impersonation bar"
          value={t.showImpersonate}
          onChange={(v) => {
            setTweak('showImpersonate', v);
            document.querySelectorAll('.impersonate-bar').forEach((el) => {
              el.style.display = v ? '' : 'none';
            });
            // Account body height needs to adjust
            document.querySelectorAll('.acct-body').forEach((el) => {
              el.style.height = v ? 'calc(100% - 64px - 26px)' : 'calc(100% - 64px)';
            });
          }}
        />
        <TweakToggle
          label="Owner's note on home"
          value={t.showGreeting}
          onChange={(v) => {
            setTweak('showGreeting', v);
            document.querySelectorAll('.greeting').forEach((el) => {
              el.style.display = v ? '' : 'none';
            });
          }}
        />
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
