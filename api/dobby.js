export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('POST only');
    const { address, chain, balances } = req.body;
    const key = process.env.DOBBY_API_KEY;

    const prompt = `
You are Dobby, Sentient's intelligent portfolio assistant.

Analyze this wallet's holdings and return **only valid JSON** with the structure:
{
  "score": number (0-100),
  "personality": string,
  "suggestions": [string]
}

If you cannot compute precise values, use reasoned estimates.

Wallet Info:
- Chain: ${chain}
- Address: ${address}
- Portfolio: ${JSON.stringify(balances.slice(0, 8))}
`;

    const response = await fetch('https://api.sentient.ai/v1/dobby/reason', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({ prompt })
    });

    const text = await response.text();

    // Try parsing JSON safely
    let result;
    try {
      // If response is pure JSON
      result = JSON.parse(text);
    } catch {
      // Try extracting JSON part if it's embedded
      const match = text.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : null;
    }

    // Fallback if still not
