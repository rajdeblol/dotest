export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const dobbyKey = "key_4eHVoHhKpNbAteoG";

  try {
    const { input } = await req.json();

    const dobbyRes = await fetch("https://api.sentient.io/v1/dobby/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${dobbyKey}`,
      },
      body: JSON.stringify({ input }),
    });

    const data = await dobbyRes.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Dobby API error:", err);
    res.status(500).json({ error: "Failed to connect to Dobby API" });
  }
}

