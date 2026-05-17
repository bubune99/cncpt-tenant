// Atlas Journal Editor — exploration
// F1 writing surface · F2 block editor · F3 structure · F4 distribute · F5 memo
// Plus the App that renders everything.

const { Chrome } = window;

// ─────────────────────────────────────────────
// Tweak defaults
// ─────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#8b2c1f",
  "displayFont": "Spectral",
  "italicHeadlines": true,
  "showKbd": true
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ['#8b2c1f', '#2a5a5a', '#2a4a73', '#4f5e3a'];
const FONT_OPTIONS = ['Spectral', 'EB Garamond', 'Cormorant Garamond'];

// ─────────────────────────────────────────────
// Shared inline helpers (declared local to this file)
// ─────────────────────────────────────────────
function Crumbs({ items }) {
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

function SaveBar({ savedAt, hints }) {
  return (
    <div className="action-bar">
      {hints && hints.map(([k, label], i) => (
        <span key={i}><span className="kbd">{k}</span>{label}</span>
      ))}
      <span className="right">
        <span className="savestate">{savedAt || '— autosaved 9:14 EST —'}</span>
      </span>
    </div>
  );
}

function CompactHead({ kicker, title, sku, pills, stats, actions }) {
  return (
    <div className="ed-head-compact">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow">{kicker}</div>
        <div className="title">{title}</div>
        <div className="meta-row">
          {sku && <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{sku}</span>}
          {pills}
          {stats && <span className="fig" style={{ fontSize: 12 }}>{stats}</span>}
        </div>
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}

function FrameLabel({ n, name, desc }) {
  return (
    <div className="page-label-row">
      <span className="num">{n}</span>
      <span className="name">{name}</span>
      <span className="desc">— {desc}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared masthead for the journal article in play
// ─────────────────────────────────────────────
function ArticleMasthead({ extra, actions }) {
  return (
    <CompactHead
      kicker="Journal · Feature · 12 min read · 2,840 words"
      title="A year of marigold"
      sku="/journal/a-year-of-marigold"
      pills={<>
        <span className="pill pill-solid-gold">DRAFT · v6</span>
        <span className="pill pill-out">SERIES · Year of the dye-pot</span>
        <span className="pill pill-out-accent">⚑ 2 reviewers</span>
      </>}
      stats={extra || 'last edit 14 May 09:11 · 4 unread comments'}
      actions={actions || <>
        <button className="btn"><span className="kbd">⌘P</span>Preview</button>
        <button className="btn"><span className="kbd">⌘S</span>Save draft</button>
        <button className="btn btn-accent"><span className="kbd">⌘⏎</span>Schedule publish</button>
      </>}
    />
  );
}

// ─────────────────────────────────────────────
// Shared tab strip — varies per frame
// ─────────────────────────────────────────────
const TABS_BASE = (active) => [
  ['Write',     null, active === 'write'],
  ['Blocks',    null, active === 'blocks'],
  ['Structure', null, active === 'struct'],
  ['Media',     6,    active === 'media'],
  ['Distribute',5,    active === 'dist'],
  ['SEO',       null, active === 'seo'],
  ['Versions',  6,    active === 'ver'],
  ['Activity',  null, active === 'act'],
];

// ─────────────────────────────────────────────
// 0. Design memo — editorial workflow
// ─────────────────────────────────────────────
function DesignMemo() {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--ink)',
      borderRadius: 'var(--r)', padding: '28px 32px', margin: '24px auto 0',
      maxWidth: 1200, boxShadow: '0 12px 40px rgba(0, 0, 0, .12)'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 32 }}>
        <div>
          <div className="eyebrow">Design memo</div>
          <div className="display" style={{ fontSize: 26, lineHeight: 1.05, marginTop: 6 }}>
            Writing <span className="display-i accent">vs.</span> structure.
          </div>
          <div className="fig" style={{ fontSize: 12, marginTop: 8 }}>Marisol → product, 16 May</div>
        </div>

        <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 24 }}>
          <div className="eyebrow-ink">Reading the problem</div>
          <p className="display-i" style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)', marginTop: 6 }}>
            The product editor treats variants as the work. For journal entries, the <i>writing</i> is
            the work — and yet the same editor surface needs to handle a published-and-syndicated piece
            with newsletter copy, social variants, taxonomy, and series metadata. One canvas can't
            serve both.
          </p>
          <p className="display-i" style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
            The trap: cramming everything into a sidebar next to the prose. The writer ends up
            scrolling past 14 form fields to find the body. The structure ends up half-filled because
            it lives in a panel nobody focuses on.
          </p>
        </div>

        <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 24 }}>
          <div className="eyebrow-ink">My take</div>
          <div style={{ fontSize: 14, lineHeight: 1.55, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>01</span>
              <span><b>Write owns the canvas.</b> A serif, single-column writing surface
              with magazine-style typography. The right rail holds only the things you reference
              while writing — frontmatter, outline, byline, series progress. Nothing else.</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>02</span>
              <span><b>Two writing modes.</b> Prose (single column, '/' for inserts) for features;
              Blocks (palette + properties) for mixed media — galleries, embeds, side-by-side. Same
              data; different chrome.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', minWidth: 22 }}>03</span>
              <span><b>Distribution is its own tab.</b> Web, newsletter, RSS, X, Mastodon,
              Instagram each get a panel where copy can diverge from the canonical article. The
              schedule is one timeline strip; everything else is per-channel.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// F1 — WRITING SURFACE (Write tab)
// ─────────────────────────────────────────────
function JournalWrite() {
  return (
    <Chrome section="journal">
      <Crumbs items={[['CMS'], ['Journal', '#'], ['Series · Year of the dye-pot', '#'], ['A year of marigold']]} />

      <ArticleMasthead />

      <EditorTabs
        items={TABS_BASE('write')}
        right={<>
          <span style={{ display: 'inline-flex', gap: 4, alignItems: 'baseline' }}>
            <span style={{
              background: 'var(--gold)', color: 'var(--paper)', padding: '1px 6px',
              fontSize: 9.5, letterSpacing: '.08em',
            }}>MR</span>
            <span style={{
              background: 'var(--moss)', color: 'var(--paper)', padding: '1px 6px',
              fontSize: 9.5, letterSpacing: '.08em',
            }}>LD</span>
            <span style={{ color: 'var(--ink-faint)' }}>· 2 viewing</span>
          </span>
        </>}
      />

      {/* Toolbar */}
      <div className="ed-toolbar" style={{ marginTop: 10 }}>
        <div className="group">
          <span className="lbl-mono">Style</span>
          <button className="tb mono">H1</button>
          <button className="tb mono on">H2</button>
          <button className="tb mono">H3</button>
          <button className="tb mono">¶</button>
        </div>
        <div className="group">
          <button className="tb b">B</button>
          <button className="tb i">I</button>
          <button className="tb u">U</button>
          <button className="tb s">S</button>
        </div>
        <div className="group">
          <button className="tb">"</button>
          <button className="tb">⊜</button>
          <button className="tb">⤴</button>
          <button className="tb">⚓</button>
        </div>
        <div className="group">
          <span className="lbl-mono">Insert</span>
          <button className="tb">▣</button>
          <button className="tb">▦</button>
          <button className="tb">⏵</button>
          <button className="tb">{ '<>' }</button>
          <button className="tb">¶¶</button>
        </div>
        <div className="meta-right">
          <span><b>2,840</b> words</span>
          <span><b>12</b> min read</span>
          <span><b>74</b>% to target</span>
          <span style={{ color: 'var(--moss)' }}>● autosaved 09:11</span>
        </div>
      </div>

      <div className="j-wrap">
        {/* LEFT — the writing canvas */}
        <div className="j-col">
          <div className="j-canvas">
            <article className="j-article">
              <div className="kicker"><span className="dash"></span>Field notes · No. 06</div>
              <h1 className="h1">
                A year of marigold<br/>
                <span className="i">— what one flower taught us about patience.</span>
              </h1>
              <p className="deck">
                A single plant carried us through every season. Here is what it asked
                of us, and what it gave back — the dye bath, the cut stems, the pale
                gold of October.
              </p>
              <div className="byline">
                <span><b>Marisol Cheng</b></span>
                <span>· 14 min</span>
                <span>· 16 May 2025</span>
                <span style={{ marginLeft: 'auto' }}>part 6 of 8</span>
              </div>

              <p className="lede">
                The first seeds went into the soil on a grey morning in April, a few weeks
                later than we'd planned. We had been told they were hardy — that they would
                forgive almost any mistake. We tested that promise generously over the
                <span className="comm">
                  weeks that followed
                  <span className="comm-pin">L · 3</span>
                </span>
                , and found it to be true.
              </p>

              <p>
                By June the plot was unrecognizable. The marigolds were waist-high,
                blooming in waves of orange and yellow so dense that we had to cut paths
                through them to reach the dye-pot. We harvested in batches — fifty stems
                at a time, weighed against the studio scales, the petals stripped while
                still warm from the sun.
              </p>

              <div className="pullquote">
                "What we wanted was a steady colour. What we got, instead, was a year of
                small surprises."
                <cite>— from the field log, 22 August</cite>
              </div>

              <h2 className="h2">The dye bath, every Sunday</h2>

              <p>
                Each Sunday we filled the copper pot with rainwater from the cistern and a
                pound of stems. By the time the kettle came to a boil, the studio smelled
                like a wet hayfield in late summer — sharp, slightly bitter, unmistakable.
                The fibres went in at a low simmer.{' '}
                <span className="selected">The first wool we ever dyed turned a colour we still chase</span> —
                a pale, almost-green gold that has yet to repeat itself, despite our
                most careful notes.<span className="caret"></span>
              </p>

              <div className="fig">
                <span className="num">FIG. 04</span>
                <span className="cap">Sunday batch · 22 August · marigold-flat-04.jpg — <i>caption · 28 chars</i></span>
              </div>

              <p>
                We kept the bath alive for a full year, refreshing it every Sunday with new
                stems. The colour shifted as the season went on — brighter in July, deeper
                by September, and by November almost amber. We never bleached, never
                stripped, never started over.
              </p>
            </article>

            {/* Floating selection bubble — appears over the underlined sentence */}
            <div className="sel-bubble" style={{ top: 626, left: 466 }}>
              <button className="b">B</button>
              <button className="i">I</button>
              <button className="u">U</button>
              <span className="sep"></span>
              <button title="link">⚓</button>
              <button title="pullquote">"</button>
              <button title="comment">¶</button>
              <span className="sep"></span>
              <button style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10 }}>H2 ▾</button>
            </div>
          </div>
        </div>

        {/* RIGHT — frontmatter rail */}
        <div className="j-rail">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="eyebrow">Frontmatter</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--ink-soft)', letterSpacing: '.1em' }}>v5 → v6 draft</span>
          </div>
          <p className="lede-text">
            Everything around the writing — for the writer to glance at, not to fill out
            during flow.
          </p>

          <Sec h="Outline" meta="6 headings · click to jump" />
          <div className="toc">
            <div className="h-row h1"><span className="n">H1</span>A year of marigold</div>
            <div className="h-row h2"><span className="n">H2</span>The first seeds</div>
            <div className="h-row h2 active"><span className="n">H2</span>The dye bath, every Sunday</div>
            <div className="h-row h3"><span className="n">H3</span>What the colour did</div>
            <div className="h-row h2"><span className="n">H2</span>What we made from it</div>
            <div className="h-row h2"><span className="n">H2</span>What we'd do differently</div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Sec h="Series" meta="6 of 8" />
            <div className="series-card">
              <div className="title">Year of the dye-pot</div>
              <div className="progress">
                <span className="dot done" title="01 · published"></span>
                <span className="dot done"></span>
                <span className="dot done"></span>
                <span className="dot done"></span>
                <span className="dot done"></span>
                <span className="dot this" title="06 · this draft"></span>
                <span className="dot draft" title="07 · outline"></span>
                <span className="dot"></span>
              </div>
              <div className="meta">5 published · 1 drafting · 1 outlined · 1 future</div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Sec h="Byline" meta="who wrote this" />
            <div className="stack">
              <div className="j-author-row">
                <span className="av">MC</span>
                <div style={{ flex: 1 }}>
                  <div className="name">Marisol Cheng</div>
                  <div className="role">primary · author</div>
                </div>
              </div>
              <div className="j-author-row">
                <span className="av gold">LR</span>
                <div style={{ flex: 1 }}>
                  <div className="name">Léa Romero</div>
                  <div className="role">editor</div>
                </div>
              </div>
              <div className="j-author-row">
                <span className="av moss">MK</span>
                <div style={{ flex: 1 }}>
                  <div className="name">Mira Kell</div>
                  <div className="role">photographer</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Sec h="Cover" />
            <div className="ph-box" style={{ height: 100, borderRadius: 2 }}>
              marigold-cover-03.jpg
            </div>
            <div className="fig" style={{ fontSize: 11, marginTop: 4 }}>1600×900 · alt set · 4 social variants</div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="autosaved · 2,840 words · 4 comments unread"
        hints={[['⌘S', 'save'], ['⌘P', 'preview'], ['⌘⇧K', 'comment'], ['/', 'insert'], ['⌘⏎', 'publish']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// F2 — BLOCK EDITOR (Blocks tab)
// ─────────────────────────────────────────────
const BLOCK_TYPES = [
  { kind: 'P',       icon: '¶', name: 'Para' },
  { kind: 'H2',      icon: 'H', name: 'Heading' },
  { kind: 'QUOTE',   icon: '"', name: 'Quote' },
  { kind: 'IMAGE',   icon: '▣', name: 'Image' },
  { kind: 'GALLERY', icon: '▦', name: 'Gallery' },
  { kind: 'EMBED',   icon: '⤴', name: 'Embed' },
  { kind: 'DIV',     icon: '⊜', name: 'Divider' },
  { kind: 'CODE',    icon: '<>', name: 'Code' },
  { kind: 'PROD',    icon: '$',  name: 'Product' },
  { kind: 'NL',      icon: '✉',  name: 'Subscribe' },
];

function JournalBlocks() {
  return (
    <Chrome section="journal">
      <Crumbs items={[['CMS'], ['Journal', '#'], ['Series · Year of the dye-pot', '#'], ['A year of marigold']]} />
      <ArticleMasthead />

      <EditorTabs items={TABS_BASE('blocks')} right={<><span>last edited 14 May · Marisol</span></>} />

      <div className="blk-wrap">
        {/* LEFT — block palette */}
        <div className="blk-col">
          <Sec h="Blocks" meta="drag onto canvas" />
          <div className="block-palette">
            {BLOCK_TYPES.map(bt => (
              <div key={bt.kind} className="block-tile">
                <div className={'icon' + (bt.kind === 'DIV' ? ' dim' : '')}>{bt.icon}</div>
                <div className="label">{bt.name}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <Sec h="Snippets" meta="reusable" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['Newsletter sign-up', '✉', 'used 14×'],
                ['Studio Marigold callout', '⌂', 'used 8×'],
                ['Shop CTA · seasonal', '★', 'used 22×'],
                ['Reading-list footer', '◫', 'used 6×'],
              ].map(([n, g, u]) => (
                <div key={n} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 6px', cursor: 'grab',
                  background: 'var(--paper)', border: '1px solid var(--rule-soft)',
                  borderRadius: 2, fontSize: 12,
                }}>
                  <span style={{
                    width: 22, height: 22, background: 'var(--paper-3)',
                    border: '1px solid var(--rule)', borderRadius: 2,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Spectral, serif', fontSize: 12,
                  }}>{g}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Spectral, serif', fontSize: 13, lineHeight: 1.1 }}>{n}</div>
                    <div className="fig" style={{ fontSize: 10 }}>{u}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}>+ new snippet</button>
          </div>
        </div>

        {/* CENTER — block canvas */}
        <div className="blk-col">
          <div className="blk-canvas">
            <div className="blk-list" style={{ position: 'relative' }}>
              <div className="blk h1-block">
                <span className="grip">⋮⋮</span>
                <span className="blk-type">H1</span>
                A year of marigold
              </div>
              <div className="blk deck-block">
                <span className="grip">⋮⋮</span>
                <span className="blk-type">DECK</span>
                A single plant carried us through every season — here is what it asked of us.
              </div>
              <div className="blk para-block">
                <span className="grip">⋮⋮</span>
                <span className="blk-type">PARA</span>
                The first seeds went into the soil on a grey morning in April, a few weeks later
                than we'd planned. They were hardy — they would forgive almost any mistake.
              </div>

              <div className="blk image-block sel">
                <span className="grip">⋮⋮</span>
                <span className="blk-type">IMAGE</span>
                <div className="img"></div>
                <div className="cap">Fig. 04 — Sunday batch, 22 August · marigold-flat-04.jpg</div>
              </div>

              <div className="blk-insert"></div>

              <div className="blk quote-block">
                <span className="grip">⋮⋮</span>
                <span className="blk-type">QUOTE</span>
                "What we wanted was a steady colour. What we got, instead, was a year of small surprises."
              </div>

              <div className="blk h2-block">
                <span className="grip">⋮⋮</span>
                <span className="blk-type">H2</span>
                The dye bath, every Sunday
              </div>

              <div className="blk para-block">
                <span className="grip">⋮⋮</span>
                <span className="blk-type">PARA</span>
                Each Sunday we filled the copper pot with rainwater and a pound of stems. The studio smelled like a wet hayfield, sharp and bitter…
              </div>

              <div className="blk gallery-block">
                <span className="grip">⋮⋮</span>
                <span className="blk-type">GALLERY · 6</span>
                <div className="gal">
                  <div className="tile"></div>
                  <div className="tile"></div>
                  <div className="tile"></div>
                  <div className="tile"></div>
                  <div className="tile"></div>
                  <div className="tile"></div>
                </div>
              </div>

              <div className="blk embed-block" style={{ position: 'relative' }}>
                <span className="grip">⋮⋮</span>
                <span className="blk-type">EMBED · YOUTUBE</span>
                ⏵ A walk through the dye-pot — May 2024
                <span className="url">youtube.com/watch?v=8x2Q…</span>
              </div>

              <div className="blk divider-block">
                <span className="grip">⋮⋮</span>
                <span className="blk-type">DIV</span>
                · · ·
              </div>

              <div className="blk para-block" style={{ position: 'relative' }}>
                <span className="grip">⋮⋮</span>
                <span className="blk-type">PARA</span>
                <span style={{ color: 'var(--ink-faint)', fontStyle: 'italic' }}>/</span>
                <span className="caret" style={{ verticalAlign: 'baseline' }}></span>

                {/* Slash menu */}
                <div className="slash-menu" style={{ top: 28, left: 14 }}>
                  <div className="head">Insert · "/" typed</div>
                  <div className="opt on">
                    <span className="gl">¶</span>
                    <span>Paragraph</span>
                    <span className="desc">just text</span>
                    <span className="kbd">↵</span>
                  </div>
                  <div className="opt">
                    <span className="gl">H</span>
                    <span>Heading</span>
                    <span className="desc">H2 by default</span>
                  </div>
                  <div className="opt">
                    <span className="gl">"</span>
                    <span>Quote</span>
                    <span className="desc">pull-quote</span>
                  </div>
                  <div className="opt">
                    <span className="gl">▣</span>
                    <span>Image</span>
                    <span className="desc">single image</span>
                  </div>
                  <div className="opt">
                    <span className="gl">▦</span>
                    <span>Gallery</span>
                    <span className="desc">2–12 images</span>
                  </div>
                  <div className="opt">
                    <span className="gl">$</span>
                    <span>Product</span>
                    <span className="desc">link to shop</span>
                  </div>
                  <div className="opt">
                    <span className="gl">✉</span>
                    <span>Subscribe</span>
                    <span className="desc">newsletter form</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — block properties for the selected block (Image) */}
        <div className="blk-prop">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="eyebrow">Block · IMAGE</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--ink-soft)', letterSpacing: '.1em' }}>#4 of 12</span>
          </div>
          <div className="display-i" style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12, lineHeight: 1.35 }}>
            Selected block · settings live here
          </div>

          <Sec h="Image" />
          <div className="ph-box" style={{ height: 80, borderRadius: 2 }}>
            marigold-flat-04.jpg
          </div>
          <div className="fig" style={{ fontSize: 11, marginTop: 4 }}>2400×1600 · 1.4 MB · uploaded 22 Aug</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            <button className="btn btn-sm btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Replace</button>
            <button className="btn btn-sm btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Crop</button>
            <button className="btn btn-sm btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Alt</button>
          </div>

          <div style={{ marginTop: 14 }}>
            <Sec h="Layout" />
            <div className="lbl-mono" style={{
              fontFamily: 'Geist Mono, monospace', fontSize: 10,
              color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase',
            }}>Width</div>
            <div className="opt-pair">
              <div className="opt">Column</div>
              <div className="opt on">Bleed</div>
              <div className="opt">Full</div>
              <div className="opt">Side</div>
            </div>

            <div className="lbl-mono" style={{
              fontFamily: 'Geist Mono, monospace', fontSize: 10,
              color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase',
              marginTop: 10,
            }}>Caption</div>
            <div className="input-row">
              <span className="val" style={{ fontSize: 12.5, fontStyle: 'italic', fontFamily: 'Spectral, serif' }}>
                Fig. 04 — Sunday batch, 22 August
              </span>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <Sec h="Behavior" />
            <div className="tg-switch on">
              <span>Open in lightbox</span>
              <span className="pip"></span>
            </div>
            <div className="tg-switch on">
              <span>Lazy load</span>
              <span className="pip"></span>
            </div>
            <div className="tg-switch">
              <span>Numbered figure</span>
              <span className="pip"></span>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <Sec h="Per channel" meta="overrides" />
            <div className="field" style={{ padding: '5px 0' }}>
              <span className="lbl">web</span>
              <span className="val" style={{ fontSize: 12.5 }}>Bleed · numbered</span>
            </div>
            <div className="field" style={{ padding: '5px 0' }}>
              <span className="lbl">newsletter</span>
              <span className="val" style={{ fontSize: 12.5 }}>Column · no caption</span>
            </div>
            <div className="field" style={{ padding: '5px 0' }}>
              <span className="lbl">rss</span>
              <span className="val" style={{ fontSize: 12.5 }}><span className="fig" style={{ fontSize: 11 }}>inherit</span></span>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 4 }}>
            <button className="btn btn-sm btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>↑ move up</button>
            <button className="btn btn-sm btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>↓ down</button>
            <button className="btn btn-sm" style={{ borderColor: 'var(--accent-2)', color: 'var(--accent-2)' }}>×</button>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="block #4 selected · IMAGE · bleed width"
        hints={[['⌘S', 'save'], ['/', 'insert'], ['↑↓', 'reorder'], ['⌘D', 'duplicate'], ['del', 'remove']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// F3 — STRUCTURE (Structure tab)
// ─────────────────────────────────────────────
function JournalStructure() {
  return (
    <Chrome section="journal">
      <Crumbs items={[['CMS'], ['Journal', '#'], ['Series · Year of the dye-pot', '#'], ['A year of marigold']]} />
      <ArticleMasthead />
      <EditorTabs items={TABS_BASE('struct')} right={<><span>everything except the writing itself</span></>} />

      <div className="struct-wrap">
        {/* LEFT column */}
        <div>
          <div className="struct-card">
            <Sec h="Series" meta="part of an ordered run" />
            <div className="field"><span className="lbl">series</span><span className="val">Year of the dye-pot <span className="fig" style={{ fontSize: 11 }}>· 8 planned · 5 live</span></span></div>
            <div className="field"><span className="lbl">position</span><span className="val">6 of 8</span></div>
            <div className="field"><span className="lbl">prev</span><span className="val">"The first plot" <span className="fig" style={{ fontSize: 11 }}>· 28 Apr</span></span></div>
            <div className="field"><span className="lbl">next</span><span className="val fig" style={{ fontStyle: 'italic' }}>"What we'd do differently" — outlined</span></div>
            <div style={{ marginTop: 6 }}>
              <div className="lbl-mono" style={{
                fontFamily: 'Geist Mono, monospace', fontSize: 10,
                color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>Progress</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['live','live','live','live','live','this','draft','plan'].map((s, i) => (
                  <div key={i} style={{
                    flex: 1, height: 28,
                    background: s === 'live' ? 'var(--accent)' : s === 'this' ? 'var(--ink)' : s === 'draft' ? 'var(--gold)' : 'var(--rule)',
                    border: '1px solid var(--ink)',
                    borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Geist Mono, monospace', fontSize: 9,
                    color: s === 'plan' ? 'var(--ink-faint)' : 'var(--paper)',
                  }}>{i + 1}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="struct-card">
            <Sec h="Taxonomy" meta="categories & tags · used in archives and feeds" />
            <div style={{ marginBottom: 8 }}>
              <div className="lbl-mono" style={{
                fontFamily: 'Geist Mono, monospace', fontSize: 10,
                color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>Category · pick one</div>
              <span className="tax-chip on">Field notes <span className="x">✓</span></span>
              <span className="tax-chip">Studio</span>
              <span className="tax-chip">Process</span>
              <span className="tax-chip">Shop</span>
              <span className="tax-chip">News</span>
            </div>
            <div>
              <div className="lbl-mono" style={{
                fontFamily: 'Geist Mono, monospace', fontSize: 10,
                color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>Tags · 5 of 12 max</div>
              <span className="tax-chip">marigold <span className="x">×</span></span>
              <span className="tax-chip">dyeing <span className="x">×</span></span>
              <span className="tax-chip">slow craft <span className="x">×</span></span>
              <span className="tax-chip">spring '25 <span className="x">×</span></span>
              <span className="tax-chip">long form <span className="x">×</span></span>
              <span className="tax-chip suggest">+ natural dye?</span>
              <span className="tax-chip suggest">+ field log?</span>
            </div>
          </div>

          <div className="struct-card">
            <Sec h="Contributors" meta="byline + credits" />
            <div className="j-author-row" style={{ borderBottom: '1px solid var(--rule-soft)' }}>
              <span className="av">MC</span>
              <div style={{ flex: 1 }}>
                <div className="name">Marisol Cheng</div>
                <div className="role">author · primary</div>
              </div>
              <span className="pill pill-out">100%</span>
            </div>
            <div className="j-author-row" style={{ borderBottom: '1px solid var(--rule-soft)' }}>
              <span className="av gold">LR</span>
              <div style={{ flex: 1 }}>
                <div className="name">Léa Romero</div>
                <div className="role">editor · structural</div>
              </div>
              <span className="pill pill-out-soft">no byline</span>
            </div>
            <div className="j-author-row" style={{ borderBottom: '1px solid var(--rule-soft)' }}>
              <span className="av moss">MK</span>
              <div style={{ flex: 1 }}>
                <div className="name">Mira Kell</div>
                <div className="role">photographer · 12 images</div>
              </div>
              <span className="pill pill-out">credit</span>
            </div>
            <div className="j-author-row">
              <span className="av ink">JR</span>
              <div style={{ flex: 1 }}>
                <div className="name">Jules Ratti</div>
                <div className="role">fact-check · ext.</div>
              </div>
              <span className="pill pill-out-soft">colophon</span>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>+ add contributor</button>
          </div>
        </div>

        {/* RIGHT column */}
        <div>
          <div className="struct-card">
            <Sec h="Related" meta="auto-linked at the bottom of the article" />
            <div className="lbl-mono" style={{
              fontFamily: 'Geist Mono, monospace', fontSize: 10,
              color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase',
              marginBottom: 4,
            }}>Other journal entries · 3 pinned</div>
            <div className="relrow">
              <div className="thumb" style={{ background: '#d4a01744 repeating-linear-gradient(45deg, rgba(26,20,16,.04) 0 6px, transparent 6px 12px)' }}></div>
              <div>
                <div className="title">The first plot</div>
                <div className="sub">Field notes · 28 Apr · 8 min</div>
              </div>
              <div className="price"><span className="pill pill-out-soft">prev</span></div>
              <div className="x">⋮</div>
            </div>
            <div className="relrow">
              <div className="thumb" style={{ background: '#4f5e3a44 repeating-linear-gradient(45deg, rgba(26,20,16,.04) 0 6px, transparent 6px 12px)' }}></div>
              <div>
                <div className="title">A summer of indigo</div>
                <div className="sub">Field notes · 18 Aug 2024 · 11 min</div>
              </div>
              <div className="price"><span className="fig">auto</span></div>
              <div className="x">⋮</div>
            </div>
            <div className="relrow">
              <div className="thumb" style={{ background: '#8b2c1f44 repeating-linear-gradient(45deg, rgba(26,20,16,.04) 0 6px, transparent 6px 12px)' }}></div>
              <div>
                <div className="title">On patience, and what it costs</div>
                <div className="sub">Studio · 04 Mar · 6 min</div>
              </div>
              <div className="price"><span className="fig">auto</span></div>
              <div className="x">⋮</div>
            </div>
          </div>

          <div className="struct-card">
            <Sec h="Shop the story" meta="products linked from the post"
              right={<span><span className="mono" style={{ fontSize: 10 }}>+ link · ⌘K</span></span>} />
            <div className="relrow">
              <div className="thumb" style={{ background: '#d4a01755 repeating-linear-gradient(45deg, rgba(26,20,16,.04) 0 6px, transparent 6px 12px)' }}></div>
              <div>
                <div className="title">Marigold dye kit</div>
                <div className="sub">SIMPLE · 24 on hand · published</div>
              </div>
              <div className="price">$48</div>
              <div className="x">×</div>
            </div>
            <div className="relrow">
              <div className="thumb" style={{ background: '#d4a01755 repeating-linear-gradient(45deg, rgba(26,20,16,.04) 0 6px, transparent 6px 12px)' }}></div>
              <div>
                <div className="title">Marigold quilted jacket</div>
                <div className="sub">VARIABLE · 20 variants · M-MAR sold out</div>
              </div>
              <div className="price">$148+</div>
              <div className="x">×</div>
            </div>
            <div className="relrow">
              <div className="thumb" style={{ background: '#4f5e3a55 repeating-linear-gradient(45deg, rgba(26,20,16,.04) 0 6px, transparent 6px 12px)' }}></div>
              <div>
                <div className="title">Marigold dye field guide</div>
                <div className="sub">DIGITAL · PDF v2.1.4</div>
              </div>
              <div className="price">$24</div>
              <div className="x">×</div>
            </div>
          </div>

          <div className="struct-card">
            <Sec h="SEO summary" meta="full editor in SEO tab"
              right={<span className="accent" style={{ fontFamily: 'Geist, sans-serif', fontSize: 11, fontWeight: 500 }}>good · 9 / 10</span>} />
            <div className="field"><span className="lbl">slug</span><span className="val mono">/journal/a-year-of-marigold</span></div>
            <div className="field"><span className="lbl">meta title</span><span className="val">A year of marigold — Studio Marigold</span></div>
            <div className="field"><span className="lbl">meta desc</span>
              <span className="val" style={{ fontSize: 12.5 }}>
                A single plant carried us through every season. What the dye-pot taught us about patience, and the colour of October.
              </span>
            </div>
            <div className="field"><span className="lbl">og image</span><span className="val mono">marigold-cover-03.jpg · 1600×900</span></div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="structure complete · ready for distribution"
        hints={[['⌘S', 'save'], ['T', 'add tag'], ['⌘K', 'link'], ['esc', 'close']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// F4 — DISTRIBUTE (multi-channel publishing)
// ─────────────────────────────────────────────
function JournalDistribute() {
  // Schedule strip: 6 days × 6 channels
  const days = ['Fri 16', 'Sat 17', 'Sun 18', 'Mon 19', 'Tue 20', 'Wed 21'];
  return (
    <Chrome section="journal">
      <Crumbs items={[['CMS'], ['Journal', '#'], ['Series · Year of the dye-pot', '#'], ['A year of marigold']]} />
      <ArticleMasthead
        extra="article ready · 5 channels enabled · 1 needs review"
        actions={<>
          <button className="btn"><span className="kbd">⌘P</span>Preview all</button>
          <button className="btn btn-accent"><span className="kbd">⌘⏎</span>Publish to 5 channels</button>
        </>}
      />
      <EditorTabs items={TABS_BASE('dist')} right={<><span>web · newsletter · rss · 2 social</span></>} />

      <div className="dist-wrap">
        {/* Channel switcher — pick which channel's copy to view */}
        <div className="dist-strip">
          <div className="dist-tile on web">
            <div className="status-dot-mini"></div>
            <div className="glyph">⌂</div>
            <div className="name">Web</div>
            <div className="when live">live in 1h · auto</div>
          </div>
          <div className="dist-tile news">
            <div className="status-dot-mini" style={{ background: 'var(--gold)' }}></div>
            <div className="glyph">✉</div>
            <div className="name">Newsletter</div>
            <div className="when queued">Sat 09:00 · queued</div>
          </div>
          <div className="dist-tile rss">
            <div className="status-dot-mini"></div>
            <div className="glyph">⊿</div>
            <div className="name">RSS</div>
            <div className="when">on publish · auto</div>
          </div>
          <div className="dist-tile x">
            <div className="status-dot-mini" style={{ background: 'var(--gold)' }}></div>
            <div className="glyph">x</div>
            <div className="name">X / Twitter</div>
            <div className="when queued">Sat 11:00 · queued</div>
          </div>
          <div className="dist-tile mast">
            <div className="status-dot-mini" style={{ background: 'var(--gold)' }}></div>
            <div className="glyph">M</div>
            <div className="name">Mastodon</div>
            <div className="when queued">Sat 11:00 · queued</div>
          </div>
          <div className="dist-tile draft-state ig">
            <div className="status-dot-mini"></div>
            <div className="glyph">◯</div>
            <div className="name">Instagram</div>
            <div className="when draft">draft · needs caption</div>
          </div>
        </div>

        {/* Two channels surfaced side-by-side for editing */}
        <div className="channel-panel">
          {/* Left — Newsletter */}
          <div className="channel-card">
            <Sec h="Newsletter · Studio Marigold Weekly"
              meta="4,820 subscribers · open rate 38%"
              right={<>
                <span className="pill pill-solid-gold">QUEUED</span>
                <span style={{ marginLeft: 6, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'var(--ink-soft)' }}>Sat 09:00 EST</span>
              </>} />
            <div className="field" style={{ padding: '4px 0' }}>
              <span className="lbl">from</span>
              <span className="val">Marisol &lt;notes@marigold.shop&gt;</span>
            </div>
            <div className="field" style={{ padding: '4px 0' }}>
              <span className="lbl">audience</span>
              <span className="val">All subscribers <span className="fig" style={{ fontSize: 11 }}>· minus unsubscribed 30d (412)</span></span>
            </div>
            <div className="field" style={{ padding: '4px 0' }}>
              <span className="lbl">subject</span>
              <span className="val mono" style={{ fontSize: 12 }}>A year of marigold — and what it taught us</span>
            </div>
            <div className="field" style={{ padding: '4px 0' }}>
              <span className="lbl">preheader</span>
              <span className="val" style={{ fontStyle: 'italic', fontFamily: 'Spectral, serif' }}>The dye-pot, the cut stems, the pale gold of October.</span>
            </div>

            <div className="nl-preview">
              <div className="from">From <b>Studio Marigold</b> · Saturday 17 May 09:00</div>
              <div className="nl-subject">A year of marigold — and what it taught us</div>
              <div className="nl-preheader">The dye-pot, the cut stems, the pale gold of October.</div>

              <div style={{ borderBottom: '1px solid var(--rule-soft)', paddingBottom: 12, marginBottom: 12 }}>
                <div className="kicker" style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>FIELD NOTES · NO. 06</div>
                <div className="display" style={{ fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.015em' }}>A year of marigold —</div>
                <div className="display-i" style={{ fontSize: 18, color: 'var(--ink-soft)', lineHeight: 1.2 }}>what one flower taught us about patience.</div>
              </div>

              <p style={{ fontSize: 14, lineHeight: 1.55, margin: '0 0 10px' }}>
                A single plant carried us through every season. Here is what it asked of us,
                and what it gave back…
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>
                <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)' }}>Read the full piece →</a>
              </p>
            </div>

            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <span className="fig">Last test send to marisol@ · 09:08 EST</span>
              <span style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm">Test send</button>
                <button className="btn btn-sm btn-ghost">Reschedule</button>
              </span>
            </div>
          </div>

          {/* Right — Social variants */}
          <div className="channel-card">
            <Sec h="Social · X & Mastodon"
              meta="2 platforms · same copy by default · override per platform"
              right={<>
                <span className="pill pill-solid-gold">QUEUED</span>
                <span style={{ marginLeft: 6, fontFamily: 'Geist Mono, monospace', fontSize: 10, color: 'var(--ink-soft)' }}>Sat 11:00 EST</span>
              </>} />

            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <span className="pill pill-solid-ink">X · 218 chars</span>
              <span className="pill pill-out">Mastodon · same</span>
              <span className="pill pill-out-soft">Instagram · drafting</span>
            </div>

            <div className="social-card">
              <div className="ava">
                <span className="av">SM</span>
                <div>
                  <div className="name">Studio Marigold</div>
                  <div className="handle">@studiomarigold · 14.2k</div>
                </div>
                <span style={{ marginLeft: 'auto', fontFamily: 'Geist Mono, monospace', fontSize: 9.5, color: 'var(--ink-soft)' }}>218 / 280</span>
              </div>
              <div className="body">
                A year of marigold — what a single flower taught us about patience,
                the dye-pot every Sunday, and the pale gold of October.{' '}
                <br/><br/>
                The sixth field note in our <span className="link">year of the dye-pot</span> series is up.{' '}
                <br/><br/>
                <span className="link">marigold.shop/journal/a-year-of-marigold</span>
              </div>
              <div className="img"></div>
            </div>

            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div className="lbl-mono" style={{
                  fontFamily: 'Geist Mono, monospace', fontSize: 10,
                  color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase',
                  marginBottom: 4,
                }}>Hashtags</div>
                <span className="tax-chip on">#fieldnotes</span>
                <span className="tax-chip on">#naturalDye</span>
                <span className="tax-chip on">#marigold</span>
                <span className="tax-chip suggest">+ #slowCraft?</span>
              </div>
              <div>
                <div className="lbl-mono" style={{
                  fontFamily: 'Geist Mono, monospace', fontSize: 10,
                  color: 'var(--ink-soft)', letterSpacing: '.1em', textTransform: 'uppercase',
                  marginBottom: 4,
                }}>Card</div>
                <div className="ph-box" style={{ height: 60, borderRadius: 2, fontSize: 9 }}>
                  og · marigold-cover-03
                </div>
                <div className="fig" style={{ fontSize: 11, marginTop: 4 }}>auto-pulled from web og · override available</div>
              </div>
            </div>

            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <span className="fig">Both posts queued · X first, Mastodon +30s</span>
              <span style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm">Preview</button>
                <button className="btn btn-sm btn-ghost">Edit per-platform</button>
              </span>
            </div>
          </div>
        </div>

        {/* Schedule strip across the bottom */}
        <div style={{
          background: 'var(--paper-2)', border: '1px solid var(--rule)',
          borderRadius: 'var(--r-sm)', padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <span className="eyebrow-ink" style={{ color: 'var(--ink)' }}>Schedule · all channels · 16–21 May</span>
              <div className="fig" style={{ fontSize: 12, marginTop: 2 }}>web first, then newsletter the next morning, social same day</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, fontFamily: 'Geist Mono, monospace', color: 'var(--ink-soft)' }}>
              <span className="pill pill-solid-ink">5 SCHEDULED</span>
              <span className="pill pill-out-soft">1 DRAFT</span>
            </div>
          </div>

          <div className="sched-grid">
            <div></div>
            {days.map(d => <div key={d} className="sched-cell day-h">{d}</div>)}

            <div className="sched-row">
              <div className="row-lbl">Web</div>
              <div className="sched-cell today"><div className="pin web">10:00 →LIVE</div></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
            </div>
            <div className="sched-row">
              <div className="row-lbl">RSS</div>
              <div className="sched-cell today"><div className="pin rss">auto</div></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
            </div>
            <div className="sched-row">
              <div className="row-lbl">Newsletter</div>
              <div className="sched-cell today"></div>
              <div className="sched-cell"><div className="pin news">09:00</div></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
            </div>
            <div className="sched-row">
              <div className="row-lbl">X</div>
              <div className="sched-cell today"></div>
              <div className="sched-cell"><div className="pin x">11:00</div></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"><div className="pin x">10:00</div></div>
              <div className="sched-cell"></div>
            </div>
            <div className="sched-row">
              <div className="row-lbl">Mastodon</div>
              <div className="sched-cell today"></div>
              <div className="sched-cell"><div className="pin mast">11:01</div></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
            </div>
            <div className="sched-row">
              <div className="row-lbl">Instagram</div>
              <div className="sched-cell today"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"><div className="pin draft">draft</div></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
              <div className="sched-cell"></div>
            </div>
          </div>
        </div>
      </div>

      <SaveBar
        savedAt="5 channels ready · 1 draft pending · drag pins to reschedule"
        hints={[['⌘S', 'save'], ['⌘⏎', 'publish web'], ['T', 'test send'], ['R', 'reschedule']]}
      />
    </Chrome>
  );
}

// ─────────────────────────────────────────────
// Register everything
// ─────────────────────────────────────────────
Object.assign(window, {
  Crumbs, EditorTabs, Sec, SaveBar, CompactHead, FrameLabel,
  ArticleMasthead,
  DesignMemo, JournalWrite, JournalBlocks, JournalStructure, JournalDistribute,
  TWEAK_DEFAULTS, ACCENT_OPTIONS, FONT_OPTIONS,
});

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

  return (
    <>
      <DesignMemo />

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F1" name="Write · the canvas"
          desc="A magazine-typography writing surface with rich text, drop-cap leads, pull-quotes and figure captions. Right rail holds outline, series progress, byline & cover — frontmatter the writer references mid-flow." />
        <JournalWrite />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F2" name="Write · blocks"
          desc="Same article, block-based composition for pieces that mix prose with galleries, embeds, product cards. Block library on the left, properties on the right; slash menu inline. Per-channel layout overrides per block." />
        <JournalBlocks />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F3" name="Structure · everything else"
          desc="Series, taxonomy, contributors, related entries, shop links and SEO summary — the connective tissue that lives outside the prose. Two-column dense surface; nothing here interrupts writing." />
        <JournalStructure />
      </section>

      <section style={{ marginTop: 14 }}>
        <FrameLabel n="F4" name="Distribute · one piece, many channels"
          desc="Web, newsletter, RSS, X, Mastodon and Instagram as parallel artifacts. Channel-specific copy lives here — newsletter has subject + preheader, social has its own truncated copy + hashtags. Schedule strip ties them together." />
        <JournalDistribute />
      </section>

      <footer style={{ paddingTop: 50, marginTop: 30, borderTop: '1px solid var(--ink)', textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Colophon</div>
        <div className="display-i" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
          CMS · Atlas v2 · Journal editor explorations · 4 frames + 1 memo · set in {t.displayFont} &amp; Geist
        </div>
      </footer>

      <TweaksPanel title="Journal editor">
        <TweakSection label="Color" />
        <TweakColor label="Accent" value={t.accent} options={ACCENT_OPTIONS}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Type" />
        <TweakRadio label="Display font" value={t.displayFont} options={FONT_OPTIONS}
          onChange={(v) => setTweak('displayFont', v)} />
        <TweakToggle label="Italic accent on headlines" value={t.italicHeadlines}
          onChange={(v) => setTweak('italicHeadlines', v)} />
        <TweakSection label="Chrome" />
        <TweakToggle label="Keyboard hints visible" value={t.showKbd}
          onChange={(v) => setTweak('showKbd', v)} />
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
