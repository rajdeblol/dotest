export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { address } = req.body;
  const key = "cqt_rQv3vG3MBFpVghJHB9vPJKXQCxc7";
  const chains = ["eth-mainnet", "matic-mainnet", "bsc-mainnet", "base-mainnet"];

  try {
    const results = [];

    for (const chain of chains) {
      const response = await fetch(
        `https://api.covalenthq.com/v1/${chain}/address/${address}/balances_v2/?key=${key}`
      );
      const data = await response.json();

      const tokens = (data.data?.items || [])
        .filter(t => Number(t.balance) > 0)
        .map(t => ({
          symbol: t.contract_ticker_symbol,
          balance: (t.balance / 10 ** t.contract_decimals).toFixed(4),
          value: t.quote ? t.quote.toFixed(2) : "0.00",
        }));

      results.push({ chain, tokens });
    }

    res.status(200).json({ portfolio: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
}
