// script.js
const $ = id => document.getElementById(id);
const addressInput = $("wallet");
const analyzeBtn   = $("analyze");
const outputDiv    = $("output");
const aiSection    = $("ai-section");
const aiOutput     = $("ai-output");
const loader       = $("loader");

// ---- debounce (optional but nice) ----
const debounce = (fn, wait = 300) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
};

analyzeBtn.addEventListener("click", debounce(async () => {
  const address = addressInput.value.trim();
  if (!address) {
    outputDiv.innerHTML = "Please enter a wallet address.";
    return;
  }

  // UI reset
  loader.classList.remove("hidden");
  outputDiv.innerHTML = "";
  aiSection.classList.add("hidden");

  try {
    const resp = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address })
    });

    if (!resp.ok) throw new Error(`Server ${resp.status}`);

    const { html, allTokens } = await resp.json();

    loader.classList.add("hidden");
    outputDiv.innerHTML = html || "No data found.";

    // ---- Dobby AI (unchanged) ----
    if (allTokens?.length) {
      aiSection.classList.remove("hidden");
      aiOutput.innerHTML = "Dobby is analyzing…";

      const summary = allTokens
        .slice(0, 15)
        .map(t => `${t.symbol}: ${t.balance} ($${t.value?.toFixed(2) ?? 0})`)
        .join(", ");

      const dobbyResp = await fetch("/api/dobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: `Analyze this crypto portfolio: ${summary}.
                  Give a professional risk analysis, diversification advice,
                  and suggest which coins to hold or reduce exposure to.`
        })
      });

      const dobby = await dobbyResp.json();
      aiOutput.innerHTML = dobby.output?.replace(/\n/g, "<br>") ||
                           "Dobby couldn’t generate advice.";
    }
  } catch (err) {
    loader.classList.add("hidden");
    outputDiv.innerHTML = `Error: ${err.message}`;
    console.error(err);
  }
}));

// ---- copy-to-clipboard for token symbols ----
document.addEventListener("click", e => {
  if (e.target.classList.contains("copy-btn")) {
    const txt = e.target.dataset.clip;
    navigator.clipboard.writeText(txt).then(() => {
      const old = e.target.textContent;
      e.target.textContent = "Copied!";
      setTimeout(() => e.target.textContent = old, 1500);
    });
  }
});
