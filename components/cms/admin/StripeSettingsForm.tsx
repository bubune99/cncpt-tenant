"use client";
/**
 * StripeSettingsForm — admin Payments settings (enables e-commerce checkout).
 * GET/PUT /api/cms/payments/settings (per-tenant). Lets a tenant enter their own
 * Stripe keys (own account) or leave blank to use the platform account fallback.
 */

import React from "react";

interface StripeSettings {
  enabled?: boolean;
  testMode?: boolean;
  secretKey?: string;
  publishableKey?: string;
  webhookSecret?: string;
  currency?: string;
  statementDescriptor?: string;
}

const inputStyle: React.CSSProperties = {
  background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: "var(--r-sm)",
  padding: "7px 10px", fontFamily: "var(--font-geist-mono), monospace", fontSize: 12.5,
  color: "var(--ink)", width: "100%", boxSizing: "border-box",
};
const fieldWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, padding: "8px 0" };
const lbl: React.CSSProperties = { fontFamily: "var(--font-geist-mono), monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-soft)" };

export function StripeSettingsForm() {
  const [s, setS] = React.useState<StripeSettings>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<{ kind: "ok" | "err"; text: string } | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cms/payments/settings", { credentials: "same-origin" });
        if (res.ok) setS(await res.json());
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  const set = (patch: Partial<StripeSettings>) => setS((p) => ({ ...p, ...patch }));

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      // Don't re-send masked secrets unchanged (the API ignores '********').
      const body: StripeSettings = {
        enabled: s.enabled, testMode: s.testMode, currency: s.currency || "usd",
        publishableKey: s.publishableKey, statementDescriptor: s.statementDescriptor,
      };
      if (s.secretKey && s.secretKey !== "********") body.secretKey = s.secretKey;
      if (s.webhookSecret && s.webhookSecret !== "********") body.webhookSecret = s.webhookSecret;
      const res = await fetch("/api/cms/payments/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "same-origin", body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const updated = await res.json();
      setS(updated);
      setMsg({ kind: "ok", text: "Saved. Stripe is " + (updated.enabled && (updated.secretKey || updated.publishableKey) ? "configured." : "not fully configured yet.") });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Failed to save" });
    } finally { setSaving(false); }
  };

  if (loading) return <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 620 }}>
      <div className="sec" style={{ marginBottom: 8 }}>
        <span className="n">§1</span>
        <span className="h">Stripe</span>
        <span className="meta">· enter your own keys, or leave blank to use the platform account</span>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
        <input type="checkbox" checked={!!s.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        <span style={{ fontSize: 13 }}>Enable card payments at checkout</span>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
        <input type="checkbox" checked={!!s.testMode} onChange={(e) => set({ testMode: e.target.checked })} />
        <span style={{ fontSize: 13 }}>Test mode <span className="fig" style={{ fontSize: 11 }}>(use sk_test / pk_test keys)</span></span>
      </label>

      <div style={fieldWrap}>
        <span style={lbl}>Publishable key</span>
        <input style={inputStyle} placeholder="pk_test_… or pk_live_…" value={s.publishableKey || ""} onChange={(e) => set({ publishableKey: e.target.value })} />
      </div>
      <div style={fieldWrap}>
        <span style={lbl}>Secret key</span>
        <input style={inputStyle} type="password" placeholder="sk_test_… or sk_live_…" value={s.secretKey || ""} onChange={(e) => set({ secretKey: e.target.value })} />
      </div>
      <div style={fieldWrap}>
        <span style={lbl}>Webhook signing secret</span>
        <input style={inputStyle} type="password" placeholder="whsec_…" value={s.webhookSecret || ""} onChange={(e) => set({ webhookSecret: e.target.value })} />
        <span className="fig" style={{ fontSize: 11, fontStyle: "italic", color: "var(--ink-soft)" }}>
          Register the endpoint in Stripe → Developers → Webhooks pointing at /api/cms/webhooks/stripe, then paste its signing secret here.
        </span>
      </div>
      <div style={fieldWrap}>
        <span style={lbl}>Currency</span>
        <input style={{ ...inputStyle, maxWidth: 120 }} placeholder="usd" value={s.currency || ""} onChange={(e) => set({ currency: e.target.value.toLowerCase() })} />
      </div>

      {msg && (
        <p style={{ fontSize: 12.5, color: msg.kind === "ok" ? "var(--moss)" : "var(--accent)", margin: "8px 0" }}>{msg.text}</p>
      )}

      <button className="btn btn-accent" onClick={() => void save()} disabled={saving} style={{ marginTop: 10 }}>
        {saving ? "Saving…" : "Save payment settings"}
      </button>
    </div>
  );
}
