import { z } from "zod";

/**
 * JARVIS Business OS - Core Contracts & Schemas
 * Defined in docs/05_DATA_AND_API.md and docs/04_SECURITY.md
 */

// Data Provenance & Operational Modes
export const DataModeSchema = z.enum(["DEMO", "READ_ONLY", "SUPERVISED", "LIMITED_AUTOMATION"]);
export type DataMode = z.infer<typeof DataModeSchema>;

export const DataProvenanceSchema = z.enum(["DEMO", "LIVE_VERIFIED", "STALE", "UNKNOWN"]);
export type DataProvenance = z.infer<typeof DataProvenanceSchema>;

export const CoreStateSchema = z.enum([
  "IDLE",
  "LISTENING",
  "THINKING",
  "SPEAKING",
  "EXECUTING",
  "AWAITING_APPROVAL",
  "OFFLINE",
  "ERROR",
]);
export type CoreState = z.infer<typeof CoreStateSchema>;

export const UIModeSchema = z.enum(["PRESENCE", "BRIEFING", "DASHBOARD", "APPROVAL_CENTER"]);
export type UIMode = z.infer<typeof UIModeSchema>;

// Source Event Envelope
export const SourceEventEnvelopeSchema = z.object({
  event_id: z.string(),
  source: z.string(),
  type: z.string(),
  mode: DataModeSchema.default("DEMO"),
  occurred_at: z.string(),
  received_at: z.string(),
  source_freshness: DataProvenanceSchema.default("DEMO"),
  correlation_id: z.string(),
  data: z.record(z.unknown()),
});
export type SourceEventEnvelope = z.infer<typeof SourceEventEnvelopeSchema>;

// Morning Briefing Structure
export const BriefingItemSchema = z.object({
  id: z.string(),
  headline: z.string(),
  source: z.string(),
  confidence: z.string(),
});
export type BriefingItem = z.infer<typeof BriefingItemSchema>;

export const BriefingSectionSchema = z.object({
  kind: z.enum(["anomalies", "schedule", "pending", "suggestions"]),
  title: z.string(),
  items: z.array(BriefingItemSchema),
  sources: z.array(z.string()),
});
export type BriefingSection = z.infer<typeof BriefingSectionSchema>;

export const MorningBriefingSchema = z.object({
  date: z.string(),
  timezone: z.string(),
  data_mode: DataModeSchema,
  generated_at: z.string(),
  disclaimer: z.string(),
  sections: z.array(BriefingSectionSchema),
});
export type MorningBriefing = z.infer<typeof MorningBriefingSchema>;

// Approvals Contract
export const ApprovalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "expired",
  "cancelled",
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const ApprovalItemSchema = z.object({
  intent_id: z.string(),
  action_type: z.string(),
  account: z.string(),
  target_id: z.string(),
  title: z.string(),
  description: z.string(),
  amount_cap_minor: z.number(),
  currency: z.string(),
  expires_at: z.string(),
  status: ApprovalStatusSchema,
  reason: z.string(),
  risk: z.enum(["low", "medium", "high"]),
  reviewed_by: z.string().optional(),
  reviewed_at: z.string().optional(),
  execution_ref: z.string().optional(),
});
export type ApprovalItem = z.infer<typeof ApprovalItemSchema>;

// Business Overview Summary
export const BusinessSummarySchema = z.object({
  order_revenue_minor: z.number(),
  order_revenue_currency: z.string(),
  example_orders_count: z.number(),
  mix_inquiries_count: z.number(),
  shipping_alerts_count: z.number(),
  net_profit_status: z.enum(["UNKNOWN", "ESTIMATED", "CALCULATED"]),
  last_verified_sync: z.string(),
  provenance: DataProvenanceSchema,
});
export type BusinessSummary = z.infer<typeof BusinessSummarySchema>;

// Connected Service Status
export const ConnectionInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  connected: z.boolean(),
  statusText: z.string(),
});
export type ConnectionInfo = z.infer<typeof ConnectionInfoSchema>;

// Agent Status
export const AgentInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  statusText: z.string(),
  idle: z.boolean(),
});
export type AgentInfo = z.infer<typeof AgentInfoSchema>;

// System Status Contract
export const SystemStatusSchema = z.object({
  mode: DataModeSchema,
  encryption_configured: z.boolean(),
  build_version: z.string(),
  live_operations_enabled: z.boolean(),
  connections: z.array(ConnectionInfoSchema),
  agents: z.array(AgentInfoSchema),
  model_requests_count: z.number(),
});
export type SystemStatus = z.infer<typeof SystemStatusSchema>;
