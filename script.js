const COVALENT_API_KEY = "cqt_rQv3vG3MBFpVghJHB9vPJKXQCxc7";
const CHAINS = [
  { id: "eth-mainnet", name: "Ethereum" },
  { id: "bsc-mainnet", name: "BNB Chain" },
  { id: "matic-mainnet", name: "Polygon" },
  { id: "base-mainnet", name: "Base" },
];

const $ = (id) => document.getElementById(id);

$('walletForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loading').classList.remove('hidden');
  $('result').innerHTML = '';

  const address = $('address').value.trim();
  const allBalances = [];

  try {
    // 🪙 Fetch from all chains in parallel
    const results = await Promise.all(
      CHAINS.map(async (chain) => {
        const res = await fetch(
          `https://api.covalenthq.com/v1/${chain.id}/address/${address}/balances_v2/?key=${COVALENT_API_KEY}`
        );
        const data = await res.json();
        const balances = data.data?.items || [];
        return { chain: chain.name, balances };
      })
    );

    // combine all balances with chain info
    results.forEach((r) => {
      r.balances.forEach((b) => {
        allBalances.push({ ...b, chain: r.chain });
      });
    });

    // 🧠 Send all balances to Dobby for analysis
    const res = await fetch('/api/dobby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, balances: allBalances }),
    });

    const dobby = await res.json();
    if (dobby.error) throw new Error(dobby.error);

    // 💎 Render UI
    $('result').innerHTML = `
      <h2>📊 Score: ${dobby.score || '-'} / 100</h2>
      <div class="score-bar"><div class="fill" style="width:${dobby.score || 0}%;"></div></div>
      <p><strong>Personality:</strong> ${dobby.personality || '-'}</p>

      ${dobby.holdings ? `
      <div class="section">
        <h3>Top Holdings</h3>
        <ul>
          ${dobby.holdings.map(h => `
            <li><span>${h.symbol}</span> - $${h.value.toFixed(2)} (${h.share}%) <em>(${h.chain})</em></li>
          `).join('')}
        </ul>
      </div>` : ''}

      <div class="section">
        <h3>Suggestions</h3>
        <ul>${(dobby.suggestions || []).map(s => `<li>${s}</li>`).join('')}</ul>
      </div>

      ${dobby.recommendedTokens ? `
      <div class="section">
        <h3>Suggested Tokens to Explore</h3>
        <p>${dobby.recommendedTokens.join(', ')}</p>
      </div>` : ''}
    `;
  } catch (err) {
    $('result').innerHTML = `<p class="error">❌ ${err.message}</p>`;
  } finally {
    $('loading').classList.add('hidden');
  }
});
