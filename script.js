const apiKey = "cqt_rQv3vG3MBFpVghJHB9vPJKXQCxc7";
const chains = ["eth-mainnet", "matic-mainnet", "bsc-mainnet", "base-mainnet"];

document.getElementById("analyze").addEventListener("click", async () => {
  const address = document.getElementById("wallet").value.trim();
  const output = document.getElementById("output");
  output.innerHTML = "🔍 Fetching portfolio data...";

  if (!address) return output.innerHTML = "⚠️ Please enter a wallet address.";

  let html = "";
  for (const chain of chains) {
    const url = `https://api.covalenthq.com/v1/${chain}/address/${address}/balances_v2/?key=${apiKey}`;
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data?.data?.items?.length) {
        html += `<h3>${chain.toUpperCase()}</h3>`;
        data.data.items.forEach(token => {
          const balance = (token.balance / 10 ** token.contract_decimals).toFixed(4);
          html += `<p>${token.contract_ticker_symbol}: ${balance}</p>`;
        });
      } else {
        html += `<p>${chain.toUpperCase()}: No tokens found</p>`;
      }
    } catch (err) {
      html += `<p>${chain.toUpperCase()}: Error fetching data</p>`;
    }
  }

  output.innerHTML = html;
});
