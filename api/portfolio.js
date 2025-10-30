// api/portfolio.js
const COVALENT_KEY = process.env.COVALENT_API_KEY;
const chains = ["eth-mainnet", "matic-mainnet", "bsc-mainnet", "base-mainnet"];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "address required" });

  if (!COVALENT_KEY) return res.status(500).json({ error: "API key missing" });

  const allTokens = [];
  let html = "";
  let hasData = false;

  for (const chain of chains) {
    const url = `https://api.covalenthq.com/v1/${chain}/address/${address}/balances_v2/?key=${COVALENT_KEY}&nft=false`;
    try {
      const resp = await fetch(url, { timeout: 8000 });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const { data } = await resp.json();

      if (data?.items?.length) {
        hasData = true;
        html += `<div class="chain"><h3>${formatChain(chain)}</h3>`;
        data.items.forEach(t => {
          if (!t.contract_ticker_symbol) return;
          const balance = (Number(t.balance) / 10 ** t.contract_decimals).toFixed(4);
          const symbol = t.contract_ticker_symbol;
          const value = t.quote;

          html += `<p class="token">
            <strong>${symbol}</strong>: ${balance}
            ${value ? `<span class="value">($${value.toFixed(2)})</span>` : ""}
            <button class="copy-btn" data-clip="${symbol}">Copy</button>
          </p>`;
          allTokens.push({ symbol, balance: +balance, value });
        });
        html += `</div>`;
      }
    } catch (e) {
      html += `<p class="error">${formatChain(chain)}: Failed to load</p>`;
    }
  }

  if (!hasData) html = "<p>No tokens found across all chains.</p>";

  res.json({ html, allTokens });
}

function formatChain(name) {
  return name.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
