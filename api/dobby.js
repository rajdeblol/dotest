export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('POST only');
    const { address, chain, balances } = req.body;
    const key = process.env.DOBBY_API_KEY;

    if (!key) {
      return res.status(500).json({ error: "Missing DOBBY_API_KEY in environment variables" });
    }

    const prompt = `
You are Dobby, Sentient's portfolio analyst.
Analyze this wallet and return ONLY valid JSON:
{
  "score": number (0-100),
  "personality": string,
  "suggestions": [string]
}
Wallet Address: ${address}
Chain: ${chain}
Holdings: ${JSON.stringify(balances?.slice(0, 10) || [])}
`;

    // Call Dobby API
    const response = await fetch('https://api.sentient.ai/v1/dobby/reason', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({ prompt })
    });

    const text = await response.text();
    console.log("Dobby raw:", text);

    // If Dobby server failed
    if (!response.ok || text.startsWith("A server")) {
      console.warn("Dobby API failed, using fallback intelligence");
      const fallback = smartWalletLogic(balances);
      return res
