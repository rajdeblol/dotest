const covalentKey = "cqt_rQv3vG3MBFpVghJHB9vPJKXQCxc7";
const chains = ["eth-mainnet", "matic-mainnet", "bsc-mainnet", "base-mainnet"];

document.getElementById("analyze").addEventListener("click", async () => {
  const address = document.getElementById("wallet").value.trim();
  const output = document.getElementById("output");
  const aiSection = document.getElementById("ai-section");
  const aiOutput = document.getElementById("ai-output");
  const loader = document.getElementById("loader");

  if (!address) {
    output.innerHTML = "⚠️ Please enter a wallet address.";
    return;
  }

  loader.classList.remove("hidden");
  output.innerHTML = "";
  aiSection.classList.add("hidden");

  let allTokens = [];
  let html = "";

  for (const chain of chains) {
    const proxy = "https://corsproxy.io/?";
    const url = `${proxy}https://api.covalenthq.com/v1/${chain}/address/${address}/balances_v2/?key=${covalentKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data?.data?.items?.length) {
        html += `<h3>${chain.toUpperCase()}</h3>`;
        data.data.items.forEach((token) => {
          const balance = (token.balance / 10 ** token.contract_decimals).toFixed(4);
          const symbol = token.contract_ticker_symbol;
          const value = token.quote;
          html += `<p>${symbol}: ${balance} (${value ? "$" + value.toFixed(2) : "N/A"})</p>`;
          allTokens.push({ symbol, balance, value });
        });
      } else {
        html += `<p>${chain.toUpperCase()}: No tokens found</p>`;
      }
    } catch (err) {
      html += `<p>${chain.toUpperCase()}: ❌ Error fetching data</p>`;
      console.error(err);
    }
  }

  loader.classList.add("hidden");
  output.innerHTML = html || "No data found.";

  if (allTokens.length > 0) {
    aiSection.classList.remove("hidden");
    aiOutput.innerHTML = "🧠 Dobby is analyzing your portfolio...";

    const tokenSummary = allTokens
      .slice(0, 10)
      .map((t) => `${t.symbol}: ${t.balance} ($${t.value ? t.value.toFixed(2) : 0})`)
      .join(", ");

    try {
      const res = await fetch("/api/dobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: `Analyze this crypto portfolio: ${tokenSummary}. 
          Give practical advice about diversification, risk exposure, and which tokens to consider adding or reducing.`,
        }),
      });

      const data = await res.json();
      aiOutput.innerHTML = data.output || "⚠️ Dobby couldn’t generate advice.";
    } catch (err) {
      aiOutput.innerHTML = "❌ Error connecting to Dobby API.";
      console.error("Dobby API error:", err);
    }
  }
});
