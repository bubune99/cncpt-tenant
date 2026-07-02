(() => {
  const main = document.querySelector("main") || document.body;
  const txt = main.innerText.replace(/\s+/g, " ").slice(0, 800);
  const errs = (window.__probeErrs || []).slice(-6);
  return JSON.stringify({ path: location.pathname + location.search, errs, txt });
})()
