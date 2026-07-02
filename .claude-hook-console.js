(() => {
  if (window.__probeErrs) return "already-hooked:" + window.__probeErrs.length;
  window.__probeErrs = [];
  const orig = console.error;
  console.error = function (...a) { try { window.__probeErrs.push(a.map(String).join(" ").slice(0, 200)); } catch {} return orig.apply(this, a); };
  window.addEventListener("error", e => window.__probeErrs.push("window:" + String(e.message).slice(0, 200)));
  window.addEventListener("unhandledrejection", e => window.__probeErrs.push("promise:" + String(e.reason).slice(0, 200)));
  return "hooked";
})()
