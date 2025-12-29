import { z } from "zod";
import { generateQuestions } from "@/lib/gemini";

export const runtime = "nodejs";

const Body = z.object({
  transcript: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const { transcript } = Body.parse(await req.json());
    const questions = await generateQuestions(transcript);
    return Response.json({ questions });
  } catch (err: any) {
    const message = err?.message ?? "Unexpected error";
    const status = err instanceof z.ZodError ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
