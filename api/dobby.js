export default async function handler(req, res) {
  try {
    const body = await req.json();

    const response = await fetch("https://api.sentient.io/v1/dobby/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DOBBY_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Dobby Proxy Error:", error);
    res.status(500).json({ error: "Proxy error", details: error.message });
  }
}
