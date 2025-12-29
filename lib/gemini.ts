const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  promptFeedback?: unknown;
};

type DetailLevel = "short" | "medium" | "long";

export type Question = {
  question: string;
  options: [string, string, string];
  correct: number; // 0, 1, or 2
};

const lengthHints: Record<DetailLevel, { instruction: string; maxTokens: number }> = {
  short: { instruction: "Сделай очень кратко: 1-2 предложения, главное, без деталей.", maxTokens: 120 },
  medium: { instruction: "Сделай краткое описание: 3-4 предложения, по делу, без лишнего.", maxTokens: 220 },
  long: {
    instruction: "Сделай более подробное резюме: 5-7 предложений, сохрани структуру и ключевые моменты.",
    maxTokens: 360,
  },
};

export async function summarizeTranscript(transcript: string, detail: DetailLevel = "short"): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  if (!transcript.trim()) throw new Error("Transcript is empty, cannot summarize");

  const { instruction, maxTokens } = lengthHints[detail] ?? lengthHints.short;

  const body = {
    contents: [
      {
        parts: [
          { text: `${instruction} Если транскрипт неполный, напиши, что данных мало, но все равно попробуй.` },
          { text: `Транскрипт:\n${transcript}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: maxTokens,
    },
  };

  const res = await fetch(GEMINI_ENDPOINT(DEFAULT_MODEL), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  }).catch((err) => {
    throw new Error(`Gemini fetch failed: ${err?.message ?? err}`);
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data: GeminiResponse = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("\n").trim() ?? "";

  if (!text) throw new Error("Gemini response missing text");
  return text;
}

export async function generateQuestions(transcript: string): Promise<Question[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  if (!transcript.trim()) throw new Error("Transcript is empty, cannot generate questions");

  const body = {
    contents: [
      {
        parts: [
          {
            text: `На основе предоставленного транскрипта видео сгенерируй 5-10 контрольных вопросов по теме видео для проверки закрепления новых знаний. Каждый вопрос должен иметь 3 варианта ответа, из которых только один правильный. Вопросы должны быть разнообразными и покрывать ключевые моменты из транскрипта.

Верни только чистый JSON массив объектов без markdown. Каждый объект имеет поля:
- question: строка с текстом вопроса
- options: массив из 3 строк с вариантами ответа
- correct: число (индекс правильного ответа: 0, 1 или 2)

Пример:
[
  {
    "question": "Какой основной принцип обсуждается в видео?",
    "options": ["Принцип A", "Принцип B", "Принцип C"],
    "correct": 1
  }
]

Транскрипт:
${transcript}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2000,
    },
  };

  const res = await fetch(GEMINI_ENDPOINT(DEFAULT_MODEL), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  }).catch((err) => {
    throw new Error(`Gemini fetch failed: ${err?.message ?? err}`);
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data: GeminiResponse = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("").trim() ?? "";

  if (!text) throw new Error("Gemini response missing text");

  // Clean markdown formatting if present
  const cleanedText = text.replace(/```json\s*/i, '').replace(/```\s*$/, '').trim();

  try {
    const questions: Question[] = JSON.parse(cleanedText);
    if (!Array.isArray(questions)) throw new Error("Response is not an array");
    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 3 || typeof q.correct !== "number" || q.correct < 0 || q.correct > 2) {
        throw new Error("Invalid question format");
      }
    }
    return questions;
  } catch (err) {
    throw new Error(`Failed to parse questions: ${err}`);
  }
}
