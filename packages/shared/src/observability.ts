import type { LhfErrorEnvelope } from "./harness";

const SENSITIVE_KEY_PATTERN = /(secret|token|password|private|service[_-]?role|authorization|cookie|apikey|api[_-]?key)/i;

export interface LhfRuntimeEvent {
  eventType: string;
  correlationId: string;
  severity: "info" | "warning" | "error" | "critical";
  harnessNodeId: string;
  metadata?: Record<string, unknown>;
}

export interface LhfErrorInput {
  code: string;
  message: string;
  severity: LhfErrorEnvelope["severity"];
  retryable: boolean;
  correlationId: string;
  harnessNodeId: string;
  userSafeMessage?: string;
}

export function correlationIdFromRequest(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function createLhfErrorEnvelope(input: LhfErrorInput): LhfErrorEnvelope {
  return {
    code: input.code,
    message: input.message,
    severity: input.severity,
    retryable: input.retryable,
    correlationId: input.correlationId,
    harnessNodeId: input.harnessNodeId,
    userSafeMessage: input.userSafeMessage ?? "The request could not be completed safely.",
  };
}

export function redactTelemetryValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactTelemetryValue(item));
  if (!value || typeof value !== "object") return value;

  const redacted: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    redacted[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : redactTelemetryValue(item);
  }
  return redacted;
}

export function serializeRuntimeEvent(event: LhfRuntimeEvent): string {
  return JSON.stringify(redactTelemetryValue({
    schemaVersion: "lhf-runtime-event/v1",
    createdAt: new Date().toISOString(),
    ...event,
  }));
}
