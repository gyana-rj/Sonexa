import maintenanceHtml from "./maintenance.html";

const RETRY_AFTER_SECONDS = 300;

export default {
  async fetch(request, env) {
    if (env.FORCE_MAINTENANCE === "true") {
      return maintenance(request);
    }

    const origin = new URL(env.ORIGIN_URL);
    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, origin);

    const headers = new Headers(request.headers);
    headers.set("X-Forwarded-Host", incoming.host);
    headers.set("X-Forwarded-Proto", incoming.protocol.replace(":", ""));

    let response;
    try {
      response = await fetch(target, {
        method: request.method,
        headers,
        body: request.body,
        redirect: "manual",
        signal: AbortSignal.timeout(Number(env.ORIGIN_TIMEOUT_MS) || 60000),
      });
    } catch {
      return maintenance(request);
    }

    if (isOriginDown(response)) {
      return maintenance(request);
    }

    // Keep users on the custom domain when Render issues absolute redirects.
    const location = response.headers.get("Location");
    if (location) {
      const redirect = new URL(location, target);
      if (redirect.host === origin.host) {
        const rewritten = new URL(redirect.pathname + redirect.search + redirect.hash, incoming.origin);
        response = new Response(response.body, response);
        response.headers.set("Location", rewritten.toString());
      }
    }

    return response;
  },
};

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
  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Retry-After": String(RETRY_AFTER_SECONDS),
  };
  const wantsHtml = (request.headers.get("Accept") ?? "").includes("text/html");
  if (!wantsHtml) {
    return Response.json(
      { error: "Sonexa is under maintenance. Please try again later." },
      { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": headers["Retry-After"] } },
    );
  }
  return new Response(request.method === "HEAD" ? null : maintenanceHtml, {
    status: 503,
    headers,
  });
}
