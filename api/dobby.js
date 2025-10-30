export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { address, balances } = req.body;

    if (!balances || balances.length === 0)
      return res.json({
        score: 0,
        personality: 'Empty',
        suggestions: ['No tokens found.'],
      });

    const valid = balances.filter(
      (t) => t.quote && t.quote > 1 && t.contract_ticker_symbol
    );

    const top = valid
      .sort((a, b) => b.quote - a.quote)
      .slice(0, 5)
      .map((t) => ({
        symbol: t.contract_ticker_symbol,
        value: t.quote,
        chain: t.chain || 'Unknown',
      }));

    const total = valid.reduce((sum, t) => sum + t.quote, 0);
    top.forEach((t) => (t.share = ((t.value / total) * 100).toFixed(1)));

    const stableSymbols = ['USDT', 'USDC', 'DAI', 'BUSD'];
    const stableValue = valid
      .filter((t) => stableSymbols.includes(t.contract_ticker_symbol))
      .reduce((sum, t) => sum + t.quote, 0);
    const stableRatio = stableValue / total;

    let score = 50;
    let personality = '';
    const suggestions = [];

    const chainSet = new Set(valid.map((t) => t.chain));
    if (chainSet.size > 1) {
      score += 10;
      suggestions.push('Good multi-chain diversification.');
    }

    if (valid.length < 3) {
      score -= 10;
      suggestions.push('Add more tokens for diversification.');
    }

    if (stableRatio < 0.05) {
      score -= 10;
      suggestions.push('Low stable exposure — consider USDC or DAI.');
    } else if (stableRatio > 0.4) {
      score += 5;
      suggestions.push('Good stablecoin coverage.');
    }

    if (valid.some((t) => ['DOGE', 'SHIB', 'PEPE'].includes(t.contract_ticker_symbol))) {
      score -= 10;
      suggestions.push('Too much meme exposure — rebalance into bluechips.');
    }

    if (total > 1000 && stableRatio > 0.1) score += 10;

    score = Math.max(10, Math.min(100, score));

    if (score > 85) personality = 'Core Believer';
    else if (score > 70) personality = 'Balanced Investor';
    else if (score > 55) personality = 'High-Risk Degen';
    else personality = 'Reckless Trader';

    const recommendedTokens = [];
    if (stableRatio < 0.05) recommendedTokens.push('USDC', 'DAI');
    if (valid.length < 3) recommendedTokens.push('ETH', 'BTC', 'LINK');
    if (score < 60) recommendedTokens.push('AAVE', 'TIA', 'ARB');
    if (!chainSet.has('Base')) recommendedTokens.push('OP', 'DEGEN');

    res.json({
      score,
      personality,
      holdings: top,
      suggestions,
      recommendedTokens,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error occurred' });
  }
}
