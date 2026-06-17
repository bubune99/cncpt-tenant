"use client";

/**
 * ProductCatalog — Atlas Grainy type-split catalog.
 *
 * Products no longer cram physical stock, digital files, and service cadences
 * into one table. Instead the surface opens into a family picker (Physical /
 * Digital / Services), each leading to a focused table whose columns + filters
 * match that kind of product. Families derive from the Prisma `ProductType`
 * enum (SIMPLE/VARIABLE/BUNDLE → physical, DIGITAL → digital,
 * SERVICE/SUBSCRIPTION → service). Design handoff: cms-ui "Atlas Grainy.html".
 */

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Package, Download, Sparkles, Plus, Search, X, Filter, ArrowRight,
  ChevronLeft, ChevronDown, MoreHorizontal, RefreshCw, Check,
  Settings as SettingsIcon, ExternalLink, type LucideProps,
} from "lucide-react";
import { useCMSConfig } from "@/contexts/CMSConfigContext";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import "./catalog.css";

type Family = "physical" | "digital" | "service";
type IconCmp = React.ComponentType<LucideProps>;

const TYPE_FAMILY: Readonly<Record<string, Family>> = {
  SIMPLE: "physical", VARIABLE: "physical", BUNDLE: "physical",
  DIGITAL: "digital",
  SERVICE: "service", SUBSCRIPTION: "service",
};

interface FamilyMeta {
  key: Family;
  label: string;
  icon: IconCmp;
  hex: string;       // grainy ramp var
  blurb: string;
  facets: string;
}

const FAMILIES: readonly FamilyMeta[] = [
  { key: "physical", label: "Physical goods", icon: Package, hex: "var(--clay-500)",
    blurb: "Tangible items you stock, pick, and ship.", facets: "Variants · inventory · weight" },
  { key: "digital", label: "Digital products", icon: Download, hex: "var(--blue-500)",
    blurb: "Files customers download — delivered instantly, no stock held.", facets: "Format · license · downloads" },
  { key: "service", label: "Services & plans", icon: Sparkles, hex: "var(--sage-500)",
    blurb: "Time-based work and recurring plans.", facets: "Billing cadence · term · capacity" },
];

const familyMeta = (k: Family): FamilyMeta => FAMILIES.find((f) => f.key === k) ?? FAMILIES[0];
const familyOf = (type: string): Family => TYPE_FAMILY[(type || "SIMPLE").toUpperCase()] ?? "physical";

interface Prod {
  id: string;
  name: string;
  slug: string;
  sku: string;
  type: string;          // UPPERCASE enum
  family: Family;
  price: number;         // dollars
  compareAt: number | null;
  status: string;        // lowercase: active | draft | archived
  stock: number;
  trackInventory: boolean;
  category: string;
  thumbnail: string | null;
  variants: number;
  interval: string | null;     // subscription
  duration: number | null;     // service minutes
  capacity: number | null;     // service slots
  createdAt: string;
}

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const titleCase = (s: string) =>
  (s || "").split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const statusTone = (s: string) => (s === "active" ? "pill-solid-moss" : s === "archived" ? "pill-soft" : "pill-solid-gold");
const stockLevel = (p: Prod): "In stock" | "Low" | "Out of stock" =>
  p.stock === 0 ? "Out of stock" : p.stock < 10 ? "Low" : "In stock";

