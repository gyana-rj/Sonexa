import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Proxies every request to the Render service and serves the maintenance page
// when Render is suspended, unreachable or too slow to answer.
const ORIGIN_URL = process.env.ORIGIN_URL ?? "https://sonexa-web.onrender.com";
// Free Render instances take ~30-60s to wake from sleep.
const ORIGIN_TIMEOUT_MS = Number(process.env.ORIGIN_TIMEOUT_MS) || 70000;
const PATH_PARAM = "__gateway_path";
const RETRY_AFTER_SECONDS = "300";

// Hop-by-hop headers that must not be forwarded, plus ones fetch recomputes.
const DROP_REQUEST_HEADERS = ["host", "connection", "keep-alive", "transfer-encoding", "upgrade", "content-length"];
// fetch decompresses bodies, so the upstream encoding and length no longer apply.
const DROP_RESPONSE_HEADERS = ["content-encoding", "content-length", "transfer-encoding", "connection", "keep-alive"];

let maintenanceHtml;

export async function handle(request) {
  if (process.env.FORCE_MAINTENANCE === "true") {
    return maintenance(request);
  }

  const incoming = new URL(request.url);
  const origin = new URL(ORIGIN_URL);
  const target = new URL(`/${incoming.searchParams.get(PATH_PARAM) ?? ""}`, origin);
  for (const [key, value] of incoming.searchParams) {
    if (key !== PATH_PARAM) target.searchParams.append(key, value);
  }

  const publicHost = request.headers.get("x-forwarded-host") ?? incoming.host;
  const headers = new Headers(request.headers);
  for (const name of DROP_REQUEST_HEADERS) headers.delete(name);
  headers.set("x-forwarded-host", publicHost);
  headers.set("x-forwarded-proto", "https");

  const hasBody = !["GET", "HEAD"].includes(request.method);
  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      duplex: hasBody ? "half" : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(ORIGIN_TIMEOUT_MS),
    });
  } catch {
    return maintenance(request);
  }

  if (isOriginDown(upstream)) {
    return maintenance(request);
  }

  const responseHeaders = new Headers(upstream.headers);
  for (const name of DROP_RESPONSE_HEADERS) responseHeaders.delete(name);

  // Keep users on the custom domain when Render issues absolute redirects.
  const location = upstream.headers.get("location");
  if (location) {
    const redirect = new URL(location, target);
    if (redirect.host === origin.host) {
      responseHeaders.set("location", `https://${publicHost}${redirect.pathname}${redirect.search}${redirect.hash}`);
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;

// Render answers for suspended or missing services itself, tagging the
// response with x-render-routing; 502-504 mean the instance never answered.
function isOriginDown(response) {
  const routing = response.headers.get("x-render-routing") ?? "";
  if (routing.startsWith("suspend") || routing === "no-server") {
    return true;
  }
  return response.status >= 502 && response.status <= 504;
}

function maintenance(request) {
  const wantsHtml = (request.headers.get("accept") ?? "").includes("text/html");
  if (!wantsHtml) {
    return Response.json(
      { error: "Sonexa is under maintenance. Please try again later." },
      { status: 503, headers: { "cache-control": "no-store", "retry-after": RETRY_AFTER_SECONDS } },
    );
  }
  maintenanceHtml ??= loadMaintenanceHtml();
  return new Response(request.method === "HEAD" ? null : maintenanceHtml, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": RETRY_AFTER_SECONDS,
    },
  });
}

// Vercel keeps the repo layout inside the function bundle when the project's
// root directory is a subfolder of a monorepo (the handler runs from
// /var/task/infra/maintenance-gateway/api while process.cwd() is /var/task),
// so resolve the page relative to this file first and only then from cwd.
const MAINTENANCE_HTML_PATHS = [
  fileURLToPath(new URL("../maintenance.html", import.meta.url)),
  join(process.cwd(), "maintenance.html"),
];

const FALLBACK_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="60"><title>Sonexa is under maintenance</title></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:4rem 1rem">
<h1>Sonexa is under maintenance</h1><p>We'll be back shortly. This page refreshes every minute.</p>
</body></html>`;

function loadMaintenanceHtml() {
  for (const path of MAINTENANCE_HTML_PATHS) {
    try {
      return readFileSync(path, "utf8");
    } catch {
      // Try the next location.
    }
  }
  return FALLBACK_HTML;
}
