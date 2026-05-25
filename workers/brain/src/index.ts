export interface AgentRequest {
  requestId: string;
  userId: string;
  channel: "api" | "web" | "job";
  text: string;
}

export interface AgentRun {
  id: string;
  requestId: string;
  status: "received" | "running" | "complete" | "failed";
  createdAt: string;
}

export function createAgentRun(request: AgentRequest): AgentRun {
  return {
    id: crypto.randomUUID(),
    requestId: request.requestId,
    status: "received",
    createdAt: new Date().toISOString(),
  };
}

