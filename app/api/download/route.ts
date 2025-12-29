import { z } from "zod";
import { fetchTranscript } from "@/lib/pipeline";
import { summarizeTranscript } from "@/lib/gemini";

export const runtime = "nodejs";

const Body = z.object({
  youtubeUrl: z.string().url(),
  detail: z.enum(["short", "medium", "long"]).optional(),
});

export async function POST(req: Request) {
  try {
    const { youtubeUrl, detail } = Body.parse(await req.json());
    const transcriptData = await fetchTranscript(youtubeUrl);
    const summary = await summarizeTranscript(transcriptData.transcript, detail ?? "short");
    return Response.json({ ...transcriptData, summary });
  } catch (err: any) {
    const message = err?.message ?? "Unexpected error";
    const status = err instanceof z.ZodError ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
