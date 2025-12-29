type FetchJsonOpts = {
  host: string;
  path: string;
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export async function rapidApiJson<T>(opts: FetchJsonOpts): Promise<T> {
  const url = new URL(`https://${opts.host}${opts.path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        "content-type": "application/json",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
        "x-rapidapi-host": opts.host,
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err: any) {
    throw new Error(`RapidAPI fetch failed (${opts.host}${opts.path}): ${err?.message ?? err}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`RapidAPI ${opts.host}${opts.path} failed: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}
