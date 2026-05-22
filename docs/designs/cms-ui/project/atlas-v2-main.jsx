// Atlas v2 — main: stacks the 8 page mockups + wires the Tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#8b2c1f",
  "displayFont": "Spectral",
  "italicHeadlines": true,
  "showKbd": true
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = [
  '#8b2c1f', // oxblood (default)
  '#2a5a5a', // deep teal
  '#2a4a73', // ink-blue
  '#4f5e3a', // forest moss
];

const FONT_OPTIONS = ['Spectral', 'EB Garamond', 'Cormorant Garamond'];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Push tweaks to CSS variables + body classes
  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--display-font', `'${t.displayFont}'`);
    document.body.classList.toggle('no-italic-headlines', !t.italicHeadlines);
    document.body.classList.toggle('no-kbd', !t.showKbd);
  }, [t.accent, t.displayFont, t.italicHeadlines, t.showKbd]);

  const pages = [
    ['01', 'Dashboard', 'Today, at a glance — what needs your attention.',           window.Dashboard],
    ['02', 'Pages',     'Table or Map view — toggle in the page header.',             window.Pages],
    ['03', 'Orders',    'Board or Ledger view — toggle in the page header.',          window.Orders],
    ['04', 'Products',  'Catalog as a tabular registry. Swatch instead of photo.',    window.Products],
    ['05', 'Customers', 'The roster — sortable by lifetime value, segmentable.',      window.Customers],
    ['06', 'Journal',   'Editorial pipeline as a table with state and progress.',     window.Journal],
    ['07', 'Analytics', 'The almanac — KPI strip, story chart, the where-and-what.',  window.Analytics],
    ['08', 'Settings',  'Six groups, nineteen modules — status visible at a glance.', window.Settings],
  ];

  return (
    <>
      {pages.map(([n, title, desc, Page]) => (
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
          CMS · Atlas v2 · set in {t.displayFont} &amp; Geist · 8 surfaces, one direction
        </div>
      </footer>

      <TweaksPanel title="Atlas tweaks">
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
