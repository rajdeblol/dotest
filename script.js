const COVALENT_API_KEY = "cqt_rQv3vG3MBFpVghJHB9vPJKXQCxc7";

async function analyzePortfolio() {
  const wallet = document.getElementById("wallet").value.trim();
  const resultDiv = document.getElementById("result");
  const loadingDiv = document.getElementById("loading");
  const roastMode = document.getElementById("roastMode").checked;
  const chartCanvas = document.getElementById("portfolioChart");

  if (!wallet) return alert("Please enter a wallet address!");

  resultDiv.innerText = "";
  loadingDiv.innerText = "Fetching your portfolio...";

  try {
    // Fetch holdings
    const res = await fetch(`https://api.covalenthq.com/v1/1/address/${wallet}/balances_v2/?key=${COVALENT_API_KEY}`);
    const data = await res.json();

    if (!data.data || !data.data.items) throw new Error("Invalid wallet or no holdings found.");

    const tokens = data.data.items.filter(t => t.balance > 0);
    if (tokens.length === 0) throw new Error("No active tokens found.");

    const summary = tokens
      .map(t => `${t.contract_ticker_symbol}: ${(t.balance / 10 ** t.contract_decimals).toFixed(4)}`)
      .join(", ");

    const pieLabels = tokens.map(t => t.contract_ticker_symbol);
    const pieData = tokens.map(t => parseFloat((t.balance / 10 ** t.contract_decimals).toFixed(4)));

    // Render chart
    new Chart(chartCanvas, {
      type: 'pie',
      data: {
        labels: pieLabels,
        datasets: [{
          data: pieData,
          backgroundColor: [
            '#00b4ff', '#ff6384', '#ffcd56', '#36a2eb', '#4bc0c0', '#9966ff'
          ],
        }]
      },
      options: { plugins: { legend: { labels: { color: 'white' } } } }
    });

    loadingDiv.innerText = "Analyzing with Dobby...";

    const dobbyPrompt = `
Here is a crypto portfolio: ${summary}.
Rate it from 1 to 10 and give suggestions on what to hold or reduce exposure to.
${roastMode ? "Roast the user humorously like a degen advisor." : "Be polite and insightful."}
`;

    // Call backend API safely
    const dobbyRes = await fetch("/api/dobby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: dobbyPrompt })
    });

    const dobbyData = await dobbyRes.json();
    loadingDiv.innerText = "";
    resultDiv.innerText = `💼 Your Holdings:\n${summary}\n\n💬 Dobby says:\n${dobbyData.output}`;
  } catch (err) {
    loadingDiv.innerText = "";
    resultDiv.innerText = "Error: " + err.message;
  }
}
