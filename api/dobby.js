export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).send("POST only");

    const { address, chain, balances = [] } = req.body;
    const key = process.env.DOBBY_API_KEY;

    // ---- STEP 1: try Sentient Dobby if available ----
    let dobbyResult;
    if (key) {
      try {
        const prompt = `
You are Dobby, Sentient's portfolio analyst.
Return valid JSON only:
{ "score": number, "personality": string, "suggestions": [string] }
Analyze this wallet:
Chain: ${chain}
Address: ${address}
Holdings: ${JSON.stringify(balances.slice(0, 8))}
`;
        const r = await fetch("https://api.sentient.ai/v1/dobby/reason", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ prompt }),
        });

        const text = await r.text();
        if (r.ok && text.trim().startsWith("{")) {
          dobbyResult = JSON.parse(text);
        }
      } catch (e) {
        console.warn("Dobby unavailable:", e.message);
      }
    }

    // ---- STEP 2: always compute our own analysis too ----
    const analysis = localWalletIntelligence(balances);

    // merge Dobby + local logic
    const finalResult = {
      ...analysis,
      ...(dobbyResult || {}),
    };

    res.status(200).json(finalResult);
  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({ error: err.message });
  }
}

// ---- LOCAL WALLET ANALYSIS ----
function localWalletIntelligence(balances) {
  if (!balances.length)
    return { score: 0, personality: "Empty", suggestions: ["No tokens found."] };

  const total = balances.reduce((s, t) => s + (t.quote || 0), 0);
  const sorted = balances
    .filter((t) => t.quote > 0)
    .sort((a, b) => b.quote - a.quote);

  const top = sorted.slice(0, 5).map((t) => ({
    name: t.contract_name || t.contract_ticker_symbol,
    symbol: t.contract_ticker_symbol,
    value: t.quote,
    share: ((t.quote / total) * 100).toFixed(1),
  }));

  // categorize
  const stableValue = sorted
    .filter((t) => /USDT|USDC|DAI|BUSD|TUSD/i.test(t.contract_ticker_symbol))
    .reduce((s, t) => s + (t.quote || 0), 0);
  const memecoins = sorted.filter((t) =>
    /DOGE|SHIB|PEPE|BONK|FLOKI/i.test(t.contract_ticker_symbol)
  );
  const bluechips = sorted.filter((t) =>
    /ETH|BTC|MATIC|BNB|SOL|AVAX|ARB/i.test(t.contract_ticker_symbol)
  );

  const stableRatio = total ? (stableValue / total) * 100 : 0;
  const memeRatio = total
    ? (memecoins.reduce((s, t) => s + (t.quote || 0), 0) / total) * 100
    : 0;
  const blueRatio = total
    ? (bluechips.reduce((s, t) => s + (t.quote || 0), 0) / total) * 100
    : 0;

  // ---- personality + advice ----
  let personality = "Balanced Explorer";
  let score = 70;
  const suggestions = [];

  if (stableRatio > 60) {
    personality = "Conservative Holder";
    score = 55;
    suggestions.push(
      "You’re holding too many stablecoins; allocate more to growth assets."
    );
  } else if (memeRatio > 40) {
    personality = "High-Risk Degen";
    score = 60;
    suggestions.push(
      "Heavy meme exposure — diversify into bluechips or infrastructure plays."
    );
  } else if (blueRatio > 70) {
    personality = "Core Believer";
    score = 80;
    suggestions.push("Strong bluechip position — consider small cap exposure for upside.");
  }

  // improvement ideas + token recommendations
  suggestions.push("Rebalance quarterly to maintain risk profile.");
  suggestions.push("Stake idle bluechips for yield.");

  const recommendations = [];
  if (stableRatio > 50) recommendations.push("ETH", "BTC", "SOL");
  else if (memeRatio > 30) recommendations.push("LINK", "AAVE", "ARB");
  else recommendations.push("USDC", "DAI", "TIA");

  return {
    score,
    personality,
    holdings: top,
    suggestions,
    recommendedTokens: recommendations,
  };
}
