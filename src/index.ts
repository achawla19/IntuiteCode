import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(
  cors({
    origin: ["https://leetcode.com", "chrome-extension://*"],
    methods: ["POST"],
  }),
);

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "IntuitCode API" });
});

app.post("/chat", async (req: Request, res: Response) => {
  if (!GROQ_API_KEY) {
    res.status(500).json({ error: "API key not configured" });
    return;
  }

  const { messages, systemPrompt } = req.body;

  if (!messages || !systemPrompt) {
    res.status(400).json({ error: "Missing messages or systemPrompt" });
    return;
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          max_tokens: 200,
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      res
        .status(response.status)
        .json({ error: err?.error?.message ?? "Groq error" });
      return;
    }

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ?? "Could you elaborate?";
    res.json({ reply });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`IntuitCode backend running on port ${PORT}`);
});
