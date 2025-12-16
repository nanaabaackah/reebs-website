// netlify/functions/aiSearch.js
import OpenAI from "openai";

// eslint-disable-next-line no-undef
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const handler = async (event) => {
  try {
    const { query, inventory } = JSON.parse(event.body);

    // Step 1: Send query + product names/types to LLM
    const prompt = `
      You are a search assistant. The user query is: "${query}".
      Given this inventory list (name, type, and price), return an array of item IDs that best match.
      Focus on matching by theme, item purpose, and keywords.
      Only return JSON: {"matches": [id1, id2, ...]}.

      Inventory:
      ${inventory.map(
        (item) => `${item.id}: ${item.name} (${item.type}) - ${item.price} GHS`
      ).join("\n")}
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const resultText = completion.choices[0].message.content;
    const jsonMatch = JSON.parse(resultText);

    return {
      statusCode: 200,
      body: JSON.stringify(jsonMatch),
    };
  } catch (err) {
    console.error("AI Search error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
