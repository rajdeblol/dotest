const COVALENT_API_KEY = "cqt_rQv3vG3MBFpVghJHB9vPJKXQCxc7";
const $ = (id) => document.getElementById(id);

$('walletForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loading').classList.remove('hidden');
  $('result').innerHTML = '';

  const address = $('address').value.trim();
  const chain = $('chain').value;

  try {
    // 🪙 Fetch token balances
    const covalentRes = await fetch(
      `https://api.covalenthq.com/v1/${chain}/address/${address}/balances_v2/?key=${COVALENT_API_KEY}`
    );
    const covalentData = await covalentRes.json();

    const balances = covalentData.data?.items || [];

    // 🧠 Send to Dobby backend for analysis
    const res = await fetch('/api/dobby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, chain, balances }),
    });

    const dobby = await res.json();

    if (dobby.error) throw new Error(dobby.error);

    // 🧾 Render output
    $('result').innerHTML = `
      <h2>📊 Score: ${dobby.score || '-'} / 100</h2>
      <div class="score-bar"><div class="fill" style="width:${dobby.score || 0}%;"></div></div>
      <p><strong>Personality:</strong> ${dobby.personality || '-'}</p>

      ${dobby.holdings ? `
      <div class="section">
        <h3>Top Holdings</h3>
        <ul>
          ${dobby.holdings.map(h => `
            <li><span>${h.symbol}</span> - $${h.value.toFixed(2)} (${h.share}%)</li>
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
