"use client";

import { useState, type FormEvent } from "react";
import { Question } from "@/lib/gemini";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link2, Sparkles, Loader2 } from "lucide-react";

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
    <main className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
            <span className="block">Создавайте</span>
            <span className="block">интерактивные</span>
            <span className="block">
              викторины <span className="text-red-600">на основе</span>
            </span>
            <span className="block text-red-600">YouTube видео</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Превратите любое видео в увлекательное обучающее путешествие с автоматически генерируемыми вопросами и
            интерактивными викторинами
          </p>
        </div>

        <Card className="shadow-2xl border-2 overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-secondary/50 to-background border-b">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Link2 className="w-6 h-6 text-primary" />
              Вставьте ссылку на видео
            </CardTitle>
            <CardDescription className="text-base">Поддерживаются все публичные видео YouTube</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="youtube-url" className="text-base font-medium">
                  YouTube URL
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="youtube-url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onFocus={() => { if (youtubeUrl === exampleUrl) setYoutubeUrl(''); }}
                    className="h-14 text-lg rounded-xl"
                    required
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="px-8 h-14 rounded-xl whitespace-nowrap"
                    disabled={isBusy || youtubeUrl.trim().length === 0}
                  >
                    {transcriptLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Запрашиваю...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Создать
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <p className="text-destructive">Ошибка: {error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <>
            {/* Шаг 2: Пересказ */}
            <div className="text-center mb-8">
              <Badge variant="outline" className="text-sm px-4 py-1">
                Шаг 2
              </Badge>
            </div>

            <Card className="shadow-2xl border-2 overflow-hidden mb-8">
              <CardHeader className="bg-gradient-to-br from-secondary/50 to-background border-b">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Краткое описание
                </CardTitle>
                <CardDescription className="text-base">AI-генерированный пересказ видео</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Детализация (Gemini 2.5 Flash Lite)
                  </p>
                  <div className="flex gap-2">
                    {(Object.keys(detailLabels) as DetailLevel[]).map((key) => (
                      <Button
                        key={key}
                        variant={detail === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleDetailChange(key)}
                        disabled={isBusy}
                      >
                        {detailLabels[key]}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="bg-secondary/20 border border-secondary/30 rounded-lg p-6 text-foreground">
                  {summaryLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Обновляю описание...
                    </div>
                  ) : (
                    result?.summary || "—"
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={handleExportPdf}
                  disabled={!result?.summary || summaryLoading}
                  className="mt-4"
                >
                  Экспорт в PDF
                </Button>
              </CardContent>
            </Card>

            {/* Шаг 3: Викторина */}
            {result?.transcript && (
              <>
                <div className="text-center mb-8">
                  <Badge variant="outline" className="text-sm px-4 py-1">
                    Шаг 3
                  </Badge>
                </div>

                <Card className="shadow-2xl border-2 overflow-hidden mb-8">
                  <CardHeader className="bg-gradient-to-br from-secondary/50 to-background border-b">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Sparkles className="w-6 h-6 text-primary" />
                      Контрольные вопросы
                    </CardTitle>
                    <CardDescription className="text-base">Проверьте свои знания</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    {questions && questions.length > 0 ? (
                      <div className="space-y-6">
                        {questions.map((question, idx) => {
                          const state = questionStates[idx];
                          return (
                            <div
                              key={idx}
                              className={`border-2 rounded-lg p-6 transition-colors ${
                                state.answered
                                  ? state.isCorrect
                                    ? 'border-green-500 bg-green-500/10'
                                    : 'border-red-500 bg-red-500/10'
                                  : 'border-border bg-card'
                              }`}
                            >
                              <p className="text-lg font-medium mb-4 text-card-foreground">{question.question}</p>
                              <div className="space-y-3">
                                {question.options.map((option, optIdx) => (
                                  <label key={optIdx} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`question-${idx}`}
                                      value={optIdx}
                                      checked={state.selected === optIdx}
                                      onChange={() => handleQuestionSelect(idx, optIdx)}
                                      disabled={state.answered}
                                      className="w-4 h-4 text-primary"
                                    />
                                    <span className="text-card-foreground">{option}</span>
                                  </label>
                                ))}
                              </div>
                              {!state.answered && state.selected !== null && (
                                <Button
                                  onClick={() => handleAnswerSubmit(idx)}
                                  className="mt-4"
                                >
                                  Ответить
                                </Button>
                              )}
                              {state.answered && (
                                <p className={`mt-4 text-sm font-medium ${state.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                  {state.isCorrect ? 'Верно!' : `Неверно. Правильный ответ: ${question.options[question.correct]}`}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Button
                          onClick={() => fetchQuestions(result.transcript)}
                          disabled={questionsLoading}
                          size="lg"
                        >
                          {questionsLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Генерирую вопросы...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-2" />
                              Сгенерировать викторину
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Шаг 4: Транскрипт */}
            <div className="text-center mb-8">
              <Badge variant="outline" className="text-sm px-4 py-1">
                Шаг 4
              </Badge>
            </div>

            <Card className="shadow-2xl border-2 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-secondary/50 to-background border-b">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Link2 className="w-6 h-6 text-primary" />
                  Полная транскрипция
                </CardTitle>
                <CardDescription className="text-base">Исходный текст видео</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <pre className="bg-secondary/10 border border-secondary/20 rounded-lg p-6 text-sm overflow-auto max-h-96 whitespace-pre-wrap text-card-foreground">
                  {result.transcript ? formatTranscriptForDisplay(result.transcript) : "—"}
                </pre>
                <p className="text-xs text-muted-foreground mt-4">
                  API: youtube-captions-transcript-subtitles-video-combiner → gemini-2.5-flash-lite
                </p>
              </CardContent>
            </Card>

            {/* Главы */}
            {chapters.length > 0 && (
              <Card className="shadow-2xl border-2 overflow-hidden mt-8">
                <CardHeader className="bg-gradient-to-br from-secondary/50 to-background border-b">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Link2 className="w-6 h-6 text-primary" />
                    Главы (кликабельные таймкоды)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chapters.map((ch, idx) => (
                      <a
                        key={`${ch.start}-${idx}`}
                        href={ch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-secondary/20 border border-secondary/30 rounded-lg hover:bg-secondary/30 transition-colors text-card-foreground"
                      >
                        <span className="font-mono text-sm text-primary font-semibold min-w-[54px]">
                          {formatClock(ch.start)}
                        </span>
                        <span className="text-sm">{ch.title}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
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
