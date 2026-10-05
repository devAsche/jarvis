import type {
  MorningBriefing,
  SourceEventEnvelope,
  ApprovalItem,
  BusinessSummary,
  SystemStatus,
} from "../contracts/index.ts";

export const initialBriefing: MorningBriefing = {
  date: "2026-09-28",
  timezone: "Asia/Tokyo",
  data_mode: "DEMO",
  generated_at: "2026-09-28T00:30:00+09:00",
  disclaimer: "DEMO ONLY. Sample data; not connected to any real business account.",
  sections: [
    {
      kind: "anomalies",
      title: "Past 24 hours",
      items: [
        {
          id: "demo_shipping_alert",
          headline: "One sample order may exceed its shipping estimate",
          source: "fixture.shopify",
          confidence: "demo",
        },
      ],
      sources: ["fixture.shopify"],
    },
    {
      kind: "schedule",
      title: "Today",
      items: [
        {
          id: "demo_focus",
          headline: "A two-hour focus block is available in the demo calendar",
          source: "fixture.calendar",
          confidence: "demo",
        },
      ],
      sources: ["fixture.calendar"],
    },
    {
      kind: "pending",
      title: "Pending",
      items: [
        {
          id: "demo_mix",
          headline: "Two sample MIX inquiries await draft replies",
          source: "fixture.gmail",
          confidence: "demo",
        },
      ],
      sources: ["fixture.gmail"],
    },
    {
      kind: "suggestions",
      title: "Deep work",
      items: [
        {
          id: "demo_deepwork",
          headline: "Review the product page before planning additional ad experiments",
          source: "demo-rule",
          confidence: "demo",
        },
      ],
      sources: ["demo-rule"],
    },
  ],
};

export const initialEvents: SourceEventEnvelope[] = [
  {
    event_id: "demo_001",
    source: "fixture.shopify",
    type: "commerce.order.paid",
    mode: "DEMO",
    occurred_at: "2026-09-28T00:00:00+09:00",
    received_at: "2026-09-28T00:00:02+09:00",
    source_freshness: "DEMO",
    correlation_id: "demo-order-001",
    data: {
      order_id: "demo-order-001",
      amount_minor: 4900,
      currency: "JPY",
      estimated_shipping_minor: 900,
      quoted_shipping_minor: 1550,
    },
  },
  {
    event_id: "demo_004",
    source: "fixture.gmail",
    type: "creative.mix.lead",
    mode: "DEMO",
    occurred_at: "2026-09-28T00:02:00+09:00",
    received_at: "2026-09-28T00:02:02+09:00",
    source_freshness: "DEMO",
    correlation_id: "demo-mix-002",
    data: { request_id: "demo-mix-002", attachments_complete: false },
  },
  {
    event_id: "demo_005",
    source: "fixture.calendar",
    type: "calendar.event.upcoming",
    mode: "DEMO",
    occurred_at: "2026-09-28T00:03:00+09:00",
    received_at: "2026-09-28T00:03:02+09:00",
    source_freshness: "DEMO",
    correlation_id: "demo-calendar-1",
    data: { starts_at: "2026-09-29T14:00:00+09:00", summary: "ダミーの作業予定" },
  },
  {
    event_id: "demo_002",
    source: "fixture.gmail",
    type: "creative.mix.lead",
    mode: "DEMO",
    occurred_at: "2026-09-28T00:01:00+09:00",
    received_at: "2026-09-28T00:01:02+09:00",
    source_freshness: "DEMO",
    correlation_id: "demo-mix-001",
    data: {
      request_id: "demo-mix-001",
      attachments_complete: false,
    },
  },
  {
    event_id: "demo_003",
    source: "fixture.system",
    type: "system.simulation.ready",
    mode: "DEMO",
    occurred_at: "2026-09-28T00:05:00+09:00",
    received_at: "2026-09-28T00:05:01+09:00",
    source_freshness: "DEMO",
    correlation_id: "demo-sys-001",
    data: {
      message: "Simulation engine initialized in offline demo mode",
    },
  },
];

export const initialApprovals: ApprovalItem[] = [
  {
    intent_id: "demo-intent-001",
    action_type: "demo.review_shipping",
    account: "Shopify US Pet Store",
    target_id: "demo-order-001",
    title: "REVIEW EXPECTED SHIPPING COST",
    description:
      "Target: 1 sample order / Order amount: ¥4,900. Verification of shipping cost discrepancy before order placement. Approving this does NOT trigger real payment or procurement.",
    amount_cap_minor: 4900,
    currency: "JPY",
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    reason: "Demo fixture demo_001: quoted shipping ¥1,550 exceeds estimate ¥900 by ¥650",
    risk: "low",
  },
];

export const initialBusinessSummary: BusinessSummary = {
  order_revenue_minor: 4900,
  order_revenue_currency: "JPY",
  example_orders_count: 1,
  mix_inquiries_count: 2,
  shipping_alerts_count: 1,
  net_profit_status: "UNKNOWN",
  last_verified_sync: "NEVER",
  provenance: "DEMO",
};

export const initialSystemStatus: SystemStatus = {
  mode: "DEMO",
  encryption_configured: false,
  build_version: "0.1.0-M0-DEMO",
  live_operations_enabled: false,
  model_requests_count: 0,
  connections: [
    {
      id: "shopify",
      name: "SHOPIFY",
      icon: "S",
      connected: false,
      statusText: "NOT CONNECTED",
    },
    {
      id: "gmail",
      name: "GMAIL",
      icon: "G",
      connected: false,
      statusText: "NOT CONNECTED",
    },
    {
      id: "calendar",
      name: "CALENDAR",
      icon: "C",
      connected: false,
      statusText: "NOT CONNECTED",
    },
    {
      id: "ticktick",
      name: "TICKTICK",
      icon: "T",
      connected: false,
      statusText: "NOT CONNECTED",
    },
  ],
  agents: [
    {
      id: "commerce",
      name: "COMMERCE AGENT",
      statusText: "DEMO / IDLE",
      idle: true,
    },
    {
      id: "creative",
      name: "CREATIVE AGENT",
      statusText: "DEMO / IDLE",
      idle: true,
    },
    {
      id: "assistant",
      name: "EXECUTIVE ASSISTANT",
      statusText: "DEMO / IDLE",
      idle: true,
    },
  ],
};
