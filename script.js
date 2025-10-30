// Configuration
const covalentKey = "cqt_rQv3vG3MBFpVghJHB9vPJKXQCxc7";
const chains = ["eth-mainnet", "matic-mainnet", "bsc-mainnet", "base-mainnet"];
const corsProxy = "https://corsproxy.io/?";

// DOM Elements
const $ = id => document.getElementById(id);
const addressInput = $("wallet");
const analyzeBtn   = $("analyze");
const outputDiv    = $("output");
const aiSection    = $("ai-section");
const aiOutput     = $("ai-output");
const loader       = $("loader");

// Debounce helper
const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

// Main handler
analyzeBtn.addEventListener("click", debounce(async () => {
  const address = addressInput.value.trim();
  if (!address) {
    outputDiv.innerHTML = "Please enter a wallet address.";
    return;
  }

  // Reset UI
  loader.classList.remove("hidden");
  outputDiv.innerHTML = "";
  aiSection.classList.add("hidden");

  const allTokens = [];
  let html = "";

  // Fetch from Covalent
  for (const chain of chains) {
    const url = `${corsProxy}https://api.covalenthq.com/v1/${chain}/address/${address}/balances_v2/?key=${covalentKey}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data?.data?.items?.length) {
        html += `<h4>${chain.toUpperCase()}</h4>`;
        data.data.items.forEach(token => {
          const balance = (token.balance / 10 ** token.contract_decimals).toFixed(4);
          const symbol  = token.contract_ticker_symbol || "UNKNOWN";
          const value   = token.quote ?? null;

          html += `<p>
            <strong>${symbol}</strong>: ${balance}
            ${value ? `($${value.toFixed(2)})` : "(no price)"}
            <button class="copy-btn" title="Copy symbol" data-clip="${symbol}">Copy</button>
          </p>`;

          allTokens.push({ symbol, balance: +balance, value });
        });
      } else {
        html += `<p>${chain.toUpperCase()}: No tokens found</p>`;
      }
    } catch (err) {
      html += `<p>${chain.toUpperCase()}: Error fetching data</p>`;
      console.error(err);
    }
  }

  // Render results
  loader.classList.add("hidden");
  outputDiv.innerHTML = html || "No data found.";

  // Dobby AI Analysis
  if (allTokens.length) {
    aiSection.classList.remove("hidden");
    aiOutput.innerHTML = "Dobby is analyzing your portfolio...";

    const tokenSummary = allTokens
      .slice(0, 15)
      .map(t => `${t.symbol}: ${t.balance} ($${t.value?.toFixed(2) ?? 0})`)
      .join(", ");

    try {
      const dobbyRes = await fetch("/api/dobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: `Analyze this crypto portfolio: ${tokenSummary}.
                  Provide a professional risk analysis, diversification advice,
                  and suggest which coins to hold or reduce exposure to.`
        })
      });

      if (!dobbyRes.ok) throw new Error(`HTTP ${dobbyRes.status}`);
      const dobbyData = await dobbyRes.json();

      aiOutput.innerHTML = dobbyData.output
        ? dobbyData.output.replace(/\n/g, "<br>")
        : "Dobby couldn’t generate advice.";
    } catch (err) {
      aiOutput.innerHTML = "Error connecting to Dobby API.";
      console.error(err);
    }
  }
}));

// Copy to clipboard for token symbols
document.addEventListener("click", e => {
  if (e.target.classList.contains("copy-btn")) {
    const text = e.target.dataset.clip;
    navigator.clipboard.writeText(text).then(() => {
      e.target.textContent = "Copied!";
      setTimeout(() => e.target.textContent = "Copy", 1500);
    });
  }
});
