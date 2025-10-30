// api/dobby.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { input } = req.body || {};

  // Mock AI response (replace with OpenAI/Grok later)
  const mockAdvice = `
**Risk Analysis**: Your portfolio is heavily weighted in ETH. This is stable but limits upside from altcoins.

**Diversification**: Add BTC (10-20%) and 1-2 layer-2 tokens (ARB, OP).

**Hold**: ETH, USDC  
**Reduce**: Meme coins, low-liquidity tokens

**Overall Score**: 7.2/10 – Solid, but diversify!
  `.trim();

  // Optional: Plug in real AI here
  // const aiResp = await fetch("https://api.openai.com/...", { ... })

  res.json({ output: mockAdvice });
}
