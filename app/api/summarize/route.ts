import { z } from "zod";
import { summarizeTranscript } from "@/lib/gemini";

export const runtime = "nodejs";

const Body = z.object({
  transcript: z.string().min(1),
  detail: z.enum(["short", "medium", "long"]).optional(),
});

export async function POST(req: Request) {
  try {
    const { transcript, detail } = Body.parse(await req.json());
    const summary = await summarizeTranscript(transcript, detail ?? "short");
    return Response.json({ summary });
  } catch (err: any) {
    const message = err?.message ?? "Unexpected error";
    const status = err instanceof z.ZodError ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
