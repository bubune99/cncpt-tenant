// Atlas Editors — main: stacks the 4 editor mockups + wires the Tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#8b2c1f",
  "displayFont": "Spectral",
  "italicHeadlines": true,
  "showKbd": true
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ['#8b2c1f', '#2a5a5a', '#2a4a73', '#4f5e3a'];
const FONT_OPTIONS = ['Spectral', 'EB Garamond', 'Cormorant Garamond'];

// ─────────────────────────────────────────────
// Shared editor helpers
// ─────────────────────────────────────────────
function Crumbs({ items }) {
  // items: [['label', href?], ...] last is current
  return (
    <div className="crumbs">
      {items.map(([label, href], i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            {isLast
              ? <span className="here">{label}</span>
              : <a href={href || '#'}>{label}</a>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function EditorTabs({ items, right }) {
  return (
    <div className="e-tabs">
      {items.map(([label, count, on]) => (
        <span key={label} className={'tab' + (on ? ' on' : '')}>
          {label}{count !== null && count !== undefined && <span className="ct">{count}</span>}
        </span>
      ))}
      {right && <span className="right">{right}</span>}
    </div>
  );
}

function Sec({ n, h, meta, right }) {
  return (
    <div className="sec">
      {n && <span className="n">{n}</span>}
      <span className="h">{h}</span>
      {meta && <span className="meta">· {meta}</span>}
      {right && <span className="right">{right}</span>}
    </div>
  );
}

function SaveBar({ savedAt, hints, actions }) {
  return (
    <div className="action-bar">
      {hints && hints.map(([k, label], i) => (
        <span key={i}><span className="kbd">{k}</span>{label}</span>
      ))}
      <span className="right">
        <span className="savestate">{savedAt || '— autosaved 9:14 EST —'}</span>
        {actions}
      </span>
    </div>
  );
}

Object.assign(window, { Crumbs, EditorTabs, Sec, SaveBar });

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--display-font', `'${t.displayFont}'`);
    document.body.classList.toggle('no-italic-headlines', !t.italicHeadlines);
    document.body.classList.toggle('no-kbd', !t.showKbd);
  }, [t.accent, t.displayFont, t.italicHeadlines, t.showKbd]);

  const editors = [
    ['E1', 'Page editor',     'Settings & preview for /  · content is built in the page builder.', window.PageEditor],
    ['E2', 'Order editor',    'Order #4821 · custom embroidery + sub-fulfillment checkoffs.',       window.OrderEditor],
    ['E3', 'Product editor',  'Dahlia tee · variants, inventory, pricing, channels.',      window.ProductEditor],
    ['E4', 'Customer editor', 'Maya Rodriguez · the dossier — orders, notes, lifecycle.',  window.CustomerEditor],
  ];

  return (
    <>
      {editors.map(([n, title, desc, Page]) => (
        <section key={n} style={{ marginTop: 14 }}>
          <div className="page-label-row">
            <span className="num">{n}</span>
            <span className="name">{title}</span>
            <span className="desc">— {desc}</span>
          </div>
          <Page />
        </section>
      ))}

      <footer style={{ paddingTop: 50, marginTop: 30, borderTop: '1px solid var(--ink)', textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Colophon</div>
        <div className="display-i" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
          CMS · Atlas v2 · four editor surfaces · set in {t.displayFont} &amp; Geist
        </div>
      </footer>

      <TweaksPanel title="Editor tweaks">
        <TweakSection label="Color" />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={ACCENT_OPTIONS}
          onChange={(v) => setTweak('accent', v)}
        />

        <TweakSection label="Type" />
        <TweakRadio
          label="Display font"
          value={t.displayFont}
          options={FONT_OPTIONS}
          onChange={(v) => setTweak('displayFont', v)}
        />
        <TweakToggle
          label="Italic accent on headlines"
          value={t.italicHeadlines}
          onChange={(v) => setTweak('italicHeadlines', v)}
        />

        <TweakSection label="Chrome" />
        <TweakToggle
          label="Keyboard hints visible"
          value={t.showKbd}
          onChange={(v) => setTweak('showKbd', v)}
        />
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
