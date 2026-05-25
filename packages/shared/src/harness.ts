export const LHF_SPINES = [
  "truth_graph",
  "run_spine",
  "capability_gate",
  "context_cost_spine",
  "proof_spine",
  "admin_cortex",
] as const;

export type LhfSpine = (typeof LHF_SPINES)[number];

export interface LhfSourceRef {
  path: string;
  line?: number;
}

export interface LhfErrorEnvelope {
  code: string;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  retryable: boolean;
  correlationId: string;
  harnessNodeId?: string;
  userSafeMessage: string;
}

export interface LhfTicketContract {
  ticket: string;
  primarySpine: LhfSpine;
  secondarySpines: LhfSpine[];
  consolidatesOrReplaces: string;
  owningSpec: string;
  proof: string[];
  rollback: string;
  cleanupTarget: string;
}

export function isLhfSpine(value: string): value is LhfSpine {
  return (LHF_SPINES as readonly string[]).includes(value);
}

