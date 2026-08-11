/**
 * AI image similarity via Google Gemini.
 *
 * A vision model compares the newly reported photo against candidate photos
 * and returns a 0-100 similarity score for each — far better than dHash at
 * recognizing the same item photographed from a different angle, in different
 * lighting, or as a screenshot. Candidates are sent in small batches to keep
 * each request well under serverless body-size limits.
 *
 * The caller keeps full control: when GEMINI_API_KEY is missing or the API
 * fails, this returns an empty map and the caller falls back to dHash.
 */
import { IMAGE_AI } from "@/matching/config";
import { readImageBufferFromUrl } from "@/matching/imageMatcher";

interface CandidatePhoto {
  itemId: string;
  imageUrl: string;
}

const SCORE_PROMPT = `You are comparing photos for a lost-and-found app. The FIRST photo is the subject item.
For each subsequent photo, give an integer similarity score from 0 to 100 indicating how likely it shows the SAME physical item (same object, not merely the same type of item).
Be strict: different objects of the same kind should score low; the same item photographed differently should score high.
Return ONLY a JSON object with a "scores" field mapping each photo's index (2 for the second photo, 3 for the third, ...) to its score. No extra text, no markdown.`;

function geminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

async function scoreBatch(
  subject: Buffer,
  chunk: { itemId: string; data: Buffer }[],
  apiKey: string,
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();

  const parts: Record<string, string | { mimeType: string; data: string }>[] = [
    { text: SCORE_PROMPT },
    { inlineData: { mimeType: "image/jpeg", data: subject.toString("base64") } },
    ...chunk.map((c) => ({ inlineData: { mimeType: "image/jpeg", data: c.data.toString("base64") } })),
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_AI.model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    },
  );
  if (!res.ok) return scores;

  const json: unknown = await res.json();
  const text = (json as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
    ?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return scores;

  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as { scores?: Record<string, number> };
  const mapping = parsed.scores ?? {};

  chunk.forEach((c, idx) => {
    const value = Number(mapping[String(idx + 2)]);
    if (Number.isFinite(value)) {
      scores.set(c.itemId, Math.max(0, Math.min(100, Math.round(value))));
    }
  });

  return scores;
}

/**
 * Compare a subject photo against candidate photos using Gemini.
 * Returns a map of itemId -> similarity score (0-100). Empty when the API is
 * not configured or every comparison failed.
 */
export async function getGeminiImageScores(
  subjectUrl: string,
  candidates: CandidatePhoto[],
): Promise<Map<string, number>> {
  const apiKey = geminiApiKey();
  if (!apiKey || candidates.length === 0) return new Map();

  const subject = await readImageBufferFromUrl(subjectUrl);
  if (!subject) return new Map();

  const pool = candidates.slice(0, IMAGE_AI.maxCandidates);
  const loaded: { itemId: string; data: Buffer }[] = [];
  for (const c of pool) {
    const data = await readImageBufferFromUrl(c.imageUrl);
    if (data) loaded.push({ itemId: c.itemId, data });
  }
  if (loaded.length === 0) return new Map();

  const scores = new Map<string, number>();
  for (let i = 0; i < loaded.length; i += IMAGE_AI.chunkSize) {
    const chunk = loaded.slice(i, i + IMAGE_AI.chunkSize);
    const chunkScores = await scoreBatch(subject, chunk, apiKey);
    chunkScores.forEach((score, itemId) => scores.set(itemId, score));
  }

  return scores;
}
