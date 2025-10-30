// api/portfolio.js
const COVALENT_KEY = process.env.COVALENT_API_KEY;   // <-- set in Vercel env
const chains = ["eth-mainnet", "matic-mainnet", "bsc-mainnet", "base-mainnet"];

export default async function handler(req, res) {
  // ---- CORS ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "address required" });

  if (!COVALENT_KEY) return res.status(500).json({ error: "API key missing" });

  const allTokens = [];
  let html = "";
  let hadError = false;

  for (const chain of chains) {
    const url = `https://api.covalenthq.com/v1/${chain}/address/${address}/balances_v2/?key=${COVALENT_KEY}`;

    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status} – ${txt}`);
      }
      const { data } = await resp.json();

      if (data?.items?.length) {
        html += `<h3>${chain.toUpperCase()}</h3>`;
        data.items.forEach(t => {
          const balance = (Number(t.balance) / 10 ** t.contract_decimals).toFixed(4);
          const symbol = t.contract_ticker_symbol || "UNKNOWN";
          const value = t.quote ?? null;

          html += `<p>
            <strong>${symbol}</strong>: ${balance}
            ${value ? `($${value.toFixed(2)})` : "(no price)"}
            <button class="copy-btn" data-clip="${symbol}">Copy</button>
          </p>`;

          allTokens.push({ symbol, balance: +balance, value });
        });
      } else {
        html += `<p>${chain.toUpperCase()}: No tokens found</p>`;
      }
    } catch (e) {
      hadError = true;
      html += `<p>${chain.toUpperCase()}: Error fetching data</p>`;
      console.error(`[Covalent ${chain}]`, e);
    }
  }

  if (hadError && allTokens.length === 0) {
    html = "<p>All chains returned errors – check console.</p>";
  }

  res.status(200).json({ html, allTokens });
}
