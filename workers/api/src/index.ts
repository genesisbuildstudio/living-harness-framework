import { correlationIdFromRequest, createLhfErrorEnvelope, serializeRuntimeEvent } from "@lhf/shared";

export interface Env {
  LHF_ENV: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
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

interface DemoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

async function fetchDemoItems(env: Env): Promise<{ dataMode: "supabase" | "sample"; items: DemoItem[] }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      dataMode: "sample",
      items: [{
        id: "sample-1",
        title: "Wire the first LHF proof path",
        completed: false,
        createdAt: new Date(0).toISOString(),
      }],
    };
  }

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/lhf_demo_items?select=id,title,completed,created_at&order=created_at.desc&limit=10`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      accept: "application/json",
    },
  });

  if (!response.ok) throw new Error(`Supabase demo query failed with ${response.status}`);
  const rows = await response.json() as Array<{ id: string; title: string; completed: boolean; created_at: string }>;
  return {
    dataMode: "supabase",
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      completed: row.completed,
      createdAt: row.created_at,
    })),
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const correlationId = correlationIdFromRequest(request);

    if (url.pathname === "/healthz") {
      return json({
        ok: true,
        service: "lhf-api",
        env: env.LHF_ENV,
        correlationId,
      });
    }

    if (url.pathname === "/demo/items") {
      try {
        const result = await fetchDemoItems(env);
        return json({ ok: true, correlationId, ...result });
      } catch (error) {
        const envelope = createLhfErrorEnvelope({
          code: "DEMO_ITEMS_UNAVAILABLE",
          message: error instanceof Error ? error.message : "Unknown demo item error",
          severity: "error",
          retryable: true,
          correlationId,
          harnessNodeId: "worker:api",
        });
        ctx.waitUntil(Promise.resolve(console.error(serializeRuntimeEvent({
          eventType: "demo_items_failed",
          severity: "error",
          correlationId,
          harnessNodeId: "worker:api",
          metadata: { error: envelope },
        }))));
        return json({ error: envelope }, { status: 502 });
      }
    }

    const envelope = createLhfErrorEnvelope({
      code: "ROUTE_NOT_FOUND",
      message: `No route for ${url.pathname}`,
      severity: "warning",
      retryable: false,
      correlationId,
      harnessNodeId: "worker:api",
    });

    ctx.waitUntil(Promise.resolve(console.warn(serializeRuntimeEvent({
      eventType: "route_not_found",
      severity: "warning",
      correlationId,
      harnessNodeId: "worker:api",
      metadata: { path: url.pathname, error: envelope },
    }))));
    return json({ error: envelope }, { status: 404 });
  },
};
