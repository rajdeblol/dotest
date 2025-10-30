export default async function handler(req, res) {
  try {
    const { address, chain = 'ethereum' } = req.query;
    if (!address) return res.status(400).json({ error: 'Missing address' });

    const chainMap = { ethereum: 1, polygon: 137, bsc: 56 };
    const chainId = chainMap[chain] || 1;
    const key = process.env.COVALENT_API_KEY;

    const url = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?quote-currency=USD&nft=false&no-nft-fetch=true`;
    const r = await fetch(url, { headers: { 'x-api-key': key } });
    const json = await r.json();
    const items = json.data?.items || [];

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
