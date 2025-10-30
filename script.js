const covalentKey = "cqt_rQv3vG3MBFpVghJHB9vPJKXQCxc7";
const dobbyKey = "key_4eHVoHhKpNbAteoG";

// ✅ Use numeric chain IDs
const chains = [
  { name: "Ethereum", id: 1 },
  { name: "Polygon", id: 137 },
  { name: "Binance Smart Chain", id: 56 },
  { name: "Base", id: 8453 }
];

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
    const url = `https://api.covalenthq.com/v1/${chain.id}/address/${address}/balances_v2/?key=${covalentKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data?.data?.items?.length) {
        html += `<h3>${chain.name}</h3>`;
        data.data.items.forEach(token => {
          const balance = (token.balance / 10 ** token.contract_decimals).toFixed(4);
          const symbol = token.contract_ticker_symbol;
          const value = token.quote;
          html += `<p>${symbol}: ${balance} (${value ? '$' + value.toFixed(2) : 'N/A'})</p>`;
          allTokens.push({ symbol, balance, value });
        });
      } else {
        html += `<p>${chain.name}: No tokens found</p>`;
      }
    } catch (err) {
      html += `<p>${chain.name}: ❌ Error fetching data</p>`;
      console.error(err);
    }
  }

  loader.classList.add("hidden");
  output.innerHTML = html || "No data found.";

  // --- Dobby AI Integration ---
  if (allTokens.length > 0) {
    aiSection.classList.remove("hidden");
    aiOutput.innerHTML = "🧠 Dobby is analyzing your portfolio...";

    const tokenSummary = allTokens
      .slice(0, 10)
      .map(t => `${t.symbol}: ${t.balance} ($${t.value ? t.value.toFixed(2) : 0})`)
      .join(", ");

    const dobbyURL = "https://api.sentient.io/v1/dobby/chat";

    const dobbyPayload = {
      input: `Analyze this portfolio: ${tokenSummary}.
      Give clear, practical portfolio management advice: risk exposure, diversification, long-term stability, and which assets to add or reduce.`
    };

    try {
      const dobbyRes = await fetch(dobbyURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${dobbyKey}`
        },
        body: JSON.stringify(dobbyPayload)
      });

      const dobbyData = await dobbyRes.json();
      aiOutput.innerHTML =
        dobbyData.output ||
        dobbyData.message ||
        "⚠️ Dobby couldn’t generate advice.";
    } catch (err) {
      aiOutput.innerHTML = "❌ Error connecting to Dobby API.";
      console.error(err);
    }
  }
});