// ── Filter chip with dropdown ────────────────────────────────────────────────
function FilterChip({
  label, value, options, onChange,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value !== "Any";
  return (
    <div style={{ position: "relative" }}>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 25 }} />}
      <button className={"cat-chip" + (active ? " active" : "")} onClick={() => setOpen((o) => !o)}>
        <span className="k">{label}</span>
        <span className="v">{value}</span>
        {active ? (
          <span className="fc-x" onClick={(e) => { e.stopPropagation(); onChange("Any"); setOpen(false); }} style={{ display: "inline-flex" }}>
            <X size={12} />
          </span>
        ) : (
          <ChevronDown size={12} />
        )}
      </button>
      {open && (
        <div className="cat-chip-menu">
          {["Any", ...options].map((o) => (
            <div key={o} className="it" onClick={() => { onChange(o); setOpen(false); }}>
              <span>{o}</span>
              {value === o && <Check size={14} style={{ marginLeft: "auto", color: "var(--accent)" }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Landing — choose a family ────────────────────────────────────────────────
function Landing({
  products, onPick, onNew, onRefresh, loading,
}: {
  products: Prod[]; onPick: (f: Family) => void; onNew: () => void; onRefresh: () => void; loading: boolean;
}) {
  const drafts = products.filter((p) => p.status === "draft").length;
  const low = products.filter((p) => p.family === "physical" && p.stock > 0 && p.stock < 10).length;
  const out = products.filter((p) => p.family === "physical" && p.trackInventory && p.stock === 0).length;
  return (
    <>
      <div className="cat-head">
        <div>
          <div className="eyebrow">Catalog</div>
          <div className="cat-title">
            <h1>Products</h1>
            <span className="cat-count">{products.length} items · 3 catalogs</span>
          </div>
        </div>
        <div className="cat-actions">
          <button className="btn" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button className="btn btn-accent" onClick={onNew}><Plus size={15} /> New product</button>
        </div>
      </div>
      <p className="cat-lead">
        Pick a catalog to work in. Each one keeps the columns and filters that matter for that kind of
        product — no more squeezing physical stock, file formats, and billing cycles into one table.
      </p>

      <div className="cat-landing">
        {FAMILIES.map((f) => {
          const items = products.filter((p) => p.family === f.key);
          const swatches = items.slice(0, 5);
          const Icon = f.icon;
          return (
            <button key={f.key} className="cat-fam" onClick={() => onPick(f.key)}>
              <div className="cat-fam-bar" style={{ background: f.hex }} />
              <div className="cat-fam-body">
                <div className="cat-fam-top">
                  <span className="cat-fam-ico" style={{ background: `color-mix(in srgb, ${f.hex} 16%, var(--paper-2))`, color: f.hex }}>
                    <Icon size={22} />
                  </span>
                  <div>
                    <div className="cat-fam-name">{f.label}</div>
                    <div className="cat-fam-n">{items.length} products</div>
                  </div>
                  <ArrowRight className="cat-fam-arrow" size={18} />
                </div>
                <p className="cat-fam-blurb">{f.blurb}</p>
                <div className="cat-fam-foot">
                  <div className="cat-fam-swatches">
                    {swatches.length > 0 ? swatches.map((p) => (
                      <span key={p.id} style={p.thumbnail ? { backgroundImage: `url(${p.thumbnail})` } : { background: `color-mix(in srgb, ${f.hex} 40%, var(--paper-2))` }} />
                    )) : <span style={{ background: "var(--paper-3)" }} />}
                  </div>
                  <span className="cat-fam-facets">{f.facets}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="cat-stats">
        {([
          ["v", products.length, "total products", "var(--ink)"],
          ["v", drafts, "in draft", "var(--gold)"],
          ["v", low, "low stock", "var(--gold)"],
          ["v", out, "sold out", "var(--hot)"],
        ] as const).map(([, n, label, col], i) => (
          <span key={i} className="cat-stat">
            <span className="v" style={{ color: col }}>{n}</span>
            <span className="l">{label}</span>
          </span>
        ))}
      </div>
    </>
  );
}

// ── Focused per-family table ─────────────────────────────────────────────────
function FamilyTable({
  family, products, onBack, onNew, buildPath,
}: {
  family: Family; products: Prod[]; onBack: () => void; onNew: (f: Family) => void; buildPath: (p: string) => string;
}) {
  const meta = familyMeta(family);
  const base = useMemo(() => products.filter((p) => p.family === family), [products, family]);

  const [view, setView] = useState<"all" | "active" | "draft" | "archived">("all");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Any");
  const [stock, setStock] = useState("Any");
  const [sort, setSort] = useState("Newest");
  const [sel, setSel] = useState<Set<string>>(new Set());

  useEffect(() => { setSel(new Set()); }, [view, cat, stock, q]);

  const categories = useMemo(() => {
    const s: string[] = [];
    base.forEach((p) => { const c = titleCase(p.category); if (c && !s.includes(c)) s.push(c); });
    return s.sort();
  }, [base]);

  const viewRows = base.filter((p) => view === "all" || p.status === view);
  let rows = viewRows.filter((p) => {
    if (q && !(p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))) return false;
    if (cat !== "Any" && titleCase(p.category) !== cat) return false;
    if (family === "physical" && stock !== "Any" && stockLevel(p) !== stock) return false;
    return true;
  });
  rows = [...rows].sort((a, b) => {
    if (sort === "Name A–Z") return a.name.localeCompare(b.name);
    if (sort === "Price") return b.price - a.price;
    if (sort === "Stock") return b.stock - a.stock;
    return +new Date(b.createdAt) - +new Date(a.createdAt); // Newest
  });

  const sortOpts = ["Newest", "Name A–Z", "Price", ...(family === "physical" ? ["Stock"] : [])];
  const counts = {
    all: base.length,
    active: base.filter((p) => p.status === "active").length,
    draft: base.filter((p) => p.status === "draft").length,
    archived: base.filter((p) => p.status === "archived").length,
  };

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = rows.length > 0 && rows.every((p) => sel.has(p.id));
  const toggleAll = () => setSel((s) => { const n = new Set(s); allOn ? rows.forEach((p) => n.delete(p.id)) : rows.forEach((p) => n.add(p.id)); return n; });

  const activeCount = (cat !== "Any" ? 1 : 0) + (stock !== "Any" ? 1 : 0) + (q ? 1 : 0);
  const resetAll = () => { setCat("Any"); setStock("Any"); setQ(""); };

  const Icon = meta.icon;
  const newLabel = family === "service" ? "service" : family === "digital" ? "digital product" : "product";

  // family-specific extra columns
  const extraHead =
    family === "physical" ? ["Type", "Stock", "Variants"]
    : family === "digital" ? ["Type", "Format"]
    : ["Type", "Cadence", "Capacity"];

  return (
    <>
      <button className="cat-back" onClick={onBack}><ChevronLeft size={13} /> Products</button>
      <div className="cat-head">
        <div className="cat-fam-title">
          <span className="cat-fam-title-ico" style={{ background: `color-mix(in srgb, ${meta.hex} 16%, var(--paper-2))`, color: meta.hex }}>
            <Icon size={17} />
          </span>
          <h1 style={{ fontSize: 24, margin: 0, fontWeight: 600, letterSpacing: "-0.015em" }}>{meta.label}</h1>
          <span className="cat-count">{base.length} items</span>
        </div>
        <div className="cat-actions">
          <button className="btn btn-accent" onClick={() => onNew(family)}><Plus size={15} /> New {newLabel}</button>
        </div>
      </div>

      {/* status view tabs */}
      <div className="cat-views">
        {(["all", "active", "draft", "archived"] as const).map((v) => (
          <button key={v} className={"cat-view" + (view === v ? " on" : "")} onClick={() => setView(v)}>
            {v === "all" ? "All" : titleCase(v)}
            <span className="ct">{counts[v]}</span>
          </button>
        ))}
      </div>

      {/* filter bar */}
      <div className="cat-filters">
        <span className="lbl"><Filter size={14} /> Filter</span>
        <FilterChip label="category" value={cat} options={categories} onChange={setCat} />
        {family === "physical" && (
          <FilterChip label="stock" value={stock} options={["In stock", "Low", "Out of stock"]} onChange={setStock} />
        )}
        <FilterChip label="sort" value={sort} options={sortOpts.filter((x) => x !== sort)} onChange={setSort} />
        {activeCount > 0 && <button className="cat-clear" onClick={resetAll}>Clear all</button>}
        <div className="cat-search">
          <Search size={15} />
          <input value={q} placeholder={`Search ${meta.label.toLowerCase()}…`} onChange={(e) => setQ(e.target.value)} />
          {q && <X size={14} style={{ cursor: "pointer", color: "var(--ink-faint)" }} onClick={() => setQ("")} />}
        </div>
      </div>

      {sel.size > 0 && (
        <div className="cat-bulk">
          <span className="ct"><b>{sel.size}</b> selected</span>
          <button onClick={() => setSel(new Set())}><X size={15} /> Clear</button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="cat-empty">
          <div>
            <div className="cat-empty-ico"><Search size={22} /></div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No products match these filters</div>
            <p style={{ margin: "5px 0 12px", color: "var(--ink-faint)", fontSize: 13 }}>Try widening the filter, or clear them all.</p>
            <button className="btn" onClick={resetAll}>Clear filters</button>
          </div>
        </div>
      ) : (
        <div className="panel" style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th className="check"><input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all" /></th>
                <th>{family === "service" ? "Service" : "Product"}</th>
                {extraHead.map((h) => <th key={h} className={h === "Stock" || h === "Variants" || h === "Capacity" ? "num" : ""}>{h}</th>)}
                <th className="num">Price</th>
                <th>Status</th>
                <th className="text-right" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const on = sel.has(p.id);
                return (
                  <tr key={p.id} className={on ? "sel" : ""}>
                    <td className="check" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={on} onChange={() => toggle(p.id)} aria-label={`Select ${p.name}`} />
                    </td>
                    <td>
                      <Link href={buildPath(`/admin/products/${p.id}`)} style={{ textDecoration: "none", color: "inherit" }}>
                        <div className="cat-prod">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.thumbnail
                            ? <img className="cat-prod-thumb" src={p.thumbnail} alt="" />
                            : <span className="cat-prod-thumb" />}
                          <div style={{ minWidth: 0 }}>
                            <div className="cat-prod-name">{p.name}</div>
                            <div className="cat-prod-sku">{p.sku || p.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </Link>
                    </td>

                    {/* family-specific cells */}
                    {family === "physical" && <>
                      <td><span className="pill pill-out">{titleCase(p.type.toLowerCase())}</span></td>
                      <td className="num">
                        {p.trackInventory
                          ? <span style={{ color: p.stock === 0 ? "var(--hot)" : p.stock < 10 ? "var(--gold)" : "var(--ink)", fontWeight: p.stock === 0 ? 700 : 400 }}>{p.stock}</span>
                          : <span style={{ color: "var(--ink-faint)" }}>—</span>}
                      </td>
                      <td className="num">{p.variants > 0 ? p.variants : "—"}</td>
                    </>}
                    {family === "digital" && <>
                      <td><span className="pill pill-out">{titleCase(p.type.toLowerCase())}</span></td>
                      <td><span style={{ color: "var(--ink-soft)" }}>Download</span></td>
                    </>}
                    {family === "service" && <>
                      <td><span className="pill pill-out">{titleCase(p.type.toLowerCase())}</span></td>
                      <td>{p.interval ? <span className="pill pill-soft">{titleCase(p.interval)}</span> : <span style={{ color: "var(--ink-faint)" }}>One-time</span>}</td>
                      <td className="num">{p.capacity ?? (p.duration ? `${p.duration}m` : "—")}</td>
                    </>}

                    <td className="num" style={{ fontWeight: 600 }}>
                      {p.price === 0 ? "Free" : money(p.price)}
                      {p.compareAt != null && p.compareAt > p.price && (
                        <span style={{ marginLeft: 6, color: "var(--ink-faint)", textDecoration: "line-through", fontWeight: 400 }}>{money(p.compareAt)}</span>
                      )}
                    </td>
                    <td><span className={"pill " + statusTone(p.status)}>{titleCase(p.status)}</span></td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <RowMenu product={p} buildPath={buildPath} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function RowMenu({ product, buildPath }: { product: Prod; buildPath: (p: string) => string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 25 }} />}
      <button className="btn" style={{ padding: "5px 7px" }} onClick={() => setOpen((o) => !o)} aria-label="Row actions">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="cat-chip-menu" style={{ right: 0, left: "auto" }}>
          <Link className="it" href={buildPath(`/admin/products/${product.id}`)}><SettingsIcon size={14} /> Configure</Link>
          <Link className="it" href={`/products/${product.slug || product.id}`} target="_blank"><ExternalLink size={14} /> View product</Link>
        </div>
      )}
    </div>
  );
}

// ── Controller ───────────────────────────────────────────────────────────────
export default function ProductCatalog() {
  const { user } = useAuth();
  const { buildPath } = useCMSConfig();
  const [products, setProducts] = useState<Prod[]>([]);
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);

  useEffect(() => { fetchProducts(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const res = await fetch("/api/cms/products?includeImages=true&includeCategories=true&includeVariants=true");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const transformed: Prod[] = (data.products || []).map((p: any) => {
        const type = (p.type || "SIMPLE").toUpperCase();
        return {
          id: p.id,
          name: p.title,
          slug: p.slug,
          sku: p.sku || "",
          type,
          family: familyOf(type),
          price: (p.basePrice ?? 0) / 100,
          compareAt: p.compareAtPrice != null ? p.compareAtPrice / 100 : null,
          status: (p.status || "draft").toLowerCase(),
          stock: p.stock ?? 0,
          trackInventory: p.trackInventory ?? true,
          category: p.categories?.[0]?.category?.slug || "uncategorized",
          thumbnail: p.images?.[0]?.media?.url || null,
          variants: Array.isArray(p.variants) ? p.variants.length : 0,
          interval: p.subscriptionInterval || null,
          duration: p.serviceDuration ?? null,
          capacity: p.serviceCapacity ?? null,
          createdAt: p.createdAt,
        };
      });
      setProducts(transformed);
    } catch (e) {
      console.error("Error fetching products:", e);
      toast.error("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const goNew = (f?: Family | null) => {
    const t = f === "digital" ? "?type=DIGITAL" : f === "service" ? "?type=SERVICE" : "";
    window.location.href = buildPath(`/admin/products/new${t}`);
  };

  return (
    <div className="main-inner" style={{ padding: "4px 2px" }} data-tour-id="products-page">
      {family
        ? <FamilyTable family={family} products={products} onBack={() => setFamily(null)} onNew={goNew} buildPath={buildPath} />
        : <Landing products={products} onPick={setFamily} onNew={() => goNew(null)} onRefresh={fetchProducts} loading={loading} />}
      {loading && products.length === 0 && (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-faint)", fontSize: 13 }}>
          <RefreshCw size={18} className="animate-spin" style={{ display: "inline" }} /> Loading catalog…
        </div>
      )}
    </div>
  );
}
