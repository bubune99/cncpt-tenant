(() => {
  const main = document.querySelector("main") || document.body;
  return main.innerText.replace(/\s+/g, " ").slice(300, 1400);
})()
