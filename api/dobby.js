export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).send("POST only");

    const { address, chain, balances = [] } = req.body;
    const key = process.env.DOBBY_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "Missing DOBBY_API_KEY" });
    }

    const prompt = `
You are Dobby, Sentient's portfolio analyst.
Return ONLY valid JSON:
{
  "score": number,
  "personality": string,
  "suggestions": [string]
}
Wallet: ${address}
Chain: ${chain}
Holdings: ${JSON.stringify(balances.slice(0, 10))}
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
    console.log("Dobby raw:", text);

    // If API sends a non-JSON error message like “A server error…”
    if (!r.ok || text.trim().startsWith("A server")) {
      return res.status(200).json(fallbackAnalysis(balances));
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      data = match ? JSON.parse(match[0]) : fallbackAnalysis(balances);
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Handler error:", err);
    res.status(200).json(fallbackAnalysis(req.body?.balances || []));
  }
}

// Simple offline logic if Dobby API fails
function fallbackAnalysis(balances) {
  const total = balances.reduce((s, t) => s + (t.quote || 0), 0);
  const stables = balances.filter((t) =>
    /USDT|USDC|DAI|BUSD/i.test(t.contract_ticker_symbol)
  );
  const ratio = total
    ? (stables.reduce((s, t) => s + (t.quote || 0), 0) / total) * 100
    : 0;

  let personality, score;
  if (ratio > 70) {
    personality = "Conservative Holder";
    score = 55;
  } else if (ratio < 10) {
    personality = "High-Risk Degen";
    score = 75;
  } else {
    personality = "Balanced Explorer";
    score = 65;
  }

  return {
    score,
    personality,
    suggestions: [
      ratio > 70
        ? "Too many stables — add growth assets."
        : "Diversify with some stable exposure.",
      "Rebalance quarterly.",
      "Stake idle tokens for yield.",
    ],
  };
}
