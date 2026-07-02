(() => {
  const els = [...document.querySelectorAll("a,button")];
  return "clickables=" + els.length + " :: " +
    els.slice(0, 40).map((e, i) => i + ":" + (e.innerText || e.getAttribute("aria-label") || "?").trim().slice(0, 20).replace(/\n/g, "/")).join(" | ");
})()
