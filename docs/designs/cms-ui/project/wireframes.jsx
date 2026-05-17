// Main canvas assembly — 8 page sections, each with 3 direction variants.
// Components are loaded onto window by the three direction files.

const { DesignCanvas, DCSection, DCArtboard, DCPostIt } = window;

const W = 1240;
const H = 820;

function PageSection({ id, title, subtitle, AEl, BEl, CEl }) {
  return (
    <DCSection id={id} title={title} subtitle={subtitle}>
      <DCArtboard id={`${id}-atlas`} label="A · Atlas" width={W} height={H}>
        <div className="frame" style={{ width: W, height: H }}>{AEl}</div>
      </DCArtboard>
      <DCArtboard id={`${id}-stage`} label="B · Stage" width={W} height={H}>
        <div className="frame" style={{ width: W, height: H }}>{BEl}</div>
      </DCArtboard>
      <DCArtboard id={`${id}-console`} label="C · Console" width={W} height={H}>
        <div className="frame" style={{ width: W, height: H }}>{CEl}</div>
      </DCArtboard>
    </DCSection>
  );
}

function App() {
  const A = window.AtlasPages;
  const S = window.StagePages;
  const C = window.ConsolePages;
  return (
    <DesignCanvas
      title="CMS · Re-envisioning"
      subtitle="Three personalities (Atlas / Stage / Console) across 8 surfaces — mid-fi wireframes."
    >
      <DCSection id="intro" title="The three directions" subtitle="Each is a complete personality — type, color, layout, metaphor. Pages below show how each scales across the CMS.">
        <DCArtboard id="intro-atlas" label="A · Atlas" width={520} height={420}>
          <div className="atlas frame" style={{ width: 520, height: 420, padding: 32 }}>
            <div className="atlas-eyebrow">Direction A</div>
            <div className="display" style={{ fontSize: 54, lineHeight: 1, marginTop: 12, letterSpacing: '-0.03em' }}>
              Atlas<span className="display-i atlas-accent">.</span>
            </div>
            <div className="display-i" style={{ fontSize: 22, marginTop: 6, color: 'rgba(26,20,16,.7)' }}>An editorial map of your content.</div>
            <div className="atlas-rule" style={{ marginTop: 18 }}></div>
            <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.55, columnCount: 2, columnGap: 18 }}>
              Type-forward. Warm paper. Generous margins. Every page is a spread with marginalia, foliotypes, and a contents index. Content first; chrome whispers.
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="atlas-eyebrow" style={{ border: '1px solid rgba(26,20,16,.3)', padding: '3px 8px' }}>Spectral</span>
              <span className="atlas-eyebrow" style={{ border: '1px solid rgba(26,20,16,.3)', padding: '3px 8px' }}>Geist</span>
              <span className="atlas-eyebrow" style={{ background: '#8b2c1f', color: '#f5efe2', padding: '3px 8px' }}>#8B2C1F</span>
              <span className="atlas-eyebrow" style={{ background: '#1a1410', color: '#efe7d8', padding: '3px 8px' }}>#1A1410</span>
              <span className="atlas-eyebrow" style={{ background: '#efe7d8', color: '#1a1410', border: '1px solid rgba(26,20,16,.4)', padding: '3px 8px' }}>#EFE7D8</span>
            </div>
          </div>
        </DCArtboard>

        <DCArtboard id="intro-stage" label="B · Stage" width={520} height={420}>
          <div className="stage frame" style={{ width: 520, height: 420, padding: 32 }}>
            <div className="mono stage-cyan" style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase' }}>Direction B</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 58, lineHeight: 1, marginTop: 10, letterSpacing: '-0.03em', fontWeight: 600 }}>
              Stage<span className="stage-amber">.</span>
            </div>
            <div style={{ fontSize: 20, marginTop: 8, color: 'rgba(232,226,210,.75)', fontStyle: 'italic' }}>A live control room. Content floats in 2D.</div>
            <div style={{ height: 1, background: 'rgba(232,226,210,.2)', marginTop: 18 }}></div>
            <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.55 }}>
              Pan-and-zoom workspace. Cards, clusters, minimap. Everything you publish is visible right now — orders pulse, drafts breathe, the storefront is in the room.
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="stage-pill">Space Grotesk</span>
              <span className="stage-pill">Geist Mono</span>
              <span className="mono" style={{ background: '#4dd8ff', color: '#0d1622', padding: '3px 8px', fontSize: 11 }}>#4DD8FF</span>
              <span className="mono" style={{ background: '#ffc54a', color: '#0d1622', padding: '3px 8px', fontSize: 11 }}>#FFC54A</span>
              <span className="mono" style={{ background: '#0d1622', color: '#e8e2d2', padding: '3px 8px', fontSize: 11, border: '1px solid rgba(232,226,210,.3)' }}>#0D1622</span>
            </div>
          </div>
        </DCArtboard>

        <DCArtboard id="intro-console" label="C · Console" width={520} height={420}>
          <div className="console frame" style={{ width: 520, height: 420, padding: 32 }}>
            <div style={{ fontSize: 11, letterSpacing: '.15em' }}>DIRECTION_C // OPERATOR</div>
            <div className="display" style={{ fontSize: 64, lineHeight: 1, marginTop: 10 }}>
              CONSOLE<span style={{ background: '#ff5b22', color: '#fafaf7', padding: '0 6px' }}>.</span>
            </div>
            <div style={{ fontSize: 13, marginTop: 8, color: 'rgba(10,10,10,.6)' }}>A brutalist operator deck. Inbox-first. Dense. Loud.</div>
            <div style={{ height: 2, background: '#0a0a0a', marginTop: 16 }}></div>
            <div style={{ marginTop: 12, fontSize: 12, lineHeight: 1.6 }}>
              Mono everywhere. Hard 1px lines, no rounding. Pages are queues of items with status stripes and stamped priorities. Keyboard-shortcut hints visible at all times.
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <span className="console-tag">JETBRAINS_MONO</span>
              <span className="console-tag">SPACE_GROTESK</span>
              <span className="console-tag-yel">#F4ED37</span>
              <span className="console-tag-hot">#FF5B22</span>
              <span className="console-tag">#0A0A0A</span>
            </div>
          </div>
        </DCArtboard>

        <DCPostIt width={260} height={140}>
          Each direction is opinionated — type, color, layout, metaphor all change together. Pages below scale these across the CMS.
        </DCPostIt>
      </DCSection>

      <PageSection id="dashboard" title="01 · Admin dashboard" subtitle="The home you land on every morning."
        AEl={<A.Dashboard />} BEl={<S.Dashboard />} CEl={<C.Dashboard />} />

      <PageSection id="pages" title="02 · Pages (CMS index)" subtitle="The list of every published page on the site."
        AEl={<A.Pages />} BEl={<S.Pages />} CEl={<C.Pages />} />

      <PageSection id="orders" title="03 · Orders (list + detail)" subtitle="Work-through the order queue with an inline detail peek."
        AEl={<A.Orders />} BEl={<S.Orders />} CEl={<C.Orders />} />

      <PageSection id="products" title="04 · Products (list + detail)" subtitle="Catalog grid plus the editor for a single SKU."
        AEl={<A.Products />} BEl={<S.Products />} CEl={<C.Products />} />

      <PageSection id="customers" title="05 · Customers" subtitle="Browse, segment, and dive into a single customer."
        AEl={<A.Customers />} BEl={<S.Customers />} CEl={<C.Customers />} />

      <PageSection id="blog" title="06 · Blog / posts" subtitle="Editorial pipeline from draft to published."
        AEl={<A.Blog />} BEl={<S.Blog />} CEl={<C.Blog />} />

      <PageSection id="analytics" title="07 · Analytics" subtitle="What's happening on the storefront right now and over time."
        AEl={<A.Analytics />} BEl={<S.Analytics />} CEl={<C.Analytics />} />

      <PageSection id="settings" title="08 · Site settings" subtitle="The configuration surface. Usually the dullest page in the CMS — let's not."
        AEl={<A.Settings />} BEl={<S.Settings />} CEl={<C.Settings />} />
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
