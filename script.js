// script.js
const $ = s => document.querySelector(s);
const walletInput = $('#wallet');
const analyzeBtn = $('#analyze');
const output = $('#output');
const aiSection = $('#ai-section');
const aiOutput = $('#ai-output');
const loader = $('#loader');

const debounce = (fn, delay = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

analyzeBtn.addEventListener('click', debounce(async () => {
  const address = walletInput.value.trim();
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    output.innerHTML = '<p class="error">Please enter a valid wallet address.</p>';
    return;
  }

  // Reset
  loader.classList.remove('hidden');
  output.innerHTML = '';
  aiSection.classList.add('hidden');

  try {
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address })
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const { html, allTokens } = await res.json();
    loader.classList.add('hidden');
    output.innerHTML = html;

    // AI Advice
    if (allTokens?.length > 0) {
      aiSection.classList.remove('hidden');
      aiOutput.innerHTML = '<p>Analyzing with Dobby AI...</p>';

      const summary = allTokens
        .slice(0, 12)
        .map(t => `${t.symbol}: ${t.balance} ($${t.value?.toFixed(2) ?? 0})`)
        .join(', ');

      const aiRes = await fetch('/api/dobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: `Analyze: ${summary}` })
      });

      const { output: advice } = await aiRes.json();
      aiOutput.innerHTML = advice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }
  } catch (err) {
    loader.classList.add('hidden');
    output.innerHTML = `<p class="error">Failed to load: ${err.message}</p>`;
    console.error(err);
  }
}));

// Copy to clipboard
document.addEventListener('click', e => {
  if (e.target.classList.contains('copy-btn')) {
    const text = e.target.dataset.clip;
    navigator.clipboard.writeText(text);
    const old = e.target.textContent;
    e.target.textContent = 'Copied!';
    setTimeout(() => e.target.textContent = old, 1500);
  }
});
