const analyzeBtn = document.getElementById("analyze");
const walletInput = document.getElementById("wallet");
const outputDiv = document.getElementById("output");
const adviceDiv = document.getElementById("advice");
const loader = document.getElementById("loader");

// Replace with your Covalent API key
const COVALENT_API_KEY = "cqt_rQv3vG3MBFpVghJHB9vPJKXQCxc7";
// Replace with your Sentient Dobby endpoint and key
const DOBBY_API_URL = "https://api.sentient.io/v1/chat/completions";
const DOBBY_API_KEY = "YOUR_DOBBY_API_KEY"; // put your key here

const CHAINS = [
  { name: "Ethereum", id: 1 },
  { name: "BSC", id: 56 },
  { name: "Polygon", id: 137 },
  { name: "Base", id: 8453 },
];

analyzeBtn.addEventListener("click", async () => {
  const wallet = walletInput.value.trim();
  if (!wallet) return alert("Please enter a wallet address.");

  outputDiv.innerHTML = "";
  adviceDiv.innerHTML = "";
  loader.classList.remove("hidden");

  try {
    let allTokens = [];

    for (const chain of CHAINS) {
      const url = `https://api.covalenthq.com/v1/${chain.id}/address/${wallet}/balances_v2/?key=${COVALENT_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data?.data?.items?.length) {
        const tokens = data.data.items
          .filter(t => t.balance > 0 && t.quote)
          .map(t => ({
            chain: chain.name,
            name: t.contract_ticker_symbol || "Unknown",
            balance: (t.balance / 10 ** t.contract_decimals).toFixed(4),
            value: t.quote.toFixed(2),
          }));

        allTokens.push(...tokens);
      }
    }

    if (allTokens.length === 0) throw new Error("No tokens found.");

    const groupedByChain = CHAINS.map(chain => {
      const tokens = allTokens.filter(t => t.chain === chain.name);
      if (tokens.length === 0) return "";
      return `
        <h3>${chain.name}</h3>
        ${tokens.map(t => `<p>${t.name}: ${t.balance} (~$${t.value})</p>`).join("")}
      `;
    }).join("");

    outputDiv.innerHTML = `<h3>📊 Multi-Chain Portfolio</h3>${groupedByChain}`;

    loader.textContent = "🧠 Asking Dobby for AI portfolio advice...";

    // Create a short summary for Dobby
    const summary = allTokens
      .map(t => `${t.name} ($${t.value}) on ${t.chain}`)
      .join(", ");

    const prompt = `
    Analyze this multi-chain crypto portfolio:
    ${summary}.
    Give a detailed breakdown of:
    - Risk exposure and diversification
    - Which assets to hold/sell/add
    - Recommended exposure (stablecoins, bluechips, etc.)
    - Suggestions to optimize risk management.
    `;

    const dobbyRes = await fetch(DOBBY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DOBBY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dobby",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const dobbyData = await dobbyRes.json();
    const advice = dobbyData?.choices?.[0]?.message?.content || "No advice returned.";

    adviceDiv.innerHTML = `<h3>🤖 Dobby's Advice</h3><p>${advice}</p>`;
  } catch (err) {
    console.error(err);
    outputDiv.innerHTML = `<p style="color:red;">⚠️ Error fetching data: ${err.message}</p>`;
  } finally {
    loader.classList.add("hidden");
  }
});
