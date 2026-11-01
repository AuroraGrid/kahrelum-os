export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      Vary: "Cookie, Cf-Access-Jwt-Assertion",
    },
  });
export async function getJSON(
  url,
  { headers = {}, fetcher = fetch, timeout = 8000 } = {},
) {
  const r = await fetcher(url, {
    method: "GET",
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(timeout),
  });
  if (!r.ok)
    throw new ApiError(
      502,
      "UPSTREAM_ERROR",
      `Source returned HTTP ${r.status}`,
    );
  if (!r.headers.get("content-type")?.includes("json"))
    throw new ApiError(502, "UPSTREAM_FORMAT", "Source did not return JSON");
  return {
    data: await r.json(),
    modifiedAt: r.headers.get("last-modified"),
    fetchedAt: new Date().toISOString(),
  };
}
export function selection(url) {
  const season = Number(url.searchParams.get("season") || 2026),
    week = Number(url.searchParams.get("week") || 8),
    type = url.searchParams.get("type") || "REG";
  if (
    !Number.isInteger(season) ||
    season < 2000 ||
    season > 2100 ||
    !Number.isInteger(week) ||
    week < 1 ||
    week > 23 ||
    !["PRE", "REG", "PST"].includes(type)
  )
    throw new ApiError(400, "INVALID_SELECTION", "Invalid season or week");
  return { season, week, type };
}
