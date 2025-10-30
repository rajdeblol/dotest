export default async function handler(req, res) {
  try {
    const { input } = req.body;

    const response = await fetch("https://api.sentientlabs.ai/dobby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DOBBY_API_KEY}`
      },
      body: JSON.stringify({ input })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
