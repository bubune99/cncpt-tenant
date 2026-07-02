(() => {
  const label = window.__navTarget;
  const els = [...document.querySelectorAll("a,button")].filter(e => e.innerText.trim().split("\n")[0] === label);
  if (!els.length) return "NOT_FOUND:" + label;
  const el = els[0];
  el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  el.click();
  return "clicked:" + label;
})()
