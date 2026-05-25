import type { LhfErrorEnvelope } from "@lhf/shared";

export interface Env {
  LHF_ENV: string;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });
}

function errorEnvelope(input: {
  code: string;
  message: string;
  severity: LhfErrorEnvelope["severity"];
  retryable: boolean;
  correlationId: string;
}): LhfErrorEnvelope {
  return {
    ...input,
    userSafeMessage: "The request could not be completed safely.",
    harnessNodeId: "worker:api",
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const correlationId = request.headers.get("x-request-id") ?? crypto.randomUUID();

    if (url.pathname === "/healthz") {
      return json({
        ok: true,
        service: "lhf-api",
        env: env.LHF_ENV,
        correlationId,
      });
    }

    const envelope = errorEnvelope({
      code: "ROUTE_NOT_FOUND",
      message: `No route for ${url.pathname}`,
      severity: "warning",
      retryable: false,
      correlationId,
    });

    ctx.waitUntil(Promise.resolve(console.warn(JSON.stringify(envelope))));
    return json({ error: envelope }, { status: 404 });
  },
};

