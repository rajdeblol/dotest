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

  try {
    const res = await fetch("/api/fetchPortfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    const { portfolio } = await res.json();

    if (!portfolio || portfolio.length === 0) {
      output.innerHTML = "No tokens found.";
      loader.classList.add("hidden");
      return;
    }

    let html = "";
    portfolio.forEach(({ chain, tokens }) => {
      html += `<h3>${chain.toUpperCase()}</h3>`;
      tokens.forEach(t => {
        html += `<p>${t.symbol}: ${t.balance} ($${t.value})</p>`;
      });
    });

    loader.classList.add("hidden");
    output.innerHTML = html;

    // AI section
    aiSection.classList.remove("hidden");
    aiOutput.innerHTML = "🧠 Dobby is analyzing your portfolio...";

    const summary = portfolio
      .flatMap(p => p.tokens.map(t => `${t.symbol}: ${t.balance} ($${t.value})`))
      .slice(0, 10)
      .join(", ");

    const aiRes = await fetch("/api/dobby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: `Analyze this crypto portfolio: ${summary}. 
        Give a short, practical summary about diversification, risk, and improvements.`,
      }),
    });

    const data = await aiRes.json();
    aiOutput.innerHTML = data.output || "⚠️ Dobby couldn’t generate advice.";
  } catch (err) {
    console.error(err);
    output.innerHTML = "❌ Error fetching data.";
    loader.classList.add("hidden");
  }
});
