"use client";

import { useState, type FormEvent } from "react";
import { Question } from "@/lib/gemini";

type TranscriptResponse = { transcript: string; summary?: string; raw?: any };
type DetailLevel = "short" | "medium" | "long";
type Chapter = { start: number; title: string; url: string };

type QuestionState = {
  selected: number | null;
  answered: boolean;
  isCorrect: boolean;
};

const exampleUrl = "https://www.youtube.com/watch?v=1gI65iIxbXI";
const detailLabels: Record<DetailLevel, string> = {
  short: "коротко",
  medium: "средне",
  long: "подробно",
};

export default function HomePage() {
  const [youtubeUrl, setYoutubeUrl] = useState(exampleUrl);
  const [detail, setDetail] = useState<DetailLevel>("short");
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptResponse | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([]);
  const chapters = buildChapters(result, youtubeUrl);
  const isBusy = transcriptLoading || summaryLoading || questionsLoading;

  async function fetchTranscriptAndSummary(nextDetail: DetailLevel) {
    setError(null);
    setTranscriptLoading(true);
    setSummaryLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ youtubeUrl, detail: nextDetail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
      setResult(data);
    } catch (err: any) {
      setError(err?.message ?? "Неизвестная ошибка");
    } finally {
      setTranscriptLoading(false);
      setSummaryLoading(false);
    }
  }

  async function fetchSummaryFromTranscript(nextDetail: DetailLevel, transcript: string) {
    setError(null);
    setSummaryLoading(true);
    setResult((prev) => (prev ? { ...prev, summary: "" } : prev));

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript, detail: nextDetail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
      setResult((prev) => (prev ? { ...prev, summary: data.summary ?? "" } : prev));
    } catch (err: any) {
      setError(err?.message ?? "Неизвестная ошибка");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function fetchQuestions(transcript: string) {
    setError(null);
    setQuestionsLoading(true);
    setQuestions(null);
    setQuestionStates([]);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
      setQuestions(data.questions ?? []);
      setQuestionStates(new Array(data.questions?.length ?? 0).fill({ selected: null, answered: false, isCorrect: false }));
    } catch (err: any) {
      setError(err?.message ?? "Неизвестная ошибка");
    } finally {
      setQuestionsLoading(false);
    }
  }

  function handleQuestionSelect(questionIndex: number, optionIndex: number) {
    setQuestionStates((prev) =>
      prev.map((state, idx) =>
        idx === questionIndex ? { ...state, selected: optionIndex } : state
      )
    );
  }

  function handleAnswerSubmit(questionIndex: number) {
    if (!questions || !questionStates[questionIndex]) return;
    const question = questions[questionIndex];
    const state = questionStates[questionIndex];
    if (state.selected === null || state.answered) return;

    const isCorrect = state.selected === question.correct;
    setQuestionStates((prev) =>
      prev.map((s, idx) =>
        idx === questionIndex ? { ...s, answered: true, isCorrect } : s
      )
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setQuestions(null);
    setQuestionStates([]);
    await fetchTranscriptAndSummary(detail);
  }

  async function handleDetailChange(nextDetail: DetailLevel) {
    setDetail(nextDetail);
    if (result?.transcript && !summaryLoading && !transcriptLoading) {
      await fetchSummaryFromTranscript(nextDetail, result.transcript);
    }
  }

  function handleExportPdf() {
    const summaryText = result?.summary?.trim();
    if (!summaryText) return;
    const printWindow = window.open("", "_blank", "width=960,height=720");
    if (!printWindow) return;
    const html = buildPdfHtml({
      title: "Краткое описание YouTube",
      youtubeUrl,
      transcript: summaryText,
    });
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Транскрипт YouTube ролика</h1>
        <p style={styles.lead}>Вставь ссылку на ролик. Бэкенд дернет RapidAPI и вернет краткий пересказ.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            YouTube ссылка
            <input
              style={styles.input}
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </label>
          <div style={styles.actions}>
            <button style={styles.button} type="submit" disabled={isBusy || youtubeUrl.trim().length === 0}>
              {transcriptLoading ? "Запрашиваю..." : "Получить транскрипт"}
            </button>
          </div>
        </form>

        {error && <p style={styles.error}>Ошибка: {error}</p>}

        <div style={styles.result}>
          <div style={styles.summaryHeader}>
            <div style={styles.summaryTitle}>
              <p style={styles.labelText}>Краткое описание (Gemini 2.5 Flash Lite)</p>
              {summaryLoading && <span style={styles.summaryLoader}>Обновляю описание...</span>}
            </div>
            <div style={styles.toggleGroup}>
              {(Object.keys(detailLabels) as DetailLevel[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  style={{ ...styles.toggle, ...(detail === key ? styles.toggleActive : {}) }}
                  onClick={() => handleDetailChange(key)}
                  disabled={isBusy}
                >
                  {detailLabels[key]}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.summaryBox}>
            {summaryLoading ? "Обновляю описание..." : result?.summary || "—"}
          </div>
          {result?.transcript && (
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                style={styles.secondary}
                onClick={() => fetchQuestions(result.transcript)}
                disabled={questionsLoading || !result?.transcript}
              >
                {questionsLoading ? "Генерирую вопросы..." : "Сгенерировать контрольные вопросы"}
              </button>
            </div>
          )}
          {questions && questions.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={styles.labelText}>Контрольные вопросы</p>
              {questions.map((question, idx) => {
                const state = questionStates[idx];
                return (
                  <div key={idx} style={{ ...styles.questionContainer, border: state.answered ? (state.isCorrect ? '2px solid #22c55e' : '2px solid #ef4444') : '1px solid #1f2937' }}>
                    <p style={styles.questionText}>{question.question}</p>
                    {question.options.map((option, optIdx) => (
                      <label key={optIdx} style={styles.option}>
                        <input
                          type="radio"
                          name={`question-${idx}`}
                          value={optIdx}
                          checked={state.selected === optIdx}
                          onChange={() => handleQuestionSelect(idx, optIdx)}
                          style={styles.optionInput}
                          disabled={state.answered}
                        />
                        <span style={styles.optionLabel}>{option}</span>
                      </label>
                    ))}
                    {!state.answered && state.selected !== null && (
                      <button
                        type="button"
                        style={styles.answerButton}
                        onClick={() => handleAnswerSubmit(idx)}
                      >
                        Ответить
                      </button>
                    )}
                    {state.answered && (
                      <p style={state.isCorrect ? styles.correctAnswer : styles.incorrectAnswer}>
                        {state.isCorrect ? 'Верно!' : `Неверно. Правильный ответ: ${question.options[question.correct]}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {result && (
            <>
              <div style={styles.transcriptHeader}>
                <p style={styles.labelText}>Транскрипт</p>
                <button
                  type="button"
                  style={styles.linkButton}
                  onClick={handleExportPdf}
                  disabled={!result?.summary || summaryLoading}
                >
                  Экспорт описания в PDF
                </button>
              </div>
              <pre style={styles.pre}>{result.transcript ? formatTranscriptForDisplay(result.transcript) : "—"}</pre>
              <p style={styles.hint}>
                API: youtube-captions-transcript-subtitles-video-combiner → gemini-2.5-flash-lite
              </p>
            </>
          )}
          {chapters.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={styles.labelText}>Главы (кликабельные таймкоды)</p>
              <div style={styles.chapters}>
                {chapters.map((ch, idx) => (
                  <a key={`${ch.start}-${idx}`} href={ch.url} target="_blank" rel="noopener noreferrer" style={styles.chapterChip}>
                    <span style={styles.chapterTime}>{formatClock(ch.start)}</span>
                    <span style={styles.chapterTitle}>{ch.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
// no extra helpers

type CaptionItem = { start: number; text: string; dur?: number };
type PdfPayload = { title: string; youtubeUrl: string; transcript: string };

function buildChapters(result: TranscriptResponse | null, youtubeUrl: string): Chapter[] {
  if (!result?.raw) return [];
  const items = extractCaptionItems(result.raw);
  if (!items.length) return [];
  items.sort((a, b) => a.start - b.start);

  const target = Math.min(15, Math.max(8, items.length));
  const step = Math.max(1, Math.floor(items.length / target));
  const chapters: Chapter[] = [];

  for (let i = 0; i < items.length && chapters.length < 15; i += step) {
    const item = items[i];
    chapters.push({
      start: Math.max(0, Math.floor(item.start)),
      title: trimText(item.text),
      url: buildYoutubeUrl(youtubeUrl, item.start),
    });
  }

  return chapters;
}

function extractCaptionItems(raw: any): CaptionItem[] {
  const arr = findCaptionArray(raw);
  if (arr) {
    const mapped = arr
      .map((entry) => {
        const start = pickSeconds(entry?.start ?? entry?.startTime ?? entry?.t ?? entry?.offset ?? entry?.begin ?? entry?.s ?? entry?.ts);
        const dur = pickSeconds(entry?.dur ?? entry?.duration ?? entry?.d);
        const text = pickText(entry);
        if (start === undefined || !text) return null;
        return { start, text, dur };
      })
      .filter(Boolean) as CaptionItem[];
    if (mapped.length) return mapped;
  }

  const srt = findSrtString(raw);
  if (srt) return parseSrt(srt);
  return [];
}

function findCaptionArray(node: any, depth = 0): any[] | null {
  if (!node || depth > 3) return null;
  if (Array.isArray(node)) return node;
  const keys = ["subtitles", "captions", "items", "fragments", "segments", "events"];
  for (const key of keys) {
    const val = (node as any)[key];
    if (Array.isArray(val)) return val;
  }
  for (const key of ["data", "result", "response"]) {
    const nested = (node as any)[key];
    if (nested && nested !== node) {
      const found = findCaptionArray(nested, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function findSrtString(raw: any): string | null {
  const keys = ["srt", "subtitle", "subtitles", "captions", "caption"];
  for (const key of keys) {
    const val = (raw as any)[key];
    if (typeof val === "string" && val.includes("-->")) return val;
  }
  for (const key of ["data", "result", "response"]) {
    const val = (raw as any)[key];
    if (val && val !== raw) {
      const found = findSrtString(val);
      if (found) return found;
    }
  }
  return null;
}

function parseSrt(input: string): CaptionItem[] {
  const blocks = input.split(/\r?\n\r?\n/);
  const res: CaptionItem[] = [];
  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/);
    if (lines.length < 2) continue;
    const timeLine = lines[1].includes("-->") ? lines[1] : lines[0].includes("-->") ? lines[0] : "";
    if (!timeLine.includes("-->")) continue;
    const match = timeLine.match(/(\d{2}:\d{2}:\d{2}[,.\d]*)/);
    if (!match) continue;
    const start = parseTimecode(match[1]);
    if (start === undefined) continue;
    const text = lines.slice(lines[1].includes("-->") ? 2 : 1).join(" ").trim();
    if (!text) continue;
    res.push({ start, text });
  }
  return res;
}

function parseTimecode(tc: string): number | undefined {
  const parts = tc.replace(",", ".").split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return undefined;
  while (parts.length < 3) parts.unshift(0);
  const [h, m, s] = parts;
  return h * 3600 + m * 60 + s;
}

function pickSeconds(val: any): number | undefined {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    if (val.includes(":")) return parseTimecode(val);
    const num = Number(val);
    if (!Number.isNaN(num)) return num;
  }
  return undefined;
}

function pickText(entry: any): string {
  const keys = ["text", "caption", "line", "content", "body"];
  for (const key of keys) {
    const val = entry?.[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  if (typeof entry === "string") return entry.trim();
  return "";
}

function buildYoutubeUrl(base: string, seconds: number): string {
  const t = Math.max(0, Math.floor(seconds));
  try {
    const url = new URL(base);
    url.searchParams.set("t", `${t}s`);
    return url.toString();
  } catch {
    // If base isn't a full URL, fallback to watch URL
    return `https://www.youtube.com/watch?v=${encodeURIComponent(base)}&t=${t}s`;
  }
}

function trimText(text: string, maxLen = 110): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1)}…`;
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = `${m}`.padStart(2, "0");
  const ss = `${sec}`.padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss.padStart(2, "0")}`;
}

function formatTranscriptForDisplay(transcript: string): string {
  const normalized = normalizeTranscript(transcript);
  if (!normalized) return "";
  if (normalized.includes("-->")) {
    return formatSrtTranscript(normalized);
  }
  return formatLooseTranscript(normalized);
}

function splitLineByTimecode(line: string): string[] {
  const timecodeRegex = /(\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?)/g;
  const matches = [...line.matchAll(timecodeRegex)];
  if (matches.length === 0) return [line];
  if (matches[0].index !== 0) return [line];

  const segments: string[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const timecode = match[1];
    const start = (match.index ?? 0) + timecode.length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? line.length) : line.length;
    const rest = line.slice(start, end).replace(/^[\s\-–—|]+/, "").trim();
    segments.push(timecode);
    if (rest) segments.push(rest);
  }
  return segments;
}

function normalizeTranscript(input: string): string {
  let text = input.trim();
  if (text.includes("\\n")) {
    text = text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, " ");
  }
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function formatSrtTranscript(input: string): string {
  const blocks = input.split(/\n{2,}/);
  const output: string[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex === -1) {
      output.push(lines.join(" "));
      output.push("");
      continue;
    }
    const timeLine = lines[timeLineIndex];
    const textLines = lines.slice(timeLineIndex + 1).filter((line) => !/^\d+$/.test(line));
    const text = textLines.join(" ").trim();
    output.push(timeLine);
    if (text) output.push(text);
    output.push("");
  }
  return output.join("\n").trim();
}

function formatLooseTranscript(input: string): string {
  const lines = input.split("\n");
  const output: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      output.push("");
      continue;
    }
    if (/^\d+$/.test(trimmed)) {
      continue;
    }
    if (trimmed.includes("-->")) {
      output.push(trimmed);
      continue;
    }

    const parts = splitLineByTimecode(trimmed);
    output.push(...parts);
  }

  return output.join("\n");
}

function buildPdfHtml({ title, youtubeUrl, transcript }: PdfPayload): string {
  const safeTitle = escapeHtml(title);
  const safeUrl = escapeHtml(youtubeUrl);
  const safeTranscript = escapeHtml(transcript);
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      body { font-family: "Inter", "Segoe UI", Arial, sans-serif; margin: 32px; color: #0f172a; }
      h1 { font-size: 22px; margin: 0 0 6px; }
      .meta { font-size: 12px; color: #475569; margin-bottom: 16px; word-break: break-all; }
      pre { white-space: pre-wrap; font-family: "JetBrains Mono", "Courier New", monospace; font-size: 12px; line-height: 1.6; }
    </style>
  </head>
  <body>
    <h1>${safeTitle}</h1>
    <div class="meta">${safeUrl}</div>
    <pre>${safeTranscript}</pre>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 10% 20%, rgba(99,102,241,0.2), transparent 25%), #0b1220",
    color: "#e5e7eb",
    padding: "56px 20px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 760,
    background: "linear-gradient(145deg, #0f172a, #0b1220)",
    border: "1px solid #1f2937",
    borderRadius: 18,
    padding: 28,
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  title: { margin: 0, fontSize: 32, letterSpacing: -0.3 },
  lead: { margin: "4px 0 12px", color: "#cbd5e1", lineHeight: 1.6 },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: { display: "flex", flexDirection: "column", gap: 6, fontWeight: 600 },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#e5e7eb",
    fontSize: 15,
    outline: "none",
  },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  button: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #4f46e5",
    background: "#6366f1",
    color: "#e5e7eb",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontSize: 15,
  },
  secondary: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #1f2937",
    background: "rgba(255,255,255,0.04)",
    color: "#cbd5e1",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: { color: "#fca5a5", margin: "4px 0 0", fontSize: 14 },
  result: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    border: "1px solid #1f2937",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  resultRow: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  code: {
    background: "#111827",
    padding: "6px 8px",
    borderRadius: 10,
    fontSize: 13,
    border: "1px solid #1f2937",
    wordBreak: "break-all",
  },
  pre: {
    margin: "4px 0 0",
    padding: 12,
    borderRadius: 10,
    background: "#0b1220",
    color: "#e5e7eb",
    border: "1px solid #1f2937",
    whiteSpace: "pre-wrap",
    fontSize: 14,
    lineHeight: 1.6,
    maxHeight: 380,
    overflow: "auto",
  },
  summaryBox: {
    padding: 12,
    borderRadius: 10,
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.35)",
    color: "#e5e7eb",
    lineHeight: 1.6,
  },
  summaryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  summaryTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  summaryLoader: {
    fontSize: 12,
    color: "#93c5fd",
    background: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.35)",
    borderRadius: 999,
    padding: "2px 8px",
  },
  toggleGroup: { display: "flex", gap: 8, flexWrap: "wrap" },
  toggle: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #1f2937",
    background: "#0f172a",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 13,
    transition: "all 0.15s ease",
  },
  toggleActive: {
    border: "1px solid #4f46e5",
    background: "rgba(99,102,241,0.15)",
    color: "#c7d2fe",
  },
  linkButton: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #334155",
    background: "rgba(99,102,241,0.15)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: 600,
  },
  labelText: { color: "#9ca3af", fontSize: 13, margin: 0 },
  transcriptHeader: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  meta: { margin: 0, color: "#cbd5e1", fontSize: 14 },
  hint: { margin: "4px 0 0", color: "#94a3b8", fontSize: 13 },
  chapters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 8,
    marginTop: 6,
  },
  chapterChip: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 12,
    background: "#0b1220",
    border: "1px solid #1f2937",
    color: "#e5e7eb",
    textDecoration: "none",
    transition: "all 0.15s ease",
  },
  chapterTime: {
    fontWeight: 700,
    fontSize: 13,
    color: "#c7d2fe",
    minWidth: 54,
  },
  chapterTitle: { fontSize: 13, color: "#e5e7eb", lineHeight: 1.4, flex: 1 },
  questionContainer: {
    borderRadius: 12,
    padding: 12,
    background: "#0f172a",
    marginTop: 8,
  },
  questionText: {
    fontSize: 15,
    marginBottom: 8,
    color: "#e5e7eb",
  },
  option: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  optionInput: {
    accentColor: "#4f46e5",
  },
  optionLabel: {
    fontSize: 14,
    color: "#e5e7eb",
    cursor: "pointer",
  },
  answerButton: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #4f46e5",
    background: "#6366f1",
    color: "#e5e7eb",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
  correctAnswer: {
    fontSize: 13,
    color: "#22c55e",
    marginTop: 6,
  },
  incorrectAnswer: {
    fontSize: 13,
    color: "#ef4444",
    marginTop: 6,
  },
};
