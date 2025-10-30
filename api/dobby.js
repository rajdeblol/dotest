export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).send('POST only');
    const body = req.body;
    const key = process.env.DOBBY_API_KEY;

    const prompt = `
      You are Dobby, Sentient's AI.
      Analyze this wallet portfolio and respond with JSON:
      { "score": 0-100, "personality": "...", "suggestions": ["...","...","..."] }
      Portfolio: ${JSON.stringify(body.balances.slice(0,10))}
    `;

    const r = await fetch('https://api.sentient.ai/v1/dobby/reason', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({ prompt })
    });

    const text = await r.text();
    const match = text.match(/\{[\\s\\S]*\}/);
    const json = match ? JSON.parse(match[0]) : { raw: text };

    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
