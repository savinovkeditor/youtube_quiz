import { rapidApiJson } from "@/lib/rapidapi";

export type TranscriptResult = { transcript: string; raw: any };

// RapidAPI helper for fetching transcript/captions JSON.
// Uses youtube-captions-transcript-subtitles-video-combiner (DataFanatic).
export async function fetchTranscript(youtubeUrl: string): Promise<TranscriptResult> {
  const host = process.env.RAPIDAPI_YT_HOST || "youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com";
  const path =
    process.env.RAPIDAPI_YT_PATH ||
    `/download-all/${encodeURIComponent(pickVideoId(youtubeUrl))}`; // default path for the API

  const data = await rapidApiJson<any>({
    host,
    path,
    query: {
      format_subtitle: "srt",
      format_answer: "json",
    },
  });

  const transcript = pickTranscript(data);
  return { transcript, raw: data };
}

function pickVideoId(url: string): string {
  // Accept raw ID or full URL.
  const idRegex = /(?:v=|youtu\.be\/|youtube\.com\/shorts\/|embed\/)([a-zA-Z0-9_-]{6,})/;
  const match = url.match(idRegex);
  if (match?.[1]) return match[1];
  // Fallback: take last path segment.
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  } catch {
    // not a URL, maybe already ID
  }
  return url;
}

function pickTranscript(payload: any): string {
  if (!payload) return "";
  const candidates = ["transcript", "caption", "captions", "text", "answer"];
  for (const key of candidates) {
    const val = (payload as any)[key];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (Array.isArray(val)) {
      const joined = val
        .map((x) => {
          if (typeof x === "string") return x;
          if (x && typeof x.text === "string") return x.text;
          if (x && typeof x.caption === "string") return x.caption;
          return "";
        })
        .filter(Boolean)
        .join("\n");
      if (joined.trim()) return joined;
    }
  }

  // Sometimes payload holds subtitles under payload.data or payload.result
  const nested = payload.data || payload.result;
  if (nested && nested !== payload) {
    const nestedTranscript = pickTranscript(nested);
    if (nestedTranscript) return nestedTranscript;
  }

  // Fallback: stringified payload preview
  try {
    const str = JSON.stringify(payload, null, 2);
    return str.length > 5000 ? `${str.slice(0, 5000)}\n...` : str;
  } catch {
    return "";
  }
}
