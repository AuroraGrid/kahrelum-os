import { ApiError, getJSON } from "./http.mjs";
const keys = new Map();
const decode = (s) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (x) =>
    x.charCodeAt(0),
  );
export function authConfigured(env) {
  return (
    /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(
      env.ACCESS_ISSUER || "",
    ) && Boolean(env.ACCESS_AUD)
  );
}
export async function verifyIdentity(request, env, fetcher = fetch) {
  if (!authConfigured(env))
    throw new ApiError(
      503,
      "AUTH_NOT_CONFIGURED",
      "Private fantasy sign-in is not configured",
    );
  const token =
    request.headers.get("Cf-Access-Jwt-Assertion") ||
    request.headers
      .get("Cookie")
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("CF_Authorization="))
      ?.slice(17);
  if (!token || token.length > 16000)
    throw new ApiError(
      401,
      "SIGN_IN_REQUIRED",
      "Sign in to view private fantasy leagues",
    );
  try {
    const [header, body, signature, ...extra] = token.split(".");
    if (extra.length) throw Error();
    const h = JSON.parse(new TextDecoder().decode(decode(header))),
      p = JSON.parse(new TextDecoder().decode(decode(body)));
    const now = Date.now() / 1000;
    if (
      h.alg !== "RS256" ||
      !h.kid ||
      p.iss !== env.ACCESS_ISSUER ||
      !Array.isArray(p.aud) ||
      !p.aud.includes(env.ACCESS_AUD) ||
      !Number.isFinite(p.exp) ||
      p.exp <= now ||
      !Number.isFinite(p.iat) ||
      p.iat > now + 30 ||
      p.nbf > now + 30 ||
      typeof p.sub !== "string" ||
      !p.sub
    )
      throw Error();
    let entry = keys.get(env.ACCESS_ISSUER);
    if (!entry || entry.expires < Date.now()) {
      const r = await getJSON(`${env.ACCESS_ISSUER}/cdn-cgi/access/certs`, {
        fetcher,
      });
      entry = { keys: r.data.keys || [], expires: Date.now() + 300000 };
      keys.set(env.ACCESS_ISSUER, entry);
    }
    const jwk = entry.keys.find((k) => k.kid === h.kid && k.kty === "RSA");
    if (!jwk) throw Error();
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    if (
      !(await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        key,
        decode(signature),
        new TextEncoder().encode(`${header}.${body}`),
      ))
    )
      throw Error();
    return { sub: p.sub };
  } catch {
    throw new ApiError(401, "INVALID_SESSION", "Session could not be verified");
  }
}
export function connectionsFor(env, identity) {
  let all;
  try {
    all = JSON.parse(env.FANTASY_CONNECTIONS || "{}");
  } catch {
    throw new ApiError(
      503,
      "CONNECTION_CONFIG_ERROR",
      "Fantasy connection configuration is invalid",
    );
  }
  return Object.hasOwn(all, identity.sub) && Array.isArray(all[identity.sub])
    ? all[identity.sub]
    : [];
}
